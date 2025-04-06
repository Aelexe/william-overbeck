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

		// Ensure the directory exists.
		fs.ensureDirSync(path.dirname(dbPath));

		// Initialize the database connection.
		db = new Database(dbPath);

		// Enable foreign keys.
		db.pragma("foreign_keys = ON");

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
