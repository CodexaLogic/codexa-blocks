/**
 * A block's own backdrop (Utilities\Backdrop), a color and its opacity.
 * Either can be left empty to use the site's default from the Colors page.
 */
import { RangeControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import { ColorRow, ColorRows } from "./ColorRows.jsx";

/**
 * @param {Object}                              props                 Component props.
 * @param {string}                              props.label           The color's full name, e.g. "Lightbox background".
 * @param {string|undefined}                    props.color           Saved color.
 * @param {number|undefined}                    props.opacity         Saved opacity, a percentage.
 * @param {number}                              props.defaultOpacity  The opacity shown while none is saved.
 * @param {(color: string|undefined) => void}   props.onColorChange   Receives the color, or undefined for the default.
 * @param {(opacity: number|undefined) => void} props.onOpacityChange Receives the opacity, or undefined for the default.
 * @return {Element} The controls.
 */
export function BackdropControl({
	label,
	color,
	opacity,
	defaultOpacity,
	onColorChange,
	onOpacityChange,
}) {
	return (
		<>
			<ColorRows>
				<ColorRow
					label={__("Color", "codexa-blocks")}
					colors={[
						{
							label,
							value: color,
							onChange: (next) =>
								onColorChange(next || undefined),
						},
					]}
				/>
			</ColorRows>
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={__("Opacity", "codexa-blocks")}
				help={__(
					"How much of the page shows through. Empty uses the site default.",
					"codexa-blocks"
				)}
				min={0}
				max={100}
				value={opacity}
				initialPosition={defaultOpacity}
				allowReset
				resetFallbackValue={undefined}
				onChange={(next) =>
					onOpacityChange(Number.isInteger(next) ? next : undefined)
				}
			/>
		</>
	);
}
