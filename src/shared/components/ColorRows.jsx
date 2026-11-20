/**
 * Color settings as a compact list, one row per colored part with a circle
 * for each state (normal, hover, active…). Clicking a circle opens the
 * palette and picker (ColorControl) beside the sidebar. An unset color
 * shows a struck-through circle.
 *
 *     <ColorRows>
 *         <ColorRow label="Text" colors={[{ label: "Text", value, onChange }]} />
 *         <ColorRow label="Link" colors={[
 *             { label: "Link", value: linkColor, onChange: … },
 *             { label: "Link hover", value: linkHoverColor, onChange: … },
 *         ]} />
 *     </ColorRows>
 *
 * Rows of states can name the states above the circles, one per column.
 *
 *     <ColorRows states={["Normal", "Hover", "Active"]}>…</ColorRows>
 *
 * A gradient has its own row, GradientRow, with one circle.
 */
import { Button, Dropdown, GradientPicker } from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";

import { useColorPalette } from "../hooks/use-color-palette.js";
import { cssGradient, toSavedGradient } from "../utilities/gradient.js";
import { ColorControl } from "./ColorControl.jsx";

/**
 * Where a row's popover opens, beside the whole row as WordPress's own
 * color popovers do, so it sits clear of the sidebar rather than over it.
 *
 * @param {HTMLElement|null} anchor The row.
 * @return {Object} Popover props.
 */
export const besideRow = (anchor) => ({
	placement: "left-start",
	offset: 36,
	shift: true,
	anchor: anchor ?? undefined,
});

/**
 * One color, a circle that opens its picker. An inherited color shows in the
 * circle, with its inheritedName.
 *
 * @param {Object}                            props                 Component props.
 * @param {string}                            props.label           The color's full name, e.g. "Link hover".
 * @param {string|undefined}                  props.value           Saved color.
 * @param {(value: string|undefined) => void} props.onChange        Receives the color to save, or undefined to clear it.
 * @param {HTMLElement|null}                  props.anchor          The row, which the popover opens beside.
 * @param {string}                            [props.inherited]     The color used while this one isn't set.
 * @param {string}                            [props.inheritedName] What the inherited color is, e.g. "same as normal".
 * @return {Element} The circle and its popover.
 */
export function ColorSwatch({
	label,
	value,
	onChange,
	anchor,
	inherited,
	inheritedName,
}) {
	const { toShown, nameOf } = useColorPalette();
	const shown = toShown(value) || toShown(inherited);
	let named = __("not set", "codexa-blocks");

	if (value) {
		named = nameOf(value);
	} else if (inherited && inheritedName) {
		named = inheritedName;
	}

	return (
		<Dropdown
			popoverProps={besideRow(anchor)}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					className="codexa-color-swatch"
					onClick={onToggle}
					aria-expanded={isOpen}
					label={sprintf(
						/* translators: 1: A setting, e.g. "Primary", "Link hover" or "Padding (tablet), Top". 2: Its value, e.g. "Accent", "#3a3a3a", "not set" or "24px". */
						__("%1$s: %2$s", "codexa-blocks"),
						label,
						named
					)}
					showTooltip
				>
					<span
						className={
							shown
								? "codexa-color-swatch__color"
								: "codexa-color-swatch__color is-empty"
						}
						style={shown ? { "--codexa-swatch": shown } : undefined}
					/>
				</Button>
			)}
			renderContent={() => (
				<div className="codexa-color-swatch__popover">
					<ColorControl
						label={label}
						value={value}
						onChange={onChange}
					/>
				</div>
			)}
		/>
	);
}

/**
 * One row, a name and its colors.
 *
 * @param {Object}                                                                              props        Component props.
 * @param {string}                                                                              props.label  What the colors apply to, e.g. "Link".
 * @param {Array<{label: string, value: string|undefined, onChange: (value?: string) => void}>} props.colors One per state, normal first. Each can also have inherited and inheritedName (see ColorSwatch).
 * @return {Element} The row.
 */
