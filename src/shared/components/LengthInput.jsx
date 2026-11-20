/**
 * A custom size, a slider beside a number and unit like core's Minimum
 * height, built from stable components (UnitControl is still experimental).
 * Each setting kind has its own units and range (length-units.js), and a
 * value is saved only when it passes cssLength(), as in PHP. Used alone for
 * settings without presets, and without the slider in SizeField's menu.
 */
import {
	RangeControl,
	SelectControl,
	TextControl,
} from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";

import { LENGTH_UNITS, parseLength } from "../utilities/length-units.js";
import { cssLength } from "../utilities/responsive-styles.js";

/** A saved preset, its variable with its size as the fallback. */
const SAVED_PRESET = /^var\(--[a-z0-9-]+,\s*(.+)\)$/;

/**
 * The size a saved value shows in the custom size, a preset's fallback or
 * the value itself.
 *
 * @param {string|undefined} value Saved value.
 * @return {string|undefined} e.g. "3rem" for "var(--codexa-spacing-lg, 3rem)".
 */
const toField = (value) => value?.match(SAVED_PRESET)?.[1] ?? value;

/**
 * A size as a number in one of the field's units, or null when it isn't
 * one ("2ch" where ch isn't offered, or clamp()). "0" reads as zero in the
 * field's first unit.
 *
 * @param {string|undefined} value A size.
 * @param {Array}            units The field's units.
 * @return {{quantity: number, unit: string}|null} The number and unit.
 */
function readSize(value, units) {
	const parsed = parseLength(value);

	if (!parsed) {
		return null;
	}

	const unit = parsed.unit ?? units[0].value;

	return units.some((entry) => entry.value === unit)
		? { quantity: parsed.quantity, unit }
		: null;
}

/**
 * The custom size for one device, a slider and a number with its unit.
 * Passes on only valid lengths, or "" when the number is cleared.
 *
 * @param {Object}                  props           Component props.
 * @param {string}                  props.label     Accessible label.
 * @param {string|undefined}        props.value     This device's saved value.
 * @param {string|undefined}        props.inherited Value shown when there is none.
 * @param {(value: string) => void} props.onChange  Receives a valid length or "".
 * @param {string}                  props.units     The kind of setting, a key of LENGTH_UNITS.
 * @param {boolean}                 [props.compact] Only the number and its unit, without the slider.
 * @return {Element} The field.
 */
export function LengthInput({
	label,
	value,
	inherited,
	onChange,
	units: kind,
	compact = false,
}) {
	const { units, negative = false } = LENGTH_UNITS[kind];
	const field = toField(value);
	const own = readSize(field, units);
	const fromLarger = readSize(toField(inherited), units);
	const [unitValue, setUnitValue] = useState(
		own?.unit ?? fromLarger?.unit ?? units[0].value
	);
	const unit = units.find((entry) => entry.value === unitValue) ?? units[0];
	const quantity = own?.unit === unit.value ? own.quantity : undefined;
	const inheritedQuantity =
		fromLarger?.unit === unit.value ? fromLarger.quantity : undefined;
	// A saved size the field can't show, such as a fluid preset's clamp().
	const unreadable = Boolean(field) && !own ? field : "";

	// What the number field holds, kept while it's being typed ("1." on the
	// way to "1.5").
	const [draft, setDraft] = useState(
		quantity === undefined ? "" : String(quantity)
	);
	const [savedValue, setSavedValue] = useState(value);

	// The saved value changed from outside the number field (the slider, the
	// unit or "Use the desktop value"), so show it.
	if (value !== savedValue) {
		setSavedValue(value);

		if (Number(draft) !== quantity || draft.trim() === "") {
			setDraft(quantity === undefined ? "" : String(quantity));
		}
	}

	/**
	 * Saves a number in a unit, or clears the value.
	 *
	 * @param {number|undefined} next     The number, or undefined to clear.
	 * @param {string}           nextUnit The unit.
	 */
	const save = (next, nextUnit) => {
		if (next === undefined || Number.isNaN(next)) {
			onChange("");
			return;
		}

		const length = cssLength(
			`${negative ? next : Math.max(next, 0)}${nextUnit}`
		);

		if (length) {
			onChange(length);
		}
	};

	return (
		<div className="codexa-length-input">
			<div className="codexa-length-input__row">
				{!compact && (
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						className="codexa-length-input__slider"
						label={label}
						hideLabelFromVision
						withInputField={false}
						min={unit.min}
						max={unit.max}
						step={unit.step}
						value={quantity}
						initialPosition={inheritedQuantity ?? unit.min}
						renderTooltipContent={(position) =>
							`${position}${unit.value}`
						}
						onChange={(next) => save(next, unit.value)}
					/>
				)}
				<div className="codexa-length-input__number">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						label={label}
						hideLabelFromVision
						value={draft}
						placeholder={
							inheritedQuantity === undefined
								? ""
								: String(inheritedQuantity)
						}
						min={negative ? undefined : 0}
						step="any"
						onChange={(next) => {
							setDraft(next);

							if (next.trim() === "") {
								save(undefined, unit.value);
							} else if (parseLength(next)) {
								save(Number(next), unit.value);
							}
						}}
					/>
					{units.length > 1 ? (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={sprintf(
								/* translators: %s: Setting label, e.g. "Minimum height". */
								__("%s unit", "codexa-blocks"),
								label
							)}
							hideLabelFromVision
							value={unit.value}
							options={units.map((entry) => ({
								label: entry.label,
								value: entry.value,
							}))}
							onChange={(next) => {
								setUnitValue(next);

								if (own) {
									save(own.quantity, next);
								}
							}}
						/>
					) : (
						<span
							className="codexa-length-input__unit"
							title={unit.a11yLabel}
						>
							{unit.label}
						</span>
					)}
				</div>
			</div>
			{unreadable && (
				<p className="codexa-length-input__note">
					{sprintf(
						/* translators: %s: The current size, e.g. "clamp(1rem, 4vw, 3rem)". */
						__(
							"Now %s. Set a size to replace it.",
							"codexa-blocks"
						),
						unreadable
					)}
				</p>
			)}
		</div>
	);
}
