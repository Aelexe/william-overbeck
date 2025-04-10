import React, { useEffect, useRef } from "react";

interface ActionButtonsProps {
	disabled?: boolean;
	canUndo?: boolean;
	onApprove?: () => void;
	onReject?: () => void;
	onUndo?: () => void;
}

export default function ActionButtons(props: ActionButtonsProps) {
	const pressedKeys = useRef(new Set<string>());

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (props.disabled) {
				return;
			}

			if (pressedKeys.current.has(event.key)) {
				return;
			}

			pressedKeys.current.add(event.key);

			switch (event.key) {
				case "ArrowRight":
					props.onApprove?.();
					break;
				case "ArrowLeft":
					props.onReject?.();
					break;
				case "ArrowUp":
					if (props.canUndo) {
						props.onUndo?.();
					}
					break;
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			pressedKeys.current.delete(event.key);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		// Cleanup
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [props.disabled, props.canUndo, props.onApprove, props.onReject, props.onUndo]);

	return (
		<div className="action-buttons">
			<button className="action-button reject" onClick={props.onReject} aria-label="Reject" disabled={props.disabled}>
				<i className="fas fa-times"></i>
			</button>
			<button
				className="action-button backwards"
				onClick={props.onUndo}
				aria-label="Backwards"
				disabled={props.disabled || !props.canUndo}
			>
				<i className="fas fa-arrow-up"></i>
			</button>
			<button
				className="action-button approve"
				onClick={props.onApprove}
				aria-label="Approve"
				disabled={props.disabled}
			>
				<i className="fas fa-check"></i>
			</button>
		</div>
	);
}
