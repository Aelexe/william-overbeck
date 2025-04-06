import { getDb } from "./db";

export default class ScrapingHistory {
	/**
	 * Gets the current page value from the scraping history
	 * @returns The current page value
	 */
	public static getCurrentPage(): number {
		const database = getDb();
		const stmt = database.prepare(`
            SELECT page 
            FROM scraping_history
            LIMIT 1
        `);

		return stmt.pluck().get() as number;
	}

	/**
	 * Updates the page value in the scraping history
	 * @param page The new page value to set
	 */
	public static updatePage(page: number): void {
		const database = getDb();
		const stmt = database.prepare(`
            UPDATE scraping_history
            SET page = ?
        `);

		stmt.run(page);
	}
}
