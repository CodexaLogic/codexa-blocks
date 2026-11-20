/**
 * Per-device corner radius. Linked, one field rounds every corner; unlinked,
 * each corner has its own, with an icon of its corner (BoxFields.jsx).
 * Each field offers the radius presets (the theme's, or the plugin's) or a
 * custom size.
 *
 * Saved as { desktop: { "top-left", "top-right", "bottom-right",
 * "bottom-left" }, tablet: {…}, … }, each corner finished CSS (DesignStyles).
 */
import { usePresets } from "../utilities/presets.js";
import { CORNERS } from "../utilities/responsive-styles.js";
import { BoxFields } from "./BoxFields.jsx";
import { ResponsiveControl } from "./ResponsiveControl.jsx";

/**
 * @param {Object}                            props          Component props.
 * @param {string}                            props.label    Label, e.g. "Radius".
 * @param {Object}                            props.value    Per-device corners.
 * @param {(value: Object|undefined) => void} props.onChange Receives the whole per-device value, or undefined when it is empty.
 * @param {string[]}                          [props.parts]  Corners to offer, in CSS order (all four by default).
 * @return {Element} The control.
 */
export function RadiusControl({ label, value, onChange, parts = CORNERS }) {
	const presets = usePresets("radius");

	return (
		<ResponsiveControl label={label} value={value} onChange={onChange}>
			{(control) => (
				// A new set of fields per device, so the link and each
				// corner's custom/preset mode never carry over between devices.
				<BoxFields
					key={control.device}
					label={control.label}
					device={control.device}
					actions={control.actions}
					box={control.value}
					value={value}
					kind="corners"
					parts={parts}
					presets={presets}
					withDefault
					units="radius"
					onChange={control.onChange}
				/>
			)}
		</ResponsiveControl>
	);
}
