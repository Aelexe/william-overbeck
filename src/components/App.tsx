import React from "react";

export const App: React.FC = () => {
	return (
		<div className="app-container">
			<header>
				<h1>Submission Scraper</h1>
			</header>
			<main>
				<p>Welcome to the Submission Scraper application.</p>
				<p>This is an incredibly plain HTML page with most of the rendering handled by this TSX component.</p>
			</main>
			<footer>
				<p>© {new Date().getFullYear()} Submission Scraper</p>
			</footer>
		</div>
	);
};
