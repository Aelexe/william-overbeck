import express from "express";
import fs from "fs";
import path from "path";
import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";
import NameModel from "../model/name-model";
import SubmissionModel from "../model/submission-model";

const app = express();
const PORT = process.env.PORT || 3000;

export function startServer() {
	// Webpack configuration
	const isDevelopment = process.env.NODE_ENV !== "production";
	const webpackConfig: webpack.Configuration = {
		mode: isDevelopment ? "development" : "production",
		entry: isDevelopment
			? ["webpack-hot-middleware/client?reload=true", path.join(__dirname, "./js/client.ts")]
			: path.join(__dirname, "./js/client.ts"),
		output: {
			path: path.join(__dirname, "public"),
			filename: "js/bundle.js",
			publicPath: "/",
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: "ts-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.scss$/,
					use: [
						"style-loader", // Injects CSS into the DOM
						{
							loader: "css-loader", // Interprets @import and url() and resolves them
							options: { sourceMap: isDevelopment },
						},
						{
							loader: "sass-loader", // Compiles Sass to CSS
							options: { sourceMap: isDevelopment },
						},
					],
				},
			],
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".scss"],
		},
		plugins: isDevelopment ? [new webpack.HotModuleReplacementPlugin()] : [],
	};

	// Setup webpack middleware in development mode
	if (isDevelopment) {
		const compiler = webpack(webpackConfig);
		app.use(
			webpackDevMiddleware(compiler, {
				publicPath: webpackConfig.output!.publicPath as string,
			})
		);
		app.use(webpackHotMiddleware(compiler));
	}

	// Serve static files
	app.use(express.static(path.join(__dirname, "public")));
	app.use("/scripts", express.static(path.join(__dirname, "../scripts")));
	app.use("/components", express.static(path.join(__dirname, "../components")));

	// API Routes
	app.get("/api/submissions/group-analysis", (req, res) => {
		try {
			const submissions = SubmissionModel.selectSubmissionsForGroupAnalysis();
			res.json(submissions);
		} catch (error) {
			console.error("Error fetching submissions for group analysis:", error);
			res.status(500).end();
		}
	});

	// Update submission group status
	app.put("/api/submissions/:documentId/group-status", express.json(), (req, res) => {
		try {
			const { documentId } = req.params;
			const { isGrouped } = req.body;

			if (typeof isGrouped !== "boolean") {
				return res.status(400).end();
			}

			SubmissionModel.updateGroupStatus(documentId, isGrouped);
			res.status(204).end();
		} catch (error) {
			console.error("Error updating submission group status:", error);
			res.status(500).end();
		}
	});

	app.post("/api/names/:name", express.json(), (req, res) => {
		try {
			const { name } = req.params;
			NameModel.createName(name);
			res.status(204).end();
		} catch (error) {
			console.error("Error creating names:", error);
			res.status(500).end();
		}
	});

	// Root route
	app.get("/", (req, res) => {
		const html = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");
		res.send(html);
	});

	// Start the server
	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
}
