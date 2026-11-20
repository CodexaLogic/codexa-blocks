/**
 * Per-device sides, padding or margin from the spacing sizes (None, XS to
 * XL) or a custom size, or border widths as a custom size only
 * (withPresets={false}).
 *
 * Each side is a compact field (BoxFields.jsx). Linked, every side shares
 * one field (top and bottom only, where those are the only sides).
 * Unlinked, all four sit on one row.
 *
 * Saved as { desktop: { top, right, bottom, left }, tablet: {…}, … }, each
 * side finished CSS, e.g. "var(--codexa-spacing-lg, 3rem)".
 */
import { usePresets } from "../utilities/presets.js";
import { SIDES } from "../utilities/responsive-styles.js";
import { BoxFields } from "./BoxFields.jsx";
import { ResponsiveControl } from "./ResponsiveControl.jsx";

/**
 * @param {Object}                            props               Component props.
 * @param {string}                            props.label         Label, e.g. "Padding".
 * @param {Object}                            props.value         Per-device box value.
 * @param {Object}                            [props.fallback]    What applies while nothing is set, in the value's shape. Adds Default, which goes back to it.
 * @param {(value: Object|undefined) => void} props.onChange      Receives the whole per-device value, or undefined when it is empty.
 * @param {string[]}                          [props.sides]       Sides to offer (all four by default).
 * @param {boolean}                           [props.withPresets] Offer the spacing sizes (true by default). Without them, each side is a custom size only, as for border widths.
 * @param {string}                            [props.units]       The kind of setting, a key of LENGTH_UNITS ("spacing" by default, or "border" without presets).
 * @return {Element} The control.
 */
export function SpacingControl({
	label,
	value,
	fallback,
	onChange,
	sides = SIDES,
	withPresets = true,
	units = withPresets ? "spacing" : "border",
}) {
	const presets = usePresets(withPresets ? "spacing" : false);

	return (
		<ResponsiveControl label={label} value={value} onChange={onChange}>
			{(control) => (
				// A new set of fields per device, so the link and each side's
				// custom/preset mode never carry over between devices.
				<BoxFields
					key={control.device}
					label={control.label}
					device={control.device}
					actions={control.actions}
					box={control.value}
					value={value}
					fallback={fallback}
					withDefault={fallback !== undefined}
					parts={sides}
					linkAll
					presets={presets}
					units={units}
					onChange={control.onChange}
				/>
			)}
		</ResponsiveControl>
	);
}
