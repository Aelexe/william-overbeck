import { Page } from "playwright";

/**
 * Navigate to a specific submission page
 * @param page Puppeteer page instance
 * @param documentId The document ID of the submission
 * @param submitterRef The submitter reference or name
 */
export async function openSubmissionPage(page: Page, documentId: string, submitterRef: string): Promise<void> {
	try {
		const url = `https://www.parliament.nz/en/pb/sc/submissions-and-advice/document/${documentId}/${submitterRef}`;

		// Add timeout and waitUntil for more reliable navigation
		await page.goto(url, {
			waitUntil: "networkidle", // Playwright uses 'networkidle' instead of 'networkidle2'
		});
	} catch (error) {
		console.error(`Navigation error: ${error}`);
		throw error;
	}
}

/**
 * Parse the submission page content to extract details
 * @param page Puppeteer page instance
 * @returns An object containing the submitter name, published date, and PDF link
 */
export async function parseSubmissionPage(page: Page): Promise<{
	submitterName: string;
	publishedDate: string;
	documentId: string;
	documentHash: string;
}> {
	try {
		// Extract the submitter name from the title
		const titleElement = page.locator("h1.beta");
		let submitterName = "";
		if ((await titleElement.count()) > 0) {
			const titleText = (await titleElement.textContent()) || "";
			// Extract the portion after the last hyphen to handle titles with multiple hyphens
			const titleParts = titleText.split(" - ");
			if (titleParts.length > 1) {
				submitterName = titleParts[titleParts.length - 1].trim();
			}
		}

		// Extract the published date
		const dateElement = page.locator("span.publish-date");
		let publishedDate = "";
		if ((await dateElement.count()) > 0) {
			const dateText = (await dateElement.textContent()) || "";
			// Extract just the date portion, accounting for the <strong> tag
			const match = dateText.match(/Published date:?\s*(.+)/i);
			if (match && match[1]) {
				publishedDate = match[1].trim();
			}
		}

		// Extract the PDF link - more specific selector for the PDF link in related-links section
		const pdfLinkElement = page.locator('span.related-links__legacy-link a[href*="/resource/"]');
		let pdfLink = "";
		if ((await pdfLinkElement.count()) > 0) {
			pdfLink = (await pdfLinkElement.getAttribute("href")) || "";
		}

		// If the specific selector failed, try a more general one as fallback
		if (!pdfLink) {
			const fallbackPdfElement = page.locator('.related-links__item a[href*="/resource/"]');
			if ((await fallbackPdfElement.count()) > 0) {
				pdfLink = (await fallbackPdfElement.getAttribute("href")) || "";
			}
		}

		// Split the PDF link by / and get the last two parts.
		const pdfParts = pdfLink.split("/");

		let documentId = "";
		let documentHash = "";

		if (pdfParts.length >= 2) {
			documentId = pdfParts[pdfParts.length - 2] || "";
			documentHash = pdfParts[pdfParts.length - 1] || "";
		}

		return {
			submitterName,
			publishedDate,
			documentId,
			documentHash,
		};
	} catch (error) {
		console.error(`Error parsing submission page: ${error}`);
		throw error;
	}
}

/**
 * Download the submission PDF document
 * @param page Puppeteer page instance
 * @param downloadPath Path where the PDF should be saved
 * @returns The path to the downloaded file
 */
export async function downloadSubmissionPDF(page: Page, downloadPath: string): Promise<void> {
	try {
		console.log(`Starting PDF download to ${downloadPath}`);

		await page.goto("https://example.com/sample.pdf", { waitUntil: "networkidle" });

		// Wait for PDF viewer to load.
		await page.waitForTimeout(2000);

		// Press Ctrl+S to open the save dialog
		await page.keyboard.press("Control+S");

		// Wait for the save dialog and press Enter to use default name
		await page.waitForTimeout(1000);
		await page.keyboard.press("Enter");

		// Wait for download to complete
		const download = await page.waitForEvent("download");
		await download.saveAs("./downloads/document.pdf");

		console.log(`PDF successfully downloaded to ${downloadPath}`);
	} catch (error) {
		console.error(`Error downloading PDF: ${error}`);
		throw error;
	}
}
