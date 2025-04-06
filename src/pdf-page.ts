import { Page } from "playwright";

export async function downloadPdf(
	page: Page,
	documentId: string,
	documentHash: string,
	filePath: string
): Promise<void> {
	try {
		// Construct the URL
		const url = `https://www.parliament.nz/resource/en-NZ/${documentId}/${documentHash}`;

		// Set up the download listener BEFORE navigating
		const downloadPromise = page.waitForEvent("download");

		// Navigate to the PDF page
		await page.goto(url, { waitUntil: "networkidle" }).catch((err) => {
			// This is expected - the download will interrupt navigation
			if (err.message.includes("Download is starting")) {
				// Noop.
			} else {
				// If it's a different error, we should log it
				console.error("Navigation error:", err);
			}
		});

		// Wait for the download to start
		const download = await downloadPromise;

		// Save to the specified path
		await download.saveAs(filePath);
	} catch (error) {
		console.error("Error opening PDF page:", error);
		throw error; // Rethrow the error for further handling if needed
	}
}
