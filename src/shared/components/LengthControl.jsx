/**
 * Per-device length, picked from size presets, or set as a custom size.
 *
 * With presets, each device's size is one compact field (SizeField.jsx)
 * offering the plugin's spacing sizes (None, XS to XL) or the theme's font
 * or radius sizes, each with its real size, then a custom size. Without
 * presets only the custom size shows, a slider beside a number and unit
 * (LengthInput.jsx).
 *
 * A preset is saved as its CSS variable with its size as the fallback,
 * "var(--codexa-spacing-lg, 3rem)", and matched again by its variable.
 * A value is saved only when it passes cssLength(), the same check PHP
 * applies on the page.
 */
import { usePresets } from "../utilities/presets.js";
import { LengthInput } from "./LengthInput.jsx";
import { ResponsiveControl } from "./ResponsiveControl.jsx";
import { SizeField } from "./SizeField.jsx";

/**
 * A saved size as the fields read it. Text as is, a number as text, and
 * anything else, such as an object from malformed content, as nothing, as
 * Style::length() in PHP reads it.
 *
 * @param {unknown} value Saved value.
 * @return {string|undefined} The size, or undefined.
 */
const asLength = (value) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	return typeof value === "string" ? value : undefined;
};

/**
 * One value, its presets as a SizeField or, without presets, the custom
 * size alone. Exported for BoxFields, which shows one per side or corner.
 *
 * @param {Object}                  props               Component props.
 * @param {string}                  props.label         Accessible label.
 * @param {string|undefined}        props.value         This device's saved value.
 * @param {string|undefined}        props.inherited     Value shown when there is none.
 * @param {(value: string) => void} props.onChange      Receives a valid length or "".
 * @param {Array}                   props.presets       Presets from usePresets().
 * @param {boolean}                 [props.withNone]    Offer None, which saves 0 (true by default).
 * @param {boolean}                 [props.withDefault] Offer Default, which clears the value (by default only without None).
 * @param {string}                  props.units         The kind of setting, a key of LENGTH_UNITS.
 * @param {boolean}                 [props.compact]     Without presets, the custom size without its slider.
 * @param {boolean}                 [props.narrow]      With presets, one of several fields on a row (SizeField.jsx).
 * @return {Element} The field.
 */
export function LengthField({
	label,
	value,
	inherited,
	onChange,
	presets,
	withNone = true,
	withDefault = !withNone,
	units,
	compact = false,
	narrow = false,
}) {
	const saved = asLength(value);
	const shown = asLength(inherited);

	if (!presets.length) {
		return (
			<LengthInput
				label={label}
				value={saved}
				inherited={shown}
				onChange={onChange}
				units={units}
				compact={compact}
			/>
		);
	}

	return (
		<SizeField
			label={label}
			presets={presets}
			value={saved}
			inherited={shown}
			units={units}
			onChange={onChange}
			withNone={withNone}
			withDefault={withDefault}
			narrow={narrow}
		/>
	);
}

/**
 * @param {Object}                               props            Component props.
 * @param {string}                               props.label      Setting label, e.g. "Column gap".
 * @param {string}                               [props.help]     Help text below the setting.
 * @param {Object}                               props.value      { desktop, tablet, mobile }.
 * @param {Object}                               [props.fallback] What applies while nothing is set, { desktop, tablet, mobile }. Adds Default, which goes back to it.
 * @param {(value: Object|undefined) => void}    props.onChange   Receives the whole per-device value, or undefined when it is empty.
 * @param {"spacing"|"font-size"|"radius"|false} [props.presets]  Size presets to offer (the plugin's spacing sizes by default).
 * @param {string}                               [props.units]    The kind of setting, a key of LENGTH_UNITS (the presets' kind by default, which a setting without presets must replace).
 * @return {Element} The control.
 */
export function LengthControl({
	label,
	help,
	value,
	fallback,
	onChange,
	presets: kind = "spacing",
	units = kind || "spacing",
}) {
	const presets = usePresets(kind);

	return (
		<ResponsiveControl
			label={label}
			help={help}
			value={value}
			fallback={fallback}
			onChange={onChange}
		>
			{(control) => (
				// A new field per device, so a half-typed value never
				// carries over between devices.
				<LengthField
					key={control.device}
					{...control}
					presets={presets}
					// Spacing offers None, and Default too when it has a
					// fallback. Radius offers Default (the block's own
					// corners) and None (square). Font sizes offer Default.
					withNone={kind !== "font-size"}
					withDefault={kind !== "spacing" || fallback !== undefined}
					units={units}
				/>
			)}
		</ResponsiveControl>
	);
}
