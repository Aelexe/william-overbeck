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
	pdfjsLib.OPS.paintSolidColorImageMask,
];

interface PDF {
	text: string;
	size: number;
	images: (PDFImage | null)[];
}
interface PDFImage {
	width: number;
	height: number;
	size: number;
}

export async function parsePdf(pdfPath: string): Promise<PDF> {
	try {
		const pdf = await fs.readFile(pdfPath);
		// Get the file size.
		const pdfStats = await fs.stat(pdfPath);
		const pdfSize = pdfStats.size;
		const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdf), verbosity: 0 });
		const pdfDocument = await loadingTask.promise;

		let text = "";
		const images: (PDFImage | null)[] = [];

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

			for (const imageOperation of imageOperations) {
				if (!page.objs.has(imageOperation.args[0])) {
					images.push(null);
					continue;
				}
				const imageObject = await page.objs.get(imageOperation.args[0]);
				images.push({
					width: imageObject.width,
					height: imageObject.height,
					size: imageObject.data.length,
				});
			}

			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.filter((item) => "str" in item)
				.map((item) => (item.str !== "" ? item.str : "\n"))
				.join("");

			text += pageText + "\n";
		}

		if (/^[^a-zA-Z]+$/.test(text)) {
			text = "";
		}

		return {
			text,
			size: pdfSize,
			images,
		};
	} catch (error) {
		console.error("Error extracting text from PDF:", error);
		throw error;
	}
}
