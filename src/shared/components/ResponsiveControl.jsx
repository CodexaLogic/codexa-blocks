/**
 * Wraps any control so it edits one device of a per-device setting.
 *
 * Shows the label and the device switcher. On tablet and mobile, a device
 * without a value of its own shows the larger device's value as its
 * placeholder or selection; one with its own value gets a reset button
 * beside the device switcher, which goes back to the larger device's value.
 *
 * The control is a render function, so any input works.
 *
 *     <ResponsiveControl label="Minimum height" value={minHeight}
 *         onChange={(next) => setAttributes({ minHeight: next })}>
 *         {({ label, value, inherited, onChange }) => (
 *             <TextControl label={label} hideLabelFromVision
 *                 value={value ?? ""} placeholder={inherited ?? ""}
 *                 onChange={onChange} />
 *         )}
 *     </ResponsiveControl>
 *
 * A setting with a default of its own, such as a block's spacing from its
 * stylesheet, passes it as `fallback`, in the same shape as the value. A
 * device with nothing set, here or on a larger device, then shows it.
 *
 * The render function also receives `actions`, a place in the header after
 * the device switcher, for a button that belongs beside it, such as the
 * link of BoxFields. Render into it with createPortal().
 */
import { BaseControl, Button } from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __, _x, sprintf } from "@wordpress/i18n";
import { rotateLeft } from "@wordpress/icons";

import { useDevice } from "../hooks/use-device.js";
import {
	DEVICES,
	effectiveValue,
	setDeviceValue,
} from "../utilities/responsive-styles.js";
import { DeviceSwitcher } from "./DeviceSwitcher.jsx";

const DEVICE_NAMES = {
	desktop: __("desktop", "codexa-blocks"),
	tablet: __("tablet", "codexa-blocks"),
	mobile: __("mobile", "codexa-blocks"),
};

/**
 * @param {Object}                            props            Component props.
 * @param {string}                            props.label      Setting label.
 * @param {string}                            [props.help]     Help text.
 * @param {Object}                            props.value      { desktop, tablet, mobile }.
 * @param {Object}                            [props.fallback] What applies while nothing is set, { desktop, tablet, mobile }.
 * @param {(value: Object|undefined) => void} props.onChange   Receives the whole per-device value, or undefined when it is empty.
 * @param {(control: Object) => Element}      props.children   Renders the control for one device.
 * @return {Element} The control.
 */
export function ResponsiveControl({
	label,
	help,
	value,
	fallback,
	onChange,
	children,
}) {
	const [device] = useDevice();
	const [actions, setActions] = useState(null);
	const own = value?.[device];
	const hasOwn = own !== undefined && own !== "";

	// The larger device whose value applies when this one has none.
	const index = DEVICES.findIndex(({ key }) => key === device);
	const source =
		DEVICES.slice(0, index)
			.reverse()
			.find(
				({ key }) => value?.[key] !== undefined && value?.[key] !== ""
			)?.key ?? "desktop";

	return (
		<BaseControl
			__nextHasNoMarginBottom
			help={help}
			className="codexa-responsive-control"
		>
			<div className="codexa-responsive-control__header">
				<BaseControl.VisualLabel>{label}</BaseControl.VisualLabel>
				<div className="codexa-responsive-control__actions">
					{device !== "desktop" && hasOwn && (
						<Button
							size="small"
							icon={rotateLeft}
							label={sprintf(
								/* translators: 1: Setting name, e.g. "Padding". 2: Device name, e.g. "desktop". */
								__("%1$s: use the %2$s value", "codexa-blocks"),
								label,
								DEVICE_NAMES[source]
							)}
							onClick={() =>
								onChange(
									setDeviceValue(value, device, undefined)
								)
							}
						/>
					)}
					<DeviceSwitcher />
					<div
						className="codexa-responsive-control__extra"
						ref={setActions}
					/>
				</div>
			</div>

			{children({
				label: sprintf(
					/* translators: 1: Setting name, e.g. "Padding". 2: Device name, e.g. "tablet". */
					_x(
						"%1$s (%2$s)",
						"setting name (device name)",
						"codexa-blocks"
					),
					label,
					DEVICE_NAMES[device]
				),
				device,
				actions,
				value: own,
				inherited: hasOwn
					? undefined
					: (effectiveValue(value, device) ??
						effectiveValue(fallback, device)),
				onChange: (next) =>
					onChange(setDeviceValue(value, device, next)),
			})}
		</BaseControl>
	);
}
