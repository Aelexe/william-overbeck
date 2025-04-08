import fs from "fs-extra";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, "pdf-worker.js");
//pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const IMAGE_OPERATORS = [
	pdfjsLib.OPS.paintImageXObject,
	pdfjsLib.OPS.paintImageMaskXObject,
	pdfjsLib.OPS.paintJpegXObject,
	pdfjsLib.OPS.paintImageXObjectRepeat,
	pdfjsLib.OPS.paintImageMaskXObjectRepeat,
	pdfjsLib.OPS.paintImageMaskXObjectGroup,
	pdfjsLib.OPS.paintInlineImageXObject,
	pdfjsLib.OPS.paintInlineImageXObjectGroup,
];

/**
 * Extract text content from a PDF file.
 * @param pdfPath Path to the PDF file
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPdf(pdfPath: string): Promise<string> {
	try {
		// Load the PDF document
		const rawData = await fs.readFile(pdfPath);
		const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(rawData), verbosity: 0 });
		const pdfDocument = await loadingTask.promise;

		let fullText = "";

		// Extract text from each page
		for (let i = 1; i <= pdfDocument.numPages; i++) {
			const page = await pdfDocument.getPage(i);
			const operators = await page.getOperatorList();
			const imageOperations = operators.fnArray
				.map((op, i) => {
					if (!IMAGE_OPERATORS.includes(op)) {
						return null;
					}

					return {
						operator: op,
						args: operators.argsArray[i],
					};
				})
				.filter((op) => op !== null);

			if (imageOperations.length > 0) {
				console.log(pdfPath);
				const imageObject = await page.objs.get(imageOperations[0].args[0]);
				break;
			}

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
