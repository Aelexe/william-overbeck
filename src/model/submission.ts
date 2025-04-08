import { DateTime } from "luxon";
import { getDb } from "./db";

interface Submission {
	document_id: string;
	document_hash: string | null;
	submitted_timestamp: DateTime;
	submitter: string;
	content: string | null;
	is_downloaded: boolean;
}

export default class SubmissionModel {
	/**
	 * Inserts a new submission into the database
	 * @param documentId Unique identifier of the document
	 * @param submitter Name or identifier of the submitter
	 * @param documentHash Hash of the document content
	 * @returns The ID of the inserted submission
	 */
	static insertSubmission(
		documentId: string,
		submitter: string,
		submittedTimestamp: DateTime,
		documentHash: string | null = null
	): number {
		const database = getDb();
		const stmt = database.prepare(`
            INSERT INTO submission (document_id, document_hash, submitted_timestamp, submitter)
            VALUES (?, ?, ?, ?)
        `);

		const result = stmt.run(documentId, documentHash, submittedTimestamp.toISO(), submitter);
		return result.lastInsertRowid as number;
	}

	/**
	 * Checks if a submission with the given document ID already exists
	 * @param documentId Unique identifier of the document to check
	 * @returns True if the submission exists, false otherwise
	 */
	static submissionExists(documentId: string): boolean {
		const database = getDb();
		const stmt = database.prepare(`
            SELECT EXISTS(
                SELECT 1 FROM submission
                WHERE document_id = ?
            ) as exists_flag
        `);

		return stmt.pluck().get(documentId) === 1;
	}

	/**
	 * Gets the document hash for a specific submission
	 * @param documentId Unique identifier of the document
	 * @returns The document hash as a string, or null if not found
	 */
	static getDocumentHash(documentId: string): string | null {
		const database = getDb();
		const stmt = database.prepare(`
            SELECT document_hash
            FROM submission
            WHERE document_id = ?
        `);

		return stmt.pluck().get(documentId) as string | null;
	}

	static updateDocumentHash(documentId: string, documentHash: string): void {
		const database = getDb();
		const stmt = database.prepare(`
			UPDATE submission
			SET document_hash = ?
			WHERE document_id = ?
		`);

		stmt.run(documentHash, documentId);
	}

	static updateSubmittedTimestamp(documentId: string, submittedTimestamp: DateTime): void {
		const database = getDb();
		const stmt = database.prepare(`
			UPDATE submission
			SET submitted_timestamp = ?
			WHERE document_id = ?
		`);
		stmt.run(submittedTimestamp.toISO(), documentId);
	}

	/**
	 * Checks if a submission has already been downloaded
	 * @param documentId Unique identifier of the document to check
	 * @returns True if the submission is downloaded, false otherwise
	 */
	static isSubmissionDownloaded(documentId: string): boolean {
		const database = getDb();
		const stmt = database.prepare(`
            SELECT EXISTS(
                SELECT 1 FROM submission
                WHERE document_id = ? AND is_downloaded = TRUE
            ) as exists_flag
        `);

		return stmt.pluck().get(documentId) === 1;
	}

	/**
	 * Updates a submission record to mark it as downloaded
	 * @param documentId Document identifier of the submission to update
	 */
	public static flagSubmissionAsDownloaded(documentId: string): void {
		const database = getDb();
		const stmt = database.prepare(`
            UPDATE submission
            SET is_downloaded = TRUE
            WHERE document_id = ?
        `);

		stmt.run(documentId);
	}

	public static selectUnparsedSubmissions(): Submission[] {
		const database = getDb();
		const stmt = database.prepare(`
			SELECT *
			FROM submission
			WHERE content IS NULL AND is_downloaded = TRUE
		`);

		return stmt.all() as Submission[];
	}

	/**
	 * Sets the content for a submission record
	 * @param documentId Document identifier of the submission to update
	 * @param content The content to be stored
	 */
	static setSubmissionContent(documentId: string, content: string): void {
		const database = getDb();
		const stmt = database.prepare(`
            UPDATE submission
            SET content = ?
            WHERE document_id = ?
        `);

		stmt.run(content, documentId);
	}
}
