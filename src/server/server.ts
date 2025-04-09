import express from "express";
import sassMiddleware from "node-sass-middleware";
import path from "path";
import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";

const app = express();
const PORT = process.env.PORT || 3000;

export function startServer() {// Webpack configuration
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

	// Root route
	app.get("/", (req, res) => {
		const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Submission Scraper</title>
      <link rel="stylesheet" href="/styles/main.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body>
      <div id="root"></div>
      <script src="/js/bundle.js"></script>
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
