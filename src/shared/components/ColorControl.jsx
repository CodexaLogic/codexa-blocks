/**
 * A color setting with the theme's palette and a custom color picker,
 * if allowed by the theme. In the sidebar it sits inside ColorRows,
 * which opens it from a circle. The saved format is described in
 * use-color-palette.js.
 */
import { BaseControl, ColorPalette } from "@wordpress/components";

import { useColorPalette } from "../hooks/use-color-palette.js";

/**
 * @param {Object}                            props          Component props.
 * @param {string}                            props.label    Setting label, e.g. "Text".
 * @param {string|undefined}                  props.value    Saved color.
 * @param {(value: string|undefined) => void} props.onChange Receives the color to save, or undefined to clear it.
 * @return {Element} The control.
 */
export function ColorControl({ label, value, onChange }) {
	const { origins, allowCustom, toShown, toSaved } = useColorPalette();

	return (
		<fieldset className="codexa-color-control">
			<BaseControl.VisualLabel as="legend">
				{label}
			</BaseControl.VisualLabel>
			<ColorPalette
				colors={origins}
				value={toShown(value)}
				onChange={(color) => onChange(toSaved(color))}
				disableCustomColors={!allowCustom}
				enableAlpha
				clearable
			/>
		</fieldset>
	);
}
