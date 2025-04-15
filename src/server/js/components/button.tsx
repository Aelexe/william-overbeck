import classNames from "classnames";
import React, { PropsWithChildren, useEffect, useMemo, useRef } from "react";

interface Props {
	classes?: string | string[];
	enabled?: boolean;
	disabled?: boolean;
	hotkey?: string;
	onClick?: () => void;
}

export default function Button(props: PropsWithChildren<Props>) {
	const pressedKeys = useRef(new Set<string>());

	const isDisabled = useMemo(() => {
		if (props.disabled) {
			return true;
		}

		if (props.enabled !== undefined) {
			return !props.enabled;
		}

		return false;
	}, [props.enabled, props.disabled]);

	useEffect(() => {
		if (isDisabled || !props.hotkey) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== props.hotkey) {
				return;
			}

			if (pressedKeys.current.has(event.key)) {
				return;
			}

			pressedKeys.current.add(event.key);
			props.onClick?.();
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.key !== props.hotkey) {
				return;
			}

			pressedKeys.current.delete(event.key);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [isDisabled, props.hotkey, props.onClick]);

	return (
		<button className={classNames(props.classes)} disabled={isDisabled} onClick={props.onClick}>
			{props.children}
		</button>
	);
}
