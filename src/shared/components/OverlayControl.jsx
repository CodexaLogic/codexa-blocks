/**
 * The per-device overlay setting, none, a solid color or a gradient, with
 * its opacity.
 *
 * A device shows the next larger device's overlay or has its own
 * (ResponsiveControl). Its own is saved whole, so it fully replaces the
 * larger one.
 * - Solid color saves the color, gradient "none" and the opacity.
 * - Gradient saves color "transparent", the gradient and the opacity.
 * - None under a larger overlay saves "transparent", "none" and 0.
 * None on desktop, or with nothing larger, saves nothing.
 *
 * Saved as overlayColor, overlayGradient and overlayOpacity per device and
 * printed as the --codexa-overlay-* variables and their classes
 * (DesignStyles, design-styles.js, _design.scss). The type shown follows
 * what's saved, so undo works. Choosing a type saves a starting value so
 * the canvas matches. Gradient colors are saved as hex (gradient.js). The
 * gradient opens beside the sidebar, like the color (GradientRow).
 */
import { RangeControl, SelectControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import { DEVICES } from "../utilities/responsive-styles.js";
import { ColorRow, ColorRows, GradientRow } from "./ColorRows.jsx";
import { ResponsiveControl } from "./ResponsiveControl.jsx";

/** Saved when Solid Color is chosen, black. */
const STARTING_COLOR = "#000000";

/** Saved when Gradient is chosen, transparent at the top to black at the bottom. */
const STARTING_GRADIENT = "linear-gradient(180deg,#00000000 0%,#000000 100%)";

/** The opacity a new overlay starts with, in percent. */
const STARTING_OPACITY = 50;

/** A device's own "None" under a larger device's overlay. */
const NO_OVERLAY = Object.freeze({
	color: "transparent",
	gradient: "none",
	opacity: 0,
});

/**
 * What a device's overlay is.
 *
 * @param {Object|undefined} overlay { color, gradient, opacity }.
 * @return {string} "none", "color" or "gradient".
 */
function overlayType(overlay) {
	if (overlay?.gradient && overlay.gradient !== "none") {
		return "gradient";
	}

	return overlay?.color && overlay.color !== "transparent" ? "color" : "none";
}

/**
 * The overlay fields for one device.
 *
 * @param {Object}                              props           Component props.
 * @param {string}                              props.label     The setting's name with its device, e.g. "Overlay (mobile)".
 * @param {string}                              props.device    Device being edited.
 * @param {Object|undefined}                    props.value     This device's own overlay.
 * @param {Object|undefined}                    props.inherited The overlay it shows from a larger device.
 * @param {(overlay: Object|undefined) => void} props.onChange  Receives this device's new overlay, or undefined to clear it.
 * @return {Element} The fields.
 */
function OverlayFields({ label, device, value, inherited, onChange }) {
	const shown = value ?? inherited;
	const type = overlayType(shown);
	const opacity = type === "none" ? STARTING_OPACITY : shown.opacity;

	/**
	 * Saves this device's overlay whole, with one part changed.
	 *
	 * @param {Object} changes Parts to change (color, gradient or opacity).
	 */
	const update = (changes) =>
		onChange({
			color: shown.color,
			gradient: shown.gradient,
			opacity: opacity ?? STARTING_OPACITY,
			...changes,
		});

	/**
	 * Switches the overlay type, saving its starting value.
	 *
	 * @param {string} next "none", "color" or "gradient".
	 */
	const chooseType = (next) => {
		if (next === "color") {
			onChange({
				color: STARTING_COLOR,
				gradient: "none",
				opacity: opacity ?? STARTING_OPACITY,
			});
		} else if (next === "gradient") {
			onChange({
				color: "transparent",
				gradient: STARTING_GRADIENT,
				opacity: opacity ?? STARTING_OPACITY,
			});
		} else {
			// Under a larger device's overlay, "None" has to be saved.
			onChange(
				device !== "desktop" && overlayType(inherited) !== "none"
					? NO_OVERLAY
					: undefined
			);
		}
	};

	return (
		<>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={label}
				hideLabelFromVision
				value={type}
				options={[
					{ label: __("None", "codexa-blocks"), value: "none" },
					{
						label: __("Solid Color", "codexa-blocks"),
						value: "color",
					},
					{
						label: __("Gradient", "codexa-blocks"),
						value: "gradient",
					},
				]}
				onChange={chooseType}
			/>

			{type === "color" && (
				<ColorRows>
					<ColorRow
						label={__("Color", "codexa-blocks")}
						colors={[
							{
								label: __("Overlay color", "codexa-blocks"),
								value: shown.color,
								// Clearing the color removes the overlay.
								onChange: (next) =>
									next
										? update({ color: next })
										: chooseType("none"),
							},
						]}
					/>
				</ColorRows>
			)}

			{type === "gradient" && (
				<ColorRows>
					<GradientRow
						label={__("Gradient", "codexa-blocks")}
						title={__("Overlay gradient", "codexa-blocks")}
						value={shown.gradient}
						clearable={false}
						onChange={(next) => update({ gradient: next })}
					/>
				</ColorRows>
			)}

			{type !== "none" && (
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={__("Overlay opacity (%)", "codexa-blocks")}
					min={0}
					max={100}
					value={opacity ?? STARTING_OPACITY}
					onChange={(next) =>
						update({ opacity: next ?? STARTING_OPACITY })
					}
				/>
			)}
		</>
	);
}

/**
 * @param {Object}                    props            Component props.
 * @param {Object}                    [props.color]    Saved overlayColor, per device.
 * @param {Object}                    [props.gradient] Saved overlayGradient, per device.
 * @param {Object}                    [props.opacity]  Saved overlayOpacity, per device (0 to 100).
 * @param {(changes: Object) => void} props.onChange   Receives the attributes to change (overlayColor, overlayGradient and overlayOpacity).
 * @return {Element} The control.
 */
export function OverlayControl({ color, gradient, opacity, onChange }) {
	// The three attributes as one overlay per device, for ResponsiveControl.
	const value = Object.fromEntries(
		DEVICES.map(({ key }) => [
			key,
			{
				color: color?.[key],
				gradient: gradient?.[key],
				opacity: opacity?.[key],
			},
		]).filter(([, overlay]) =>
			Object.values(overlay).some((part) => part !== undefined)
		)
	);

	/**
	 * Splits the overlays back into the three attributes.
	 *
	 * @param {Object|undefined} next Overlay per device.
	 */
	const save = (next) => {
		const part = (name) => {
			const perDevice = Object.fromEntries(
				Object.entries(next ?? {})
					.filter(([, overlay]) => overlay?.[name] !== undefined)
					.map(([device, overlay]) => [device, overlay[name]])
			);

			return Object.keys(perDevice).length ? perDevice : undefined;
		};

		onChange({
			overlayColor: part("color"),
			overlayGradient: part("gradient"),
			overlayOpacity: part("opacity"),
		});
	};

	return (
		<ResponsiveControl
			label={__("Overlay", "codexa-blocks")}
			value={value}
			onChange={save}
		>
			{(control) => <OverlayFields key={control.device} {...control} />}
		</ResponsiveControl>
	);
}
