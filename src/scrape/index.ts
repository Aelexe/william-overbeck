import chalk from "chalk";
import { Browser } from "playwright";
import PageRecordModel from "../model/page-record-model";
import SubmissionModel from "../model/submission-model";
import getProgressBar from "../utils/progress-bar";
import { getBrowser, getPage, returnPage } from "./browser";
import PageScraper from "./page-scraper";
import { openSubmissionPage, parseSubmissionPage } from "./submission-page";
import { openSubmissionsPage, parseSubmissionsPage } from "./submissions-page";

const BILL_NAME = "Principles of the Treaty of Waitangi";
const CONCURRENT_COUNT = 4;

let browser: Browser | null = null;

export async function scrapeBills(): Promise<void> {
	console.log("Scraping bills.");

	try {
		browser = await getBrowser();
		const page = await getPage();

		const undownloadedSubmissions = SubmissionModel.selectUndownloadedSubmissions();

		console.log(`Found ${chalk.green(undownloadedSubmissions.length)} undownloaded submissions.`);

		for (const submission of undownloadedSubmissions) {
			await openSubmissionPage(page, submission.document_id);
			await parseSubmissionPage(page);
		}

		await openSubmissionsPage(page, BILL_NAME, 1);
		const pageData = await parseSubmissionsPage(page);
		returnPage(page);

		if (pageData.submissions.length === 0) {
			console.log("No submissions found. Exiting.");
			return;
		}

		PageRecordModel.addPageRange(1, pageData.totalPages);
		console.log(`Found ${chalk.green(pageData.totalPages)} pages of submissions.`);

		const unscrapedPages = PageRecordModel.getAllUnscraped();

		if (unscrapedPages.length === 0) {
			console.log("No new pages to scrape. Exiting.");
			return;
		}

		console.log(`Scraping ${chalk.green(unscrapedPages.length)} pages.`);
		console.log(getProgressBar(pageData.totalPages - unscrapedPages.length, pageData.totalPages));

		// Split the unscraped pages into a number of arrays equal to the conrrent count.
		const chunkSize = Math.ceil(unscrapedPages.length / CONCURRENT_COUNT);
		const pageChunks: number[][] = [];
		for (let i = 0; i < unscrapedPages.length; i += chunkSize) {
			pageChunks.push(unscrapedPages.slice(i, i + chunkSize));
		}

		console.log(`Split pages into chunks [${pageChunks.map((chunk) => chunk.length).join(", ")}]`);

		await Promise.all(
			pageChunks.map(async (pages) => {
				const page = await getPage();
				const pageScraper = new PageScraper(page, BILL_NAME, pages);
				await pageScraper.start();
			})
		);
	} catch (error) {
		console.error("An error occurred:", error);
	} finally {
		// Ensure browser closes even if there's an error
		if (browser) {
			//await browser.close();
			console.log("Browser closed successfully");
			process.exit(0);
		}
	}
}
