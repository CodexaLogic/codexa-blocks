/**
 * The width of each column side by side, typed as a percentage, for when
 * dragging isn't exact enough.
 *
 * Changing one column's width takes the difference from its neighbour
 * (the next column, or the one before for the last), as dragging the edge
 * between them would, so the widths always add up to 100%. A width is
 * applied when the field loses focus or Enter is pressed, not on every
 * keystroke, so typing "45" doesn't first apply 4%.
 */
import { BaseControl, TextControl } from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";

import {
	MIN_PERCENT,
	fromUnits,
	setColumnWidth,
	toPercent,
	toUnits,
} from "./layouts.js";

/**
 * A percentage as the field shows it, with at most one decimal.
 *
 * @param {number} percent Percentage.
 * @return {string} e.g. "33.3".
 */
const toField = (percent) => String(Math.round(percent * 10) / 10);

/**
 * One column's field.
 *
 * @param {Object}                    props          Component props.
 * @param {string}                    props.label    Label, e.g. "Column 2".
 * @param {number}                    props.percent  The column's width.
 * @param {(percent: number) => void} props.onChange Receives a new width.
 * @return {Element} The field.
 */
function WidthField({ label, percent, onChange }) {
	const [draft, setDraft] = useState(null);

	const apply = () => {
		const next = parseFloat(draft);

		setDraft(null);

		if (Number.isFinite(next) && toField(next) !== toField(percent)) {
			onChange(next);
		}
	};

	return (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			type="number"
			label={label}
			min={MIN_PERCENT}
			max={100 - MIN_PERCENT}
			step={0.1}
			value={draft ?? toField(percent)}
			onChange={setDraft}
			onBlur={apply}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					apply();
				}
			}}
		/>
	);
}

/**
 * @param {Object}                     props          Component props.
 * @param {string}                     props.label    The Layout setting's name with its device, e.g. "Layout (tablet)".
 * @param {string}                     props.template The layout this device shows, e.g. "2fr 1fr".
 * @param {(template: string) => void} props.onChange Receives the new layout.
 * @return {Element} The fields.
 */
export function ColumnWidths({ label, template, onChange }) {
	const units = toUnits(template);

	return (
		<BaseControl __nextHasNoMarginBottom className="codexa-column-widths">
			<BaseControl.VisualLabel>
				{__("Column widths (%)", "codexa-blocks")}
			</BaseControl.VisualLabel>
			<div
				className="codexa-column-widths__fields"
				role="group"
				aria-label={sprintf(
					/* translators: %s: The Layout setting with its device, e.g. "Layout (tablet)". */
					__("%s: column widths (%%)", "codexa-blocks"),
					label
				)}
			>
				{units.map((unit, index) => (
					<WidthField
						// A new field when the number of columns changes.
						key={`${units.length}-${index}`}
						label={sprintf(
							/* translators: %d: Number of a column. */
							__("Column %d", "codexa-blocks"),
							index + 1
						)}
						percent={toPercent(unit)}
						onChange={(percent) =>
							onChange(
								fromUnits(setColumnWidth(units, index, percent))
							)
						}
					/>
				))}
			</div>
		</BaseControl>
	);
}
