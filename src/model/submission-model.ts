import { DateTime } from "luxon";
import { getDb } from "./db";

export interface Submission {
	id: number;
	document_id: string;
	document_hash: string | null;
	submitted_timestamp: DateTime;
	submitter: string;
	content: string | null;
	is_downloaded: boolean;
}

export default class SubmissionModel {
	public static selectSubmissions(): Submission[] {
		const database = getDb();
		const statement = database.prepare(`
				SELECT s.* FROM submission s
				LEFT JOIN submission_link sl ON s.id = sl.child_submission_id
				WHERE sl.id IS NULL
			`);

		return statement.all() as Submission[];
	}

	public static selectSubmissionsForGroupAnalysis(): Submission[] {
		const database = getDb();
		const stmt = database.prepare(`
			SELECT s.*
			FROM submission s
			LEFT JOIN submission_link sl ON s.id = sl.child_submission_id
			WHERE sl.id IS NULL
			AND s.is_group IS NULL
		`);

		return stmt.all() as Submission[];
	}

	/**
	 * Inserts a new submission into the database
	 * @param documentId Unique identifier of the document
	 * @param submitter Name or identifier of the submitter
	 * @param documentHash Hash of the document content
	 * @returns The ID of the inserted submission
	 */
	public static insertSubmission(
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
	public static submissionExists(documentId: string): boolean {
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
	public static getDocumentHash(documentId: string): string | null {
		const database = getDb();
		const stmt = database.prepare(`
            SELECT document_hash
            FROM submission
            WHERE document_id = ?
        `);

		return stmt.pluck().get(documentId) as string | null;
	}

	public static updateDocumentHash(documentId: string, documentHash: string): void {
		const database = getDb();
		const stmt = database.prepare(`
			UPDATE submission
			SET document_hash = ?
			WHERE document_id = ?
		`);

		stmt.run(documentHash, documentId);
	}

	public static updateSubmittedTimestamp(documentId: string, submittedTimestamp: DateTime): void {
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
	public static isSubmissionDownloaded(documentId: string): boolean {
		const database = getDb();
		const stmt = database.prepare(`
            SELECT EXISTS(
                SELECT 1 FROM submission
                WHERE document_id = ? AND is_downloaded = TRUE
            ) as exists_flag
        `);

		return stmt.pluck().get(documentId) === 1;
	}

	public static selectUndownloadedSubmissions(): Submission[] {
		const database = getDb();
		const stmt = database.prepare(`
			SELECT *
			FROM submission
			WHERE NOT is_downloaded
		`);

		return stmt.all() as Submission[];
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

	public static selectChildSubmissions(parentId: number): Submission[] {
		const database = getDb();
		const stmt = database.prepare(`
			SELECT s.*
			FROM submission s
			INNER JOIN submission_link sl ON s.id = sl.child_submission_id
			WHERE sl.parent_submission_id = ?
			ORDER BY sl.link_order ASC
		`);
		return stmt.all(parentId) as Submission[];
	}

	public static findUnlinkedSupplementarySubmissions(): {
		id: number;
		submitter: string;
		submitted_timestamp: DateTime;
	}[] {
		const database = getDb();
		const stmt = database.prepare(`
			SELECT s.id, s.submitter, s.submitted_timestamp
			FROM submission s
			LEFT JOIN submission_link sl ON s.id = sl.child_submission_id
			WHERE sl.id IS NULL
			AND submitter REGEXP '.*Supp [0-9]$';
		`);

		return (stmt.all() as { id: number; submitter: string; submitted_timestamp: string }[]).map((row) => ({
			...row,
			submitted_timestamp: DateTime.fromISO(row.submitted_timestamp),
		}));
	}

	public static findParentSubmission(submitter: string, timestamp: DateTime): number {
		const database = getDb();
		const stmt = database.prepare(`
			SELECT id
			FROM submission
			WHERE submitter = ? AND submitted_timestamp = ?
		`);

		return stmt.pluck().get(submitter, timestamp.toISO()) as number;
	}

	public static selectUnparsedSubmissions(): Submission[] {
		const database = getDb();
		const stmt = database.prepare(`
			SELECT s.*
			FROM submission s
			LEFT JOIN submission_link sl ON s.id = sl.child_submission_id
      		LEFT JOIN pdf ON pdf.submission_id = s.id
			WHERE s.is_downloaded AND pdf.content IS NULL AND sl.id IS NULL
		`);

		return stmt.all() as Submission[];
	}

	public static clearAllSubmissionContent(): void {
		const database = getDb();
		const stmt = database.prepare(`
			UPDATE submission
			SET content = NULL
		`);

		stmt.run();
	}

	/**
	 * Updates the group_analyzed status of a submission
	 * @param documentId Unique identifier of the document
	 * @param isGrouped Boolean indicating whether the submission has been analyzed in a group
	 */
	public static updateGroupStatus(documentId: string, isGrouped: boolean): void {
		const database = getDb();
		const stmt = database.prepare(`
			UPDATE submission
			SET is_group = ?
			WHERE document_id = ?
		`);

		stmt.run(isGrouped ? 1 : 0, documentId);
	}
}
