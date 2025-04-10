import { getDb } from "./db";

interface NameRecord {
	id: number;
	name: string;
}

export default class NameModel {
	public static createName(name: string) {
		const db = getDb();
		const insert = db.prepare("INSERT OR IGNORE INTO name (name) VALUES (?)");
		const result = insert.run(name);
	}
}
