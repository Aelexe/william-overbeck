import { getDb } from "./db";

interface NameRecord {
	id: number;
	name: string;
}

export default class NameModel {
	public static createName(name: string) {
		const db = getDb();
		const insert = db.prepare("INSERT OR IGNORE INTO name (name) VALUES (?)");
		insert.run(name.toLocaleLowerCase());
	}

	public static selectNames(): string[] {
		const db = getDb();
		const select = db.prepare("SELECT name FROM name ");
		return select.pluck().all() as string[];
	}
}
