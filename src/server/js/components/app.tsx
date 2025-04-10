import React, { useCallback, useMemo, useState } from "react";
import { Submission } from "../../../model/submission-model";
import NamesApi from "../../api/names-api";
import SubmissionsApi from "../../api/submissions-api";
import ActionButtons from "./action-buttons";

export const App: React.FC = () => {
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [submissionIndex, setSubmissionIndex] = useState<number>(0);
	const currentSubmission = useMemo(() => submissions[submissionIndex], [submissions, submissionIndex]);
	const [isAnalysing, setIsAnalysing] = useState<boolean>(false);

	const loadSubmissions = useCallback(async () => {
		try {
			const submissions = await SubmissionsApi.getSubmissionsForGroupAnalysis();
			if (submissions.length > 0) {
				setSubmissions(submissions);
				setSubmissionIndex(0);
				setIsAnalysing(true);
			} else {
				alert("No submissions available for group analysis");
			}
		} catch (error) {
			console.error("Error fetching submissions:", error);
			alert("Failed to fetch submissions");
		}
	}, []);

	const startGroupAnalysis = useCallback(async () => {
		loadSubmissions();
	}, []);

	const flagSubmission = useCallback(
		async (isGrouped: boolean) => {
			await SubmissionsApi.setSubmissionGroupStatus(currentSubmission.document_id, isGrouped);
			const names = currentSubmission.submitter
				.split(" ")
				.map((name) => name.trim().toLocaleLowerCase())
				.filter((name) => name.length > 0);
			for (const name of names) {
				await NamesApi.createName(name);
			}
			setSubmissionIndex((prevIndex) => prevIndex + 1);
		},
		[currentSubmission]
	);

	return (
		<div className="app-container">
			<div className="content-container">
				<h1>Submission Scraper</h1>
				<div className="content">
					{!isAnalysing ? (
						<>
							<button className="start-analysis-button" onClick={startGroupAnalysis}>
								Start Group Analysis
							</button>
							<p>Click the button above to begin analysing group submissions.</p>
						</>
					) : (
						<>
							<h2>
								Reviewing Submission {submissionIndex + 1} of {submissions.length}
							</h2>
							<p>
								Submitter:{" "}
								<a
									className="submitter"
									href={`https://www.google.com/search?q=${encodeURI(currentSubmission?.submitter)}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									{currentSubmission?.submitter}
								</a>
							</p>
						</>
					)}
				</div>
			</div>
			<ActionButtons
				disabled={!isAnalysing}
				canUndo={submissionIndex > 0}
				onApprove={() => flagSubmission(false)}
				onReject={() => flagSubmission(true)}
				onUndo={() => {
					if (submissionIndex > 0) {
						setSubmissionIndex(submissionIndex - 1);
					}
				}}
			/>
		</div>
	);
};
