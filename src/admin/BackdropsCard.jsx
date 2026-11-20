/**
 * The site's default backdrops on the Colors page (BackdropSettings), each
 * a color and an opacity, with a sample of the color over a checkerboard
 * so the see-through part shows. Saved with the colors, by ColorsApp's
 * Save button.
 */
import { RangeControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import { ColorField } from "./ColorField.jsx";

/**
 * @param {Object}                                 props             Component props.
 * @param {Array}                                  props.backdrops   The backdrops, from BackdropSettings::backdrops().
 * @param {Object}                                 props.values      Each backdrop's color and opacity, key => { color, opacity }.
 * @param {(key: string, entry: Object) => void}   props.onChange    Receives a backdrop's key and its whole new entry.
 * @param {Array}                                  props.palette     The theme's colors.
 * @param {Object}                                 props.conversions From useColorConversions().
 * @param {string|null}                            props.openField   The field whose palette is open.
 * @param {(key: string, isOpen: boolean) => void} props.onToggle    Opens or closes a field's palette.
 * @return {Element} The card.
 */
export function BackdropsCard({
	backdrops,
	values,
	onChange,
	palette,
	conversions,
	openField,
	onToggle,
}) {
	return (
		<section
			className="codexa-colors__card"
			aria-labelledby="codexa-backdrops-title"
		>
			<div>
				<h2 id="codexa-backdrops-title">
					{__("Backdrops", "codexa-blocks")}
				</h2>
				<p className="codexa-colors__intro">
					{__(
						"The see-through color behind something opened over the page. Lower opacity lets more of the page show through.",
						"codexa-blocks"
					)}
				</p>
			</div>

			{backdrops.map((backdrop) => {
				const entry = values[backdrop.key] ?? {};
				const fieldKey = `backdrop-${backdrop.key}`;
				const opacity = entry.opacity ?? backdrop.opacity;
				const shown =
					conversions.toShown(entry.color) ?? backdrop.color;

				/**
				 * Saves the backdrop with one part changed, or removed when undefined.
				 *
				 * @param {string}                  part "color" or "opacity".
				 * @param {string|number|undefined} next The new value.
				 */
				const update = (part, next) => {
					const result = { ...entry, [part]: next };

					if (next === undefined) {
						delete result[part];
					}

					onChange(backdrop.key, result);
				};

				return (
					<div key={backdrop.key} className="codexa-colors__backdrop">
						<ColorField
							field={{
								key: fieldKey,
								label: backdrop.label,
								description: backdrop.description,
								default: backdrop.color,
							}}
							value={entry.color}
							palette={palette}
							conversions={conversions}
							isOpen={openField === fieldKey}
							onToggle={(next) => onToggle(fieldKey, next)}
							onChange={(next) => update("color", next)}
						/>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__("Opacity", "codexa-blocks")}
							min={0}
							max={100}
							value={entry.opacity}
							initialPosition={backdrop.opacity}
							allowReset
							resetFallbackValue={undefined}
							onChange={(next) =>
								update(
									"opacity",
									Number.isInteger(next) ? next : undefined
								)
							}
						/>
						<div
							className="codexa-colors__backdrop-sample"
							style={{
								"--codexa-sample-color": shown,
								"--codexa-sample-opacity": `${opacity}%`,
							}}
							aria-hidden="true"
						/>
					</div>
				);
			})}
		</section>
	);
}
