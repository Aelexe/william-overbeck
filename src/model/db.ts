import Database from "better-sqlite3";
import fs from "fs-extra";
import path from "path";
import { runMigrations } from "./migration";

// Interface for database configuration
interface DbConfig {
	filename: string;
	createTablesIfNotExist?: boolean;
}

// Shared database instance
let db: Database.Database | null = null;

/**
 * Initialises an SQLite database connection in the project root directory
 * @param config Configuration options for the database
 * @returns Database instance
 */
export function initialiseDatabase(config: DbConfig = { filename: "db.sqlite" }): Database.Database {
	try {
		// Determine project root directory.
		const dbPath = path.join(process.cwd(), config.filename);

		// Create backup if database file already exists
		if (fs.existsSync(dbPath)) {
			const backupDir = path.join(process.cwd(), "backups");
			fs.ensureDirSync(backupDir);

			const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
			const backupPath = path.join(
				backupDir,
				`${path.basename(config.filename, path.extname(config.filename))}_${timestamp}${path.extname(config.filename)}`
			);

			fs.copyFileSync(dbPath, backupPath);
			console.log(`Database backed up to ${backupPath}`);
		}

		// Ensure the directory exists.
		fs.ensureDirSync(path.dirname(dbPath));

		// Initialize the database connection.
		db = new Database(dbPath);

		// Enable foreign keys.
		db.pragma("foreign_keys = ON");

		db.function("regexp", (regex, text) => {
			return new RegExp(regex as string).test(text as string) ? 1 : 0;
		});

		runMigrations(path.join(process.cwd(), "migrations"));

		console.log("Database initialised.");
		return db;
	} catch (error) {
		console.error("Failed to initialise database:", error);
		throw error;
	}
}

/**
 * Gets the current database instance, throws if database has not been initialized
 */
export function getDb(): Database.Database {
	if (!db) {
		throw new Error("Database not initialized. Call initialiseDatabase first.");
	}
	return db;
}
