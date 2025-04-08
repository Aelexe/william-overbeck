import { getDb } from "./db";

interface PageRecord {
	page_number: number;
	is_scraped: boolean;
}

export default class PageRecordModel {
	/**
	 * Get a record for a specific page number
	 * @param pageNumber The page number to look up
	 * @returns The page record or undefined if not found
	 */
	public static getByPageNumber(pageNumber: number): PageRecord | null {
		const db = getDb();
		return db
			.prepare("SELECT page_number, is_scraped FROM page_record WHERE page_number = ?")
			.get(pageNumber) as PageRecord | null;
	}

	/**
	 * Get all page records
	 * @returns Array of page records
	 */
	public static getAll(): PageRecord[] {
		const db = getDb();
		return db.prepare("SELECT page_number, is_scraped FROM page_record ORDER BY page_number").all() as PageRecord[];
	}

	/**
	 * Get all unscraped page records
	 * @returns Array of unscraped page numbers
	 */
	public static getAllUnscraped(): number[] {
		const db = getDb();
		return db
			.prepare("SELECT page_number FROM page_record WHERE is_scraped = FALSE ORDER BY page_number")
			.pluck()
			.all() as number[];
	}

	/**
	 * Flag a page as scraped
	 * @param pageNumber The page number that was scraped
	 * @returns Success of the operation
	 */
	public static flagAsScraped(pageNumber: number): boolean {
		const db = getDb();
		const result = db.prepare("UPDATE page_record SET is_scraped = TRUE WHERE page_number = ?").run(pageNumber);
		return result.changes > 0;
	}

	/**
	 * Add new page numbers to the database
	 * @param startPage The starting page number
	 * @param endPage The ending page number
	 * @returns Success of the operation
	 */
	public static addPageRange(startPage: number, endPage: number): boolean {
		const db = getDb();
		const stmt = db.prepare("INSERT OR IGNORE INTO page_record (page_number, is_scraped) VALUES (?, FALSE)");

		const transaction = db.transaction((start: number, end: number) => {
			for (let page = start; page <= end; page++) {
				stmt.run(page);
			}
		});

		transaction(startPage, endPage);
		return true;
	}

	/**
	 * Reset the scraped status of pages
	 * @param startPage The starting page number
	 * @param endPage The ending page number
	 * @returns Success of the operation
	 */
	public static resetPages(startPage: number, endPage: number): boolean {
		const db = getDb();
		const result = db
			.prepare("UPDATE page_record SET is_scraped = FALSE WHERE page_number BETWEEN ? AND ?")
			.run(startPage, endPage);
		return result.changes > 0;
	}
}
