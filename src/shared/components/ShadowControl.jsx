/**
 * A shadow picked from the theme's presets, one tile per preset wearing its
 * shadow, named in its label and tooltip. The chosen name shows below.
 *
 * The first button clears the setting, "None" (a slashed tile) or, with
 * emptyLabel, a label such as "Same as normal" for a hover shadow (a link
 * icon). withNone also offers "None" as a value, for a hover shadow that
 * removes the normal one.
 *
 * Saved as the preset's variable with its shadow as the fallback, e.g.
 * "var(--wp--preset--shadow--natural, 6px 6px 9px 0px #00000033)", or "none"
 * (use-shadow-presets.js), and matched by variable (samePreset()). The page
 * applies only values that pass cssShadow() and Style::shadow().
 *
 * The plugin's own presets fill in when the theme has none. Tiles draw
 * each shadow darker (previewShadow()) so it shows at their size.
 *
 * With color, a Color row below lets the shadow take another color while
 * there is one. Unset, its circle shows the color the shadow uses.
 */
import { BaseControl, Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { link } from "@wordpress/icons";

import { useShadowPresets } from "../hooks/use-shadow-presets.js";
import { samePreset } from "../utilities/presets.js";
import { shadowFallback } from "../utilities/responsive-styles.js";
import { previewShadow, shadowColorOf } from "../utilities/shadow.js";
import { ColorRow, ColorRows } from "./ColorRows.jsx";

/** What "None" saves, when a setting offers it as a value. */
const NONE = "none";

/**
 * @param {Object}                            props              Component props.
 * @param {string}                            props.label        Setting label, e.g. "Shadow".
 * @param {string|undefined}                  props.value        Saved value.
 * @param {(value: string|undefined) => void} props.onChange     Receives the value to save, or undefined to clear it.
 * @param {string}                            [props.emptyLabel] The clearing button's label, when it isn't "None" (e.g. "Same as normal").
 * @param {boolean}                           [props.withNone]   Also offer "None" as a value of its own.
 * @param {string}                            [props.help]       Help text below the buttons.
 * @param {Object}                            [props.color]      The shadow's color for ColorRow, with label, value and onChange, and optionally inherited and inheritedName.
 * @return {Element} The control.
 */
export function ShadowControl({
	label,
	value,
	onChange,
	emptyLabel,
	withNone = false,
	help,
	color,
}) {
	const presets = useShadowPresets();

	const choices = [
		emptyLabel
			? { value: undefined, name: emptyLabel, icon: link }
			: { value: undefined, name: __("None", "codexa-blocks") },
		...(withNone
			? [{ value: NONE, name: __("None", "codexa-blocks") }]
			: []),
		...presets,
	];
	// A saved shadow that is none of the presets, such as one an add-on
	// customized (ShadowSettings.jsx), shows as Custom with no button
	// pressed.
	const chosen =
		choices.find((choice) =>
			choice.value === undefined || choice.value === NONE
				? choice.value === value
				: samePreset(choice.value, value)
		) ??
		(shadowFallback(value)
			? { value, name: __("Custom", "codexa-blocks") }
			: choices[0]);
	const hasShadow = Boolean(shadowFallback(chosen.value));

	return (
		<fieldset className="codexa-shadow-control">
			<BaseControl.VisualLabel as="legend">
				{label}
			</BaseControl.VisualLabel>
			<div className="codexa-shadow-control__choices">
				{choices.map((choice) => {
					const tile = previewShadow(choice.value);

					return (
						<Button
							key={choice.value ?? "empty"}
							className="codexa-shadow-control__choice"
							label={choice.name}
							showTooltip
							isPressed={choice === chosen}
							icon={choice.icon}
							onClick={() => onChange(choice.value)}
						>
							{!choice.icon && (
								<span
									className={
										tile
											? "codexa-shadow-control__tile"
											: "codexa-shadow-control__tile is-empty"
									}
									style={
										tile ? { boxShadow: tile } : undefined
									}
									aria-hidden="true"
								/>
							)}
						</Button>
					);
				})}
			</div>
			<p className="codexa-shadow-control__chosen" aria-hidden="true">
				{chosen.name}
			</p>
			{help && <p className="codexa-shadow-control__help">{help}</p>}
			{color && hasShadow && (
				<div className="codexa-shadow-control__color">
					<ColorRows>
						<ColorRow
							label={__("Color", "codexa-blocks")}
							colors={[
								{
									...color,
									inherited:
										color.inherited || shadowColorOf(value),
									inheritedName: color.inherited
										? color.inheritedName
										: __(
												"the shadow's own color",
												"codexa-blocks"
											),
								},
							]}
						/>
					</ColorRows>
				</div>
			)}
		</fieldset>
	);
}
