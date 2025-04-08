import chalk from "chalk";
import { DateTime } from "luxon";
import { Page } from "playwright";

// Define interfaces for the data we're extracting
export interface Submission {
	submitterName: string;
	bill: string;
	committee: string;
	documentId: string;
	submitterReference: string;
	submittedTimestamp: DateTime;
}

export interface PageData {
	submissions: Submission[];
	currentPage: number;
	totalPages: number;
}

/**
 * Parse the submissions page and extract all submissions and pagination info
 * @param page Puppeteer page instance
 * @returns Object containing submissions array, current page number, and total page count
 */
export async function parseSubmissionsPage(page: Page): Promise<PageData> {
	// Helper function to extract document ID and submitter reference from URL
	function extractIdsFromUrl(url: string) {
		const urlParts = url.split("/");
		// Return the last two parts of the URL as document ID and submitter reference.
		if (urlParts.length >= 2) {
			const documentId = urlParts[urlParts.length - 2] || "";
			const submitterReference = urlParts[urlParts.length - 1] || "";
			return { documentId, submitterReference };
		}
		// If URL doesn't match expected format, return empty strings
		return { documentId: "", submitterReference: "" };
	}

	// Extract all URLs and data from the page
	const rawData = await page.evaluate(() => {
		const result = {
			links: [] as Array<{ url: string; name: string; bill: string; committee: string; date: string }>,
			currentPage: 1,
			totalPages: 1,
		};

		// Try to extract submissions from desktop view first (table layout)
		const tableRows = document.querySelectorAll("table.table--list tbody tr");

		if (tableRows.length > 0) {
			tableRows.forEach((row) => {
				const nameCell = row.querySelector("td:nth-child(1)");
				const committeeCell = row.querySelector("td:nth-child(2)");
				const dateCell = row.querySelector("td:nth-child(3)");

				if (nameCell && committeeCell && dateCell) {
					const linkElement = nameCell.querySelector("a");
					const name =
						linkElement?.getAttribute("title") ||
						nameCell.querySelector(".list__cell-body a")?.textContent?.trim() ||
						"";
					const urlPath = linkElement?.getAttribute("href") || "";
					const bill = nameCell.querySelector("p.list__cell-text")?.textContent?.trim() || "";
					const committee = committeeCell.textContent?.replace(/\u00A0/g, " ").trim() || "";
					const date = dateCell.textContent?.trim() || "";

					result.links.push({ url: urlPath, name, bill, committee, date });
				}
			});
		} else {
			// If table view not found, try mobile accordion view
			const accordionItems = document.querySelectorAll(".accordion-details-list__item");

			accordionItems.forEach((item) => {
				const titleElement = item.querySelector(".accordion-details-list__title");
				const name = titleElement?.textContent?.trim() || "";
				const urlPath = titleElement?.getAttribute("href") || "";
				const billElement = item.querySelector(".accordion-details-list__body div");
				const bill = billElement?.textContent?.trim() || "";
				const committeeElement = item.querySelector(".accordion-details-list__body p:nth-child(2)");
				const committee = committeeElement?.textContent?.replace("Committee:", "").trim() || "";
				const dateElement = item.querySelector(".accordion-details-list__body p:nth-child(3)");
				const date =
					dateElement?.textContent
						?.replace("Date:", "")
						.replace(/\u00A0/g, " ")
						.trim() || "";

				result.links.push({ url: urlPath, name, bill, committee, date });
			});
		}

		// Extract pagination information
		// First try to get current page from desktop view
		const selectedPageElement = document.querySelector(".pagination__item--desktop span.is-selected");
		if (selectedPageElement) {
			result.currentPage = parseInt(selectedPageElement.textContent || "1", 10);
		} else {
			// Try mobile view
			const mobilePageElement = document.querySelector(".pagination__dropdown-trigger");
			if (mobilePageElement) {
				result.currentPage = parseInt(mobilePageElement.textContent?.trim() || "1", 10);
			}
		}

		// Try to get total pages from the page content
		// First check if there's an explicit total shown
		const paginationText = document.querySelector(".pagination__item--mobile")?.textContent || "";
		const totalMatch = paginationText.match(/of\s+(\d+)/);

		if (totalMatch && totalMatch[1]) {
			result.totalPages = parseInt(totalMatch[1], 10);
		} else {
			// If no explicit total, count the page links
			const pageLinks = document.querySelectorAll(".pagination__item--desktop a, .pagination__item--desktop span");
			result.totalPages = pageLinks.length > 0 ? pageLinks.length : 1;
		}

		return result;
	});

	// Process the extracted data and add document IDs
	const submissions: Submission[] = rawData.links.map((item) => {
		const { documentId, submitterReference } = extractIdsFromUrl(item.url);
		const sanitisedDate = item.date.replace(/\u00A0/g, " ").trim();
		return {
			submitterName: item.name,
			bill: item.bill,
			committee: item.committee,
			date: item.date,
			documentId,
			submitterReference,
			submittedTimestamp: DateTime.fromFormat(sanitisedDate, "d MMMM yyyy", { locale: "en-NZ" }),
		};
	});

	return {
		submissions,
		currentPage: rawData.currentPage,
		totalPages: rawData.totalPages,
	};
}

// Define types for sort options and direction
export type SortOption = "PublicationDate"; // Can be expanded later
export type SortDirection = "Ascending" | "Descending";

/**
 * Navigate to NZ Parliament submissions page with the given keyword
 * @param page Puppeteer page instance
 * @param keyword Keyword to search for in submissions
 * @param pageNumber Page number for pagination (default: 1)
 * @param sort Sort criteria (default: "PublicationDate")
 * @param direction Sort direction (default: "Descending")
 */
export async function openSubmissionsPage(
	page: Page,
	keyword: string,
	pageNumber: number = 1,
	sort: SortOption = "PublicationDate",
	direction: SortDirection = "Ascending"
): Promise<void> {
	try {
		console.log(`Searching for ${chalk.blue(keyword)}, page ${chalk.green(pageNumber)}`);
		const url = `https://www.parliament.nz/en/pb/sc/evidence-submissions/?Criteria.PageNumber=${pageNumber}&Criteria.Keyword=${encodeURIComponent(
			`"${keyword}"`
		)}&Criteria.Sort=${sort}&Criteria.Direction=${direction}`;

		// Add timeout and waitUntil for more reliable navigation
		await page.goto(url, {
			waitUntil: "networkidle", // Playwright uses 'networkidle' instead of 'networkidle2'
		});
	} catch (error) {
		console.error(`Navigation error: ${error}`);
		throw error;
	}
}