export function ColorRow({ label, colors }) {
	const [row, setRow] = useState(null);

	return (
		<div className="codexa-color-row" ref={setRow}>
			<span className="codexa-color-row__label">{label}</span>
			<div className="codexa-color-row__swatches">
				{colors.map((color) => (
					<ColorSwatch key={color.label} {...color} anchor={row} />
				))}
			</div>
		</div>
	);
}

/**
 * A gradient as a row like ColorRow, saved as hex (gradient.js). The picker
 * opens beside the sidebar, since inside it a stop's color picker runs past the
 * window and shakes.
 *
 * @param {Object}                            props             Component props.
 * @param {string}                            props.label       The row's name, e.g. "Gradient".
 * @param {string}                            props.title       The gradient's full name, e.g. "Background gradient".
 * @param {string|undefined}                  props.value       Saved gradient.
 * @param {(value: string|undefined) => void} props.onChange    Receives the gradient to save, or undefined when cleared.
 * @param {boolean}                           [props.clearable] Whether the picker offers Clear (true by default).
 * @return {Element} The row.
 */
export function GradientRow({
	label,
	title,
	value,
	onChange,
	clearable = true,
}) {
	const [row, setRow] = useState(null);
	const shown = cssGradient(value);

	return (
		<div className="codexa-color-row" ref={setRow}>
			<span className="codexa-color-row__label">{label}</span>
			<div className="codexa-color-row__swatches">
				<Dropdown
					popoverProps={besideRow(row)}
					renderToggle={({ isOpen, onToggle }) => (
						<Button
							className="codexa-color-swatch"
							onClick={onToggle}
							aria-expanded={isOpen}
							label={
								shown
									? title
									: sprintf(
											/* translators: 1: A setting, e.g. "Primary", "Link hover" or "Padding (tablet), Top". 2: Its value, e.g. "Accent", "#3a3a3a", "not set" or "24px". */
											__("%1$s: %2$s", "codexa-blocks"),
											title,
											__("not set", "codexa-blocks")
										)
							}
							showTooltip
						>
							<span
								className={
									shown
										? "codexa-color-swatch__color is-gradient"
										: "codexa-color-swatch__color is-empty"
								}
								style={
									shown
										? { "--codexa-swatch": shown }
										: undefined
								}
							/>
						</Button>
					)}
					renderContent={() => (
						<div className="codexa-color-swatch__popover">
							<GradientPicker
								value={shown || undefined}
								gradients={[]}
								clearable={clearable}
								onChange={(next) => {
									if (!next) {
										onChange(undefined);
										return;
									}

									const saved = toSavedGradient(next);

									if (saved) {
										onChange(saved);
									}
								}}
							/>
						</div>
					)}
				/>
			</div>
		</div>
	);
}

/**
 * A color for ColorRow that reads and saves one block attribute.
 *
 * @param {Object}                       attributes    Block attributes.
 * @param {(attributes: Object) => void} setAttributes Updates attributes.
 * @param {string}                       name          Attribute name, e.g. "buttonHoverColor".
 * @param {string}                       label         The color's full name, e.g. "Hover text".
 * @return {{label: string, value: string|undefined, onChange: (value?: string) => void}} The color.
 */
export const attributeColor = (attributes, setAttributes, name, label) => ({
	label,
	value: attributes[name],
	onChange: (next) => setAttributes({ [name]: next }),
});

/**
 * The list the rows sit in.
 *
 * The state names are visual only, since each circle's label already names
 * its state for screen readers, e.g. "Hover title text".
 *
 * @param {Object}   props          Component props.
 * @param {Element}  props.children ColorRow elements.
 * @param {string[]} [props.states] Names of the columns, e.g. ["Normal", "Hover"]. Every row then has one color per state.
 * @return {Element} The list.
 */
export function ColorRows({ children, states }) {
	if (!states?.length) {
		return <div className="codexa-color-rows">{children}</div>;
	}

	return (
		<div className="codexa-color-rows has-states">
			<div className="codexa-color-rows__states" aria-hidden="true">
				{states.map((state) => (
					<span key={state}>{state}</span>
				))}
			</div>
			{children}
		</div>
	);
}
