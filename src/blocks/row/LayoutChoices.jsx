/**
 * The Row's Layout setting as a grid of pictures, one per layout, three to
 * a line. Each picture shows the Row's own columns in that layout,
 * wrapping onto more lines where the layout puts fewer side by side, so
 * what you click is what the device shows.
 *
 * The layouts come from layoutOptions(), which offers different ones for
 * desktop and for tablet and mobile, and for each number of columns per
 * line. withFillChoices() adds the ones with a stretched first or last
 * column.
 */
import { Button } from "@wordpress/components";

import { LayoutDiagram } from "./LayoutDiagram.jsx";

/**
 * @param {Object}                                               props          Component props.
 * @param {string}                                               props.label    The setting's name with its device, for screen readers, e.g. "Layout (tablet)".
 * @param {Array<{label: string, value: string, fill?: string}>} props.options  Layouts, from withFillChoices().
 * @param {string}                                               props.value    The layout this device shows.
 * @param {string}                                               props.fill     The column this device stretches ("first", "last" or "none").
 * @param {number}                                               props.count    Columns in the Row, drawn in each picture.
 * @param {(template: string, fill: string) => void}             props.onChange Receives the chosen grid template and fill.
 * @return {Element} The choices.
 */
export function LayoutChoices({
	label,
	options,
	value,
	fill,
	count,
	onChange,
}) {
	return (
		<div className="codexa-layout-choices" role="group" aria-label={label}>
			{options.map((option) => {
				const optionFill = option.fill ?? "none";

				return (
					<Button
						key={`${option.value} ${optionFill}`}
						className="codexa-layout-choices__choice"
						label={option.label}
						showTooltip
						isPressed={
							option.value === value && optionFill === fill
						}
						onClick={() => onChange(option.value, optionFill)}
					>
						<LayoutDiagram
							template={option.value}
							count={count}
							fill={option.fill}
						/>
					</Button>
				);
			})}
		</div>
	);
}
