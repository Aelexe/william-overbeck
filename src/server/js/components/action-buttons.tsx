import React from "react";

export const ActionButtons: React.FC = () => {
	const handleApprove = () => {
		console.log("Approved");
		// Add your approval logic here
	};

	const handleReject = () => {
		console.log("Rejected");
		// Add your rejection logic here
	};

	return (
		<div className="action-buttons">
			<button className="action-button approve" onClick={handleApprove} aria-label="Approve">
				<i className="fas fa-check"></i>
			</button>
			<button className="action-button reject" onClick={handleReject} aria-label="Reject">
				<i className="fas fa-times"></i>
			</button>
		</div>
	);
};
