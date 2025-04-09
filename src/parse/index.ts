import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import PDFModel from "../model/pdf-model";
import SubmissionModel from "../model/submission";
import { SubmissionLinkModel } from "../model/submission-link-model";
import { PDF_DIR } from "../paths";
import { parsePdf } from "./pdf";

export default async function parseSubmissions(options?: { limit?: number; reset?: boolean }) {
	console.log("Parsing submissions.");

	if (options?.reset) {
		console.log("Resetting all submissions.");
		SubmissionModel.clearAllSubmissionContent();
	}

	linkSupplementarySubmissions();
	await parsePdfs(options);
}

function linkSupplementarySubmissions() {
	const supplementarySubmissions = SubmissionModel.findUnlinkedSupplementarySubmissions();

	const submissionMap = new Map<string, number>();

	for (const submission of supplementarySubmissions) {
		const submitter = submission.submitter.replace(/Supp [0-9]+$/, "").trim();
		const order = parseInt(submission.submitter.match(/Supp ([0-9]+)/)?.[1] || "0", 10);

		if (!submissionMap.has(submitter)) {
			const parentId = SubmissionModel.findParentSubmission(submitter, submission.submitted_timestamp);
			submissionMap.set(submitter, parentId);
		}

		if (!submissionMap.has(submitter)) {
			throw new Error(`Parent submission not found for ${submission.submitter}`);
		}

		console.log(`Creating submission link ${submission.submitter} #${order}.`);
		SubmissionLinkModel.addLink(submission.id, submissionMap.get(submitter)!, order);
	}
}

async function parsePdfs(options?: { limit?: number; reset?: boolean }) {
	const submissions = SubmissionModel.selectUnparsedSubmissions();
	console.log(`Found ${chalk.green(submissions.length)} unparsed submissions.`);

	let i = 0;

	for (const submission of submissions) {
		console.log(`Parsing submission ${submission.document_id}.`);

		const childSubmissions = SubmissionModel.selectChildSubmissions(submission.id);
		if (childSubmissions.length > 0) {
			console.log(` Found ${chalk.green(childSubmissions.length)} child submissions.`);
		}

		const pdfPaths = [submission.document_id, ...childSubmissions.map((s) => s.document_id)].map((id) =>
			path.join(PDF_DIR, `${id}.pdf`)
		);

		if (pdfPaths.map((p) => fs.existsSync(p)).includes(false)) {
			console.log(`\tMissing .pdf file not found for ${submission.document_id}.`);
		}

		const pdfs = await Promise.all(pdfPaths.map((pdfPath) => parsePdf(pdfPath)));
		const content = pdfs.map((pdf) => pdf.text).join("\n\n");
		const size = pdfs.reduce((acc, pdf) => acc + pdf.size, 0);
		const imageCount = pdfs.reduce((acc, pdf) => acc + pdf.images.length, 0);

		PDFModel.setPdfDetails(submission.id, content, size, imageCount);

		i++;

		if (options?.limit && i >= options.limit) {
			console.log(`Parsed limit of ${options.limit}.`);
			break;
		}
	}
}
