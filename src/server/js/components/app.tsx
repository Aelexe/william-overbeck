import React from "react";
import { ActionButtons } from "./action-buttons";

export const App: React.FC = () => {
	return (
		<div className="app-container">
			<div className="content-container">
				<h1>Submission Scraper</h1>
				<div className="content">
					<p>This is the content area that will display in the center of the page.</p>
					<p>Add your main content here. It could be form elements, data display, or any other content.</p>
				</div>
			</div>
			<ActionButtons />
		</div>
	);
};
