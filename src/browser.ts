import { Browser, firefox, Page } from "playwright";

let browser: Browser | null = null;

export async function getBrowser() {
	if (browser !== null) {
		return browser;
	}

	browser = await firefox.launch({
		headless: false, // Set to true for production scraping
		args: ["--start-maximized", "--disable-pdf-viewer"],
	});

	// Create a context and page
	const context = await browser.newContext({
		viewport: null, // Use default viewport size
		ignoreHTTPSErrors: true,
	});
	const page = await context.newPage();

	// Inject CSS to make background dark grey
	await page.addStyleTag({
		content: `
			  body {
				  background-color: #333333 !important;
				  color: #f0f0f0 !important;
			  }
			  .container, .container-fluid {
				  background-color: #444444 !important;
			  }
		  `,
	});

	// Set default navigation timeout
	page.setDefaultTimeout(0);

	return browser;
}

/**
 * Opens DevTools and switches to the Network tab
 * @param page The playwright page to open DevTools on
 */
async function openDevToolsWithNetworkTab(page: Page): Promise<void> {
	try {
		// Playwright has built-in DevTools support
		await page.context().browser()!.newBrowserCDPSession();

		// Evaluate JavaScript to open DevTools
		await page.evaluate(`
			setTimeout(() => {
				// Open DevTools
				if (!window.__devtools_opened) {
				window.__devtools_opened = true;
				void DevToolsAPI.showPanel('network');
				}
			}, 500);`);

		console.log("DevTools with Network tab opened");
	} catch (error) {
		console.error("Error opening DevTools:", error);
	}
}
