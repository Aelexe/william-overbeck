import { getDb } from "./db";

export interface SubmissionLink {
	id?: number;
	parent_submission_id: number;
	child_submission_id: number;
	link_order: number;
	created_at?: string;
}

export class SubmissionLinkModel {
	/**
	 * Insert a new submission link or ignore if the child submission is already linked
	 * @param db Database connection
	 * @param link The submission link to insert
	 * @returns The inserted submission link with ID
	 */
	public static async addLink(child: number, parent: number, order: number) {
		const db = getDb();
		const stmt = db.prepare(
			`INSERT OR IGNORE INTO submission_link (parent_submission_id, child_submission_id, link_order) VALUES (?, ?, ?)`
		);
		const result = stmt.run(parent, child, order);
		return result.changes > 0;
	}
}
