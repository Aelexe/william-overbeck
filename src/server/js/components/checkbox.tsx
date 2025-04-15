import classNames from "classnames";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";

interface Props {
	classes?: string | string[];
	enabled?: boolean;
	disabled?: boolean;
	hotkey?: string;
	checked?: boolean;
	defaultChecked?: boolean;
	onChange?: (checked: boolean) => void;
	label?: string;
}

export default function Checkbox(props: PropsWithChildren<Props>) {
	const [internalChecked, setInternalChecked] = useState(props.defaultChecked || false);
	const checked = props.checked !== undefined ? props.checked : internalChecked;

	const isDisabled = useMemo(() => {
		if (props.disabled) {
			return true;
		}

		if (props.enabled !== undefined) {
			return !props.enabled;
		}

		return false;
	}, [props.enabled, props.disabled]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newChecked = e.target.checked;
		if (props.checked === undefined) {
			setInternalChecked(newChecked);
		}
		props.onChange?.(newChecked);
	};

	useEffect(() => {
		if (isDisabled || !props.hotkey) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== props.hotkey || props.checked) {
				return;
			}

			props.onChange?.(true);
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.key !== props.hotkey || !props.checked) {
				return;
			}

			props.onChange?.(false);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [isDisabled, props.checked, props.hotkey, props.onChange]);

	return (
		<label className={classNames("checkbox-container", props.classes)}>
			<input type="checkbox" checked={checked} disabled={isDisabled} onChange={handleChange} />
			<span className="checkbox-label">{props.label || props.children}</span>
		</label>
	);
}
