/**
 * A typography setting's controls, font size and letter spacing per device,
 * then font weight, line height and text transform. Saves one object
 * (typography-styles.js) with only the keys that are set, or undefined when
 * none are.
 */
import { RangeControl, SelectControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import {
	FONT_WEIGHTS,
	TEXT_TRANSFORMS,
} from "../utilities/typography-styles.js";
import { LengthControl } from "./LengthControl.jsx";

const WEIGHT_LABELS = {
	100: __("Thin", "codexa-blocks"),
	200: __("Extra light", "codexa-blocks"),
	300: __("Light", "codexa-blocks"),
	400: __("Regular", "codexa-blocks"),
	500: __("Medium", "codexa-blocks"),
	600: __("Semibold", "codexa-blocks"),
	700: __("Bold", "codexa-blocks"),
	800: __("Extra bold", "codexa-blocks"),
	900: __("Black", "codexa-blocks"),
};

const TRANSFORM_LABELS = {
	none: __("None", "codexa-blocks"),
	uppercase: __("Uppercase", "codexa-blocks"),
	lowercase: __("Lowercase", "codexa-blocks"),
	capitalize: __("Capitalize", "codexa-blocks"),
};

const DEFAULT_OPTION = { label: __("Default", "codexa-blocks"), value: "" };

/**
 * @param {Object}                            props          Component props.
 * @param {Object|undefined}                  props.value    The saved typography setting.
 * @param {(value: Object|undefined) => void} props.onChange Receives the whole setting, or undefined when it is empty.
 * @return {Element} The controls.
 */
export function TypographyControl({ value, onChange }) {
	/**
	 * Sets one key, or removes it when the new value is empty.
	 *
	 * @param {string}                         key  e.g. "fontWeight".
	 * @param {Object|number|string|undefined} next The new value; undefined or "" removes the key.
	 */
	const update = (key, next) => {
		const result = { ...(value ?? {}) };

		if (next === undefined || next === "") {
			delete result[key];
		} else {
			result[key] = next;
		}

		onChange(Object.keys(result).length ? result : undefined);
	};

	return (
		<>
			<LengthControl
				label={__("Font size", "codexa-blocks")}
				presets="font-size"
				value={value?.fontSize}
				onChange={(next) => update("fontSize", next)}
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={__("Font weight", "codexa-blocks")}
				value={value?.fontWeight ?? ""}
				options={[
					DEFAULT_OPTION,
					...FONT_WEIGHTS.map((weight) => ({
						label: WEIGHT_LABELS[weight],
						value: weight,
					})),
				]}
				onChange={(next) => update("fontWeight", next)}
			/>
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={__("Line height", "codexa-blocks")}
				min={0.5}
				max={3}
				step={0.05}
				allowReset
				value={value?.lineHeight}
				// Rounded to two decimals, since steps of 0.05 can arrive as
				// 1.1500000000000001, which the validator would refuse.
				onChange={(next) =>
					update(
						"lineHeight",
						typeof next === "number"
							? Math.round(next * 100) / 100
							: undefined
					)
				}
			/>
			<LengthControl
				label={__("Letter spacing", "codexa-blocks")}
				presets={false}
				units="letter-spacing"
				value={value?.letterSpacing}
				onChange={(next) => update("letterSpacing", next)}
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={__("Letter case", "codexa-blocks")}
				value={value?.textTransform ?? ""}
				options={[
					DEFAULT_OPTION,
					...TEXT_TRANSFORMS.map((transform) => ({
						label: TRANSFORM_LABELS[transform],
						value: transform,
					})),
				]}
				onChange={(next) => update("textTransform", next)}
			/>
		</>
	);
}
