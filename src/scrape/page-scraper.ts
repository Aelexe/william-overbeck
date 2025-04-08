import chalk from "chalk";
import path from "path";
import { Page } from "playwright";
import PageRecordModel from "../model/page-record-model";
import SubmissionModel from "../model/submission";
import { PDF_DIR } from "../paths";
import { returnPage } from "./browser";
import { downloadPdf } from "./pdf-page";
import { openSubmissionPage, parseSubmissionPage } from "./submission-page";
import { openSubmissionsPage, PageData, parseSubmissionsPage } from "./submissions-page";

export default class PageScraper {
	private page: Page;
	private keyword: string;
	private pages: number[];

	constructor(page: Page, keyword: string, pages: number[]) {
		this.page = page;
		this.keyword = keyword;
		this.pages = pages;
	}

	public async start(): Promise<void> {
		while (true) {
			const pageNumber = this.pages.splice(0, 1)[0];

			if (!pageNumber) {
				console.log("No more pages to scrape. Exiting.");
				returnPage(this.page);
				break;
			}

			try {
				const pageData = await this.scrapeSubmissionsPage(this.page, this.keyword, pageNumber);

				if (pageData.submissions.length === 20) {
					// Only flag page as scraped if it contained 20 submissions. It may contain more submissions in the future otherwise.
					PageRecordModel.flagAsScraped(pageNumber);
				}
			} catch (error) {
				console.error(`Error scraping page ${pageNumber}:`, error);
				console.log("Waiting for 5 minutes before continuing.");
				await new Promise((resolve) => setTimeout(resolve, 60000 * 5));
			}
		}
	}

	public async scrapeSubmissionsPage(page: Page, keyword: string, pageNumber: number): Promise<PageData> {
		await openSubmissionsPage(page, keyword, pageNumber);

		// Parse the submissions page
		const pageData = await parseSubmissionsPage(page);
		const newSubmissions = pageData.submissions.filter((submission) => {
			return !SubmissionModel.submissionExists(submission.documentId);
		});
		console.log(`Loaded page ${chalk.green(pageData.currentPage)} of ${chalk.greenBright(pageData.totalPages)}`);
		console.log(
			`Found ${chalk.green(newSubmissions.length)} new submissions (${chalk.green(pageData.submissions.length)} total).`
		);

		for (const submissionDetails of newSubmissions) {
			// Update the date because I had the parsing wrong initially.
			SubmissionModel.updateSubmittedTimestamp(submissionDetails.documentId, submissionDetails.submittedTimestamp);

			if (SubmissionModel.isSubmissionDownloaded(submissionDetails.documentId)) {
				continue;
			}

			if (!SubmissionModel.submissionExists(submissionDetails.documentId)) {
				console.log(
					`Found new submission: ${chalk.blue(submissionDetails.submitterName)} - ${chalk.green(
						submissionDetails.submittedTimestamp.toFormat("dd/MM/yyyy")
					)}`
				);
				SubmissionModel.insertSubmission(
					submissionDetails.documentId,
					submissionDetails.submitterName,
					submissionDetails.submittedTimestamp
				);
			}

			let documentHash = SubmissionModel.getDocumentHash(submissionDetails.documentId);

			if (!documentHash) {
				console.log(
					`Getting document hash: ${chalk.blue(submissionDetails.submitterName)} - ${chalk.green(
						submissionDetails.submittedTimestamp.toFormat("dd/MM/yyyy")
					)}`
				);
				await openSubmissionPage(page, submissionDetails.documentId, submissionDetails.submitterReference);

				let submission = await parseSubmissionPage(page);
				documentHash = submission.documentHash;

				// Occasionally this page doesn't load properly initially, so try to reparse after a brief delay.
				await new Promise((resolve) => setTimeout(resolve, 5000));

				submission = await parseSubmissionPage(page);
				documentHash = submission.documentHash;

				if (documentHash) {
					SubmissionModel.updateDocumentHash(submissionDetails.documentId, documentHash);
				} else {
					throw new Error("Document hash not found");
				}
			}

			console.log(
				`Downloading PDF: ${chalk.blue(submissionDetails.submitterName)} - ${chalk.green(
					submissionDetails.submittedTimestamp.toFormat("dd/MM/yyyy")
				)}`
			);
			const filePath = path.join(PDF_DIR, `${submissionDetails.documentId}.pdf`);
			await downloadPdf(page, submissionDetails.documentId, documentHash!, filePath);
			SubmissionModel.flagSubmissionAsDownloaded(submissionDetails.documentId);
		}

		return pageData;
	}
}
