import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";

import "../styles/main.scss";

document.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("root");

	if (container) {
		const root = createRoot(container);
		root.render(React.createElement(App));
		console.log("React app mounted on client side");
	} else {
		console.error("Root container not found!");
	}
});
