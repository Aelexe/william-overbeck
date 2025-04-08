import express from "express";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { App } from "../components/App";

const app = express();
const PORT = process.env.PORT || 3000;

export function startServer() {
	// Serve static files
	app.use(express.static(path.join(__dirname, "public")));

	// Root route
	app.get("/", (req, res) => {
		const appHtml = ReactDOMServer.renderToString(React.createElement(App));

		const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Submission Scraper</title>
    </head>
    <body>
      <div id="root">${appHtml}</div>
    </body>
    </html>
  `;

		res.send(html);
	});

	// Start the server
	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
		require("child_process").exec(`start http://localhost:${PORT}`);
	});
}
