import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import SubmissionModel from "../model/submission";
import { PDF_DIR } from "../paths";
import { extractTextFromPdf } from "./pdf";

async () => {
	// Get all PDFs in the pdf folder.
	const pdfFiles = await fs.readdir(PDF_DIR);
	console.log("PDF files in the directory:", pdfFiles);

	// Then parse them.
	for (const pdfFile of pdfFiles) {
		const pdfPath = path.join(PDF_DIR, pdfFile);
		const text = await extractTextFromPdf(pdfPath);
		console.log(`Extracted text from ${pdfFile}:\n`, text);
		// Write text to file.
		const textFilePath = path.join(PDF_DIR, `${path.parse(pdfFile).name}.txt`);

		await fs.writeFile(textFilePath, text, "utf-8");
		console.log(`Extracted text saved to ${textFilePath}`);
	}
};

export default async function parseSubmissions() {
	const submissions = SubmissionModel.selectUnparsedSubmissions();
	console.log(`Found ${chalk.green(submissions.length)} unparsed submissions.`);

	let i = 0;

	for (const submission of submissions) {
		console.log(`Parsing submission ${submission.document_id}.`);
		const pdfPath = path.join(PDF_DIR, `${submission.document_id}.pdf`);

		if (!fs.existsSync(pdfPath)) {
			throw new Error(`PDF file not found: ${pdfPath}`);
		}

		const text = await extractTextFromPdf(pdfPath);
		SubmissionModel.setSubmissionContent(submission.document_id, text);

		i++;
		if (i >= 100) {
			break;
		}
	}
}
