import React, { useCallback, useMemo, useState } from "react";
import { Submission } from "../../../model/submission-model";
import NamesApi from "../../api/names-api";
import SubmissionsApi from "../../api/submissions-api";
import Button from "./button";
import Checkbox from "./checkbox";

export function App() {
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [submissionIndex, setSubmissionIndex] = useState<number>(0);
	const currentSubmission = useMemo(() => submissions[submissionIndex], [submissions, submissionIndex]);
	const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
	const [isNameSaveDisabled, setNameSaveDisabled] = useState<boolean>(false);

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
			// TODO: Disabling buttons and stuff.
			await SubmissionsApi.setSubmissionGroupStatus(currentSubmission.document_id, isGrouped);
			const names = currentSubmission.submitter
				.split(" ")
				.map((name) => name.trim().toLocaleLowerCase())
				.filter((name) => name.length > 0);

			if (!isGrouped && !isNameSaveDisabled) {
				await NamesApi.createNames(names);
				await SubmissionsApi.setNames(currentSubmission.document_id, names);
			}

			// Reload submissions to account for any automatic flags.
			const reloadSubmissions = await SubmissionsApi.getSubmissionsForGroupAnalysis();

			if (reloadSubmissions.length < submissions.length - 1) {
				// Splice the new list into the current index of the current list.
				setSubmissions([...submissions.splice(0, submissionIndex + 1), ...reloadSubmissions]);
			}

			setSubmissionIndex((prevIndex) => prevIndex + 1);
		},
		[currentSubmission, isNameSaveDisabled, submissions]
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
			<div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
				<Checkbox label="Don't save name" checked={isNameSaveDisabled} onChange={setNameSaveDisabled} hotkey=" " />
			</div>
			<div className="action-buttons">
				<Button
					classes="action-button reject"
					enabled={isAnalysing}
					hotkey="ArrowLeft"
					onClick={() => flagSubmission(true)}
				>
					<i className="fas fa-times"></i>
				</Button>
				<Button
					classes="action-button backwards"
					enabled={isAnalysing && submissionIndex > 0}
					hotkey="ArrowUp"
					onClick={() => {
						if (submissionIndex > 0) {
							setSubmissionIndex(submissionIndex - 1);
						}
					}}
				>
					<i className="fas fa-arrow-up"></i>
				</Button>
				<Button
					classes="action-button approve"
					enabled={isAnalysing}
					hotkey="ArrowRight"
					onClick={() => flagSubmission(false)}
				>
					<i className="fas fa-check"></i>
				</Button>
			</div>
		</div>
	);
}
