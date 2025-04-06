import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { Browser, Page } from "playwright";
import { getBrowser } from "./browser";
import { initialiseDatabase } from "./model/db";
import ScrapingHistory from "./model/scraping-history";
import Submission from "./model/submission";
import { extractTextFromPdf } from "./pdf";
import { downloadPdf } from "./pdf-page";
import { openSubmissionPage, parseSubmissionPage } from "./submission-page";
import { openSubmissionsPage, parseSubmissionsPage } from "./submissions-page";

const pdfDir = path.resolve(process.cwd(), "pdf");
fs.ensureDirSync(pdfDir);

async function main(): Promise<void> {
	// Initialise the database.
	initialiseDatabase();

	let browser: Browser | null = null;
	try {
		browser = await getBrowser();
		const page = browser.contexts()[0].pages()[0];

		let pageNumber = ScrapingHistory.getCurrentPage();
		let continueScraping = true;

		while (continueScraping) {
			pageNumber++;
			const submissionCount = await scrapeSubmissionsPage(page, "Principles of the Treaty of Waitangi", pageNumber);

			if (submissionCount !== 20) {
				// If there's less than 20 submissions that means it's an incomplete page, and more submissions will be added to it later.
				break;
			}
			ScrapingHistory.updatePage(pageNumber);
		}
	} catch (error) {
		console.error("An error occurred:", error);
	} finally {
		// Ensure browser closes even if there's an error
		if (browser) {
			//await browser.close();
			console.log("Browser closed successfully");
		}
	}
}

async function scrapeSubmissionsPage(page: Page, keyword: string, pageNumber: number): Promise<number> {
	await openSubmissionsPage(page, keyword, pageNumber);

	// Parse the submissions page
	const pageData = await parseSubmissionsPage(page);
	console.log(`Loaded page ${chalk.green(pageData.currentPage)} of ${chalk.greenBright(pageData.totalPages)}`);
	console.log(`Found ${chalk.green(pageData.submissions.length)} submissions.`);

	for (let i = 0; i < pageData.submissions.length; i++) {
		const submissionDetails = pageData.submissions[i];

		// Update the date because I had the parsing wrong initially.
		Submission.updateSubmittedTimestamp(submissionDetails.documentId, submissionDetails.submittedTimestamp);

		if (Submission.isSubmissionDownloaded(submissionDetails.documentId)) {
			continue;
		}

		if (!Submission.submissionExists(submissionDetails.documentId)) {
			console.log(
				`Found new submission: ${chalk.blue(submissionDetails.submitterName)} - ${chalk.green(
					submissionDetails.submittedTimestamp.toFormat("dd/MM/yyyy")
				)}`
			);
			Submission.insertSubmission(
				submissionDetails.documentId,
				submissionDetails.submitterName,
				submissionDetails.submittedTimestamp
			);
		}

		let documentHash = Submission.getDocumentHash(submissionDetails.documentId);

		if (!documentHash) {
			console.log(
				`Getting document hash: ${chalk.blue(submissionDetails.submitterName)} - ${chalk.green(
					submissionDetails.submittedTimestamp.toFormat("dd/MM/yyyy")
				)}`
			);
			await openSubmissionPage(page, submissionDetails.documentId, submissionDetails.submitterReference);
			const submission = await parseSubmissionPage(page);
			documentHash = submission.documentHash;
			if (documentHash) {
				Submission.updateDocumentHash(submissionDetails.documentId, documentHash);
			} else {
				throw new Error("Document hash not found");
			}
		}

		console.log(
			`Downloading PDF: ${chalk.blue(submissionDetails.submitterName)} - ${chalk.green(
				submissionDetails.submittedTimestamp.toFormat("dd/MM/yyyy")
			)}`
		);
		const filePath = path.join(pdfDir, `${submissionDetails.documentId}.pdf`);
		await downloadPdf(page, submissionDetails.documentId, documentHash!, filePath);
		Submission.flagSubmissionAsDownloaded(submissionDetails.documentId);
	}

	return pageData.submissions.length;
}

main();

async () => {
	// Get all PDFs in the pdf folder.
	const pdfDir = path.resolve(process.cwd(), "pdf");
	const pdfFiles = await fs.readdir(pdfDir);
	console.log("PDF files in the directory:", pdfFiles);

	// Then parse them.
	for (const pdfFile of pdfFiles) {
		const pdfPath = path.join(pdfDir, pdfFile);
		const text = await extractTextFromPdf(pdfPath);
		console.log(`Extracted text from ${pdfFile}:\n`, text);
		// Write text to file.
		const textFilePath = path.join(pdfDir, `${path.parse(pdfFile).name}.txt`);

		await fs.writeFile(textFilePath, text, "utf-8");
		console.log(`Extracted text saved to ${textFilePath}`);
	}
};
