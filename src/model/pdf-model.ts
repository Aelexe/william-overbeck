import { getDb } from "./db";

export default class PDFModel {
	public static setPdfDetails(submissionId: number, content: string, size: number, imageCount: number): void {
		const database = getDb();

		// Check if a PDF record already exists for this submission
		const existingRecord = database.prepare(`SELECT 1 FROM pdf WHERE submission_id = ?`).pluck().get(submissionId) as
			| number
			| undefined;

		if (existingRecord) {
			// Update existing record
			database
				.prepare(
					`UPDATE pdf
						SET content = ?, size = ?, image_count = ?
						WHERE submission_id = ?`
				)
				.run(content, size, imageCount, submissionId);
		} else {
			// Insert new record
			database
				.prepare(
					`INSERT INTO pdf (submission_id, content, size, image_count)
						VALUES (?, ?, ?, ?)`
				)
				.run(submissionId, content, size, imageCount);
		}
	}

	public static setPdfContent(submissionId: number, content: string): void {
		const database = getDb();
		database.prepare(`UPDATE pdf SET content = ? WHERE submission_id = ?`).run(content, submissionId);
	}
}
