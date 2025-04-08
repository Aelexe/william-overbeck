// CLI scaffolding using Commander
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { initialiseDatabase } from "./model/db";
import parseSubmissions from "./parse";
import { scrapeBills } from "./scrape";
import { startServer } from "./server/server";

// Initialise the database.
initialiseDatabase();

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));

const program = new Command();

program
	.name("william-overbeck")
	.description("CLI tool for scraping and analysis New Zealand parliament bills")
	.version(packageJson.version);

program
	.command("ui")
	.description("Start the web UI")
	.action(() => {
		startServer();
	});

program
	.command("scrape")
	.description("Scrape bills from the source")
	.action(async () => {
		console.log("Starting bill scraping...");
		await scrapeBills();
		process.exit(0);
	});

program
	.command("parse")
	.description("Parse all unparsed submissions")
	.action(async () => {
		await parseSubmissions();
		process.exit(0);
	});

// Create interactive mode
function startInteractiveMode() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "william-overbeck> ",
	});

	console.log("Welcome to William Overbeck CLI");
	console.log("Type 'help' to see available commands or 'exit' to quit");
	rl.prompt();

	rl.on("line", (line) => {
		const input = line.trim();

		if (input === "exit" || input === "quit") {
			console.log("Goodbye!");
			rl.close();
			return;
		}

		// Parse the command using Commander
		try {
			// Simulate process.argv.
			const args = [...input.split(" ")];
			program.parse(args, { from: "user" });
		} catch (error) {
			if (error instanceof Error) {
				console.error("Error executing command:", error.message);
			}
			rl.prompt();
		}
	}).on("close", () => {
		process.exit(0);
	});
}

if (process.argv.slice(2).length) {
	// If arguments were provided, run in standard CLI mode.
	program.parse(process.argv);
} else {
	// If no arguments were provided, start interactive mode.
	startInteractiveMode();
}
