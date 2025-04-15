import { getDb } from "./db";

export default class SubmissionNameModel {
	/**
	 * Insert a new submission name entry into the database
	 * @param submissionName The submission name data to insert
	 * @returns The ID of the inserted row
	 */
	public static async insert(documentId: string, names: string[]) {
		const db = await getDb();

		const firstName = names[0] || null;
		const middleNames = names.slice(1, -1).join(" ") || null;
		const lastName = names[names.length - 1] || null;

		db.prepare(
			"DELETE FROM submission_name WHERE submission_id = (SELECT id FROM submission WHERE document_id = ?)"
		).run(documentId);

		db.prepare(
			`INSERT INTO submission_name (submission_id, first_name, middle_names, last_name)
      		 VALUES ((SELECT id FROM submission WHERE document_id = ?), ?, ?, ?)`
		).run(documentId, firstName, middleNames, lastName);
	}
}
