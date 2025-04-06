import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getDb } from "./db";

interface Migration {
	version: number;
	name: string;
	up: string;
	down: string;
}

/**
 * Manages database migrations
 */
export class MigrationManager {
	private db: Database.Database;

	constructor(db: Database.Database) {
		this.db = db;
		this.initMigrationTable();
	}

	/**
	 * Creates the migration tracking table if it doesn't exist
	 */
	private initMigrationTable(): void {
		this.db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
	}

	/**
	 * Gets the current database version
	 */
	public getCurrentVersion(): number {
		const stmt = this.db.prepare(`
            SELECT COALESCE(MAX(version), 0) as current_version
            FROM migrations
        `);

		return stmt.pluck().get() as number;
	}

	/**
	 * Applies pending migrations up to a target version
	 * @param targetVersion The version to migrate to, defaults to the latest
	 * @param migrations Array of migration objects to apply
	 */
	public async migrateUp(migrations: Migration[], targetVersion?: number): Promise<void> {
		const currentVersion = this.getCurrentVersion();
		const sortedMigrations = migrations.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);

		if (targetVersion !== undefined) {
			migrations = migrations.filter((m) => m.version <= targetVersion);
		}

		if (sortedMigrations.length === 0) {
			return;
		}

		console.log(`Current database version: ${currentVersion}`);
		console.log(`Found ${sortedMigrations.length} pending migrations to apply.`);

		this.db.transaction(() => {
			for (const migration of sortedMigrations) {
				console.log(`Applying migration ${migration.version}: ${migration.name}`);

				// Execute the up migration
				this.db.exec(migration.up);

				// Record that migration was applied
				this.db
					.prepare(
						`INSERT INTO migrations (version, name)
                   		VALUES (?, ?)`
					)
					.run(migration.version, migration.name);

				console.log(`Migration ${migration.version} applied successfully.`);
			}
		})();

		console.log("Migration completed successfully.");
	}

	/**
	 * Rolls back migrations down to a specific version
	 * @param targetVersion The version to rollback to
	 * @param migrations Array of migration objects for rollback
	 */
	public async migrateDown(migrations: Migration[], targetVersion: number): Promise<void> {
		const currentVersion = this.getCurrentVersion();

		if (currentVersion <= targetVersion) {
			console.log(`Current version (${currentVersion}) is already at or below target (${targetVersion}).`);
			return;
		}

		const migrationsToRevert = migrations
			.filter((m) => m.version > targetVersion && m.version <= currentVersion)
			.sort((a, b) => b.version - a.version); // Revert in reverse order

		if (migrationsToRevert.length === 0) {
			console.log("No migrations to revert.");
			return;
		}

		console.log(`Found ${migrationsToRevert.length} migrations to revert.`);

		this.db.transaction(() => {
			for (const migration of migrationsToRevert) {
				console.log(`Reverting migration ${migration.version}: ${migration.name}`);

				// Execute the down migration
				this.db.exec(migration.down);

				// Remove from migration history
				this.db
					.prepare(
						`
                    DELETE FROM migrations
                    WHERE version = ?
                `
					)
					.run(migration.version);

				console.log(`Migration ${migration.version} reverted successfully.`);
			}
		})();

		console.log("Rollback completed successfully.");
	}
}

/**
 * Loads migration files from a directory
 * @param migrationsDir Path to migrations directory
 */
export function loadMigrationsFromDirectory(migrationsDir: string): Migration[] {
	const migrationFiles = fs.readdirSync(migrationsDir).filter((file) => file.match(/^\d+_.*\.sql$/));

	return migrationFiles.map((file) => {
		const [versionStr, ...nameParts] = file.split("_");
		const name = nameParts.join("_").replace(".sql", "");
		const version = parseInt(versionStr, 10);

		const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
		const [up, down = ""] = content.split("-- Down");

		return {
			version,
			name,
			up: up.replace("-- Up", "").trim(),
			down: down.trim(),
		};
	});
}

/**
 * Runs database migrations from a specified directory
 * @param migrationsDir Directory containing migration files
 */
export async function runMigrations(migrationsDir: string): Promise<void> {
	try {
		const db = getDb();
		const manager = new MigrationManager(db);
		const migrations = loadMigrationsFromDirectory(migrationsDir);

		await manager.migrateUp(migrations);
	} catch (error) {
		console.error("Migration failed:", error);
		throw error;
	}
}
