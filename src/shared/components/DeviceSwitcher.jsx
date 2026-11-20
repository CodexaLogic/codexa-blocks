/**
 * Desktop / Tablet / Mobile buttons.
 *
 * Built from the stable Button component. The buttons form a labelled
 * group; the chosen one is announced as pressed, and each has a tooltip
 * and an accessible name.
 */
import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { desktop, mobile, tablet } from "@wordpress/icons";

import { useDevice } from "../hooks/use-device.js";

const OPTIONS = [
	{ key: "desktop", icon: desktop, label: __("Desktop", "codexa-blocks") },
	{ key: "tablet", icon: tablet, label: __("Tablet", "codexa-blocks") },
	{ key: "mobile", icon: mobile, label: __("Mobile", "codexa-blocks") },
];

/**
 * @return {Element} The switcher.
 */
export function DeviceSwitcher() {
	const [device, setDevice] = useDevice();

	return (
		<div
			className="codexa-device-switcher"
			role="group"
			aria-label={__("Device", "codexa-blocks")}
		>
			{OPTIONS.map(({ key, icon, label }) => (
				<Button
					key={key}
					icon={icon}
					label={label}
					size="small"
					isPressed={device === key}
					onClick={() => setDevice(key)}
				/>
			))}
		</div>
	);
}
