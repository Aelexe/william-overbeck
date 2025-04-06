import fs from "fs-extra";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Load worker src locally.
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, "pdf-worker.js");

//pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text content from a PDF file using pdfjs-dist
 * @param pdfPath Path to the PDF file
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPdf(pdfPath: string): Promise<string> {
	try {
		// Load the PDF document
		const rawData = await fs.readFile(pdfPath);
		const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(rawData) });
		const pdfDocument = await loadingTask.promise;

		let fullText = "";

		// Extract text from each page
		for (let i = 1; i <= pdfDocument.numPages; i++) {
			const page = await pdfDocument.getPage(i);
			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.filter((item) => "str" in item)
				.map((item) => (item.str !== "" ? item.str : "\n"))
				.join("");

			fullText += pageText + "\n";
		}

		return fullText;
	} catch (error) {
		console.error("Error extracting text from PDF:", error);
		throw error;
	}
}
