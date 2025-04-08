export default function getProgressBar(progress: number, max: number, length: number = 50): string {
	const progressBar = new Array(length).fill("-");
	const normalisedProgress = Math.floor((progress / max) * length);
	for (let i = 0; i < normalisedProgress; i++) {
		progressBar[i] = "#";
	}
	return `[${progressBar.join("")}]`;
}
