/**
 * A border's color, style and per-device width in one place.
 *
 * Linked, the color circle, a sample of the style and one width share a row.
 * Unlinked, each side gets its own width with its icon (BoxFields.jsx).
 *
 * Color and style are one value, and width is per device. They're saved as
 * three settings (DesignStyles), and style and color print only where a
 * side has a width.
 */
import {
	Button,
	Dropdown,
	MenuGroup,
	MenuItem,
	NavigableMenu,
} from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";

import { BORDER_STYLES } from "../utilities/design-styles.js";
import { SIDES } from "../utilities/responsive-styles.js";
import { BoxFields } from "./BoxFields.jsx";
import { ColorSwatch } from "./ColorRows.jsx";
import { ResponsiveControl } from "./ResponsiveControl.jsx";

const STYLE_LABELS = {
	solid: __("Solid", "codexa-blocks"),
	dashed: __("Dashed", "codexa-blocks"),
	dotted: __("Dotted", "codexa-blocks"),
	double: __("Double", "codexa-blocks"),
};

/** The style the stylesheet draws when none is chosen. */
const DEFAULT_STYLE = "solid";

/**
 * A short line in a border style.
 *
 * @param {Object} props       Component props.
 * @param {string} props.style A border style, e.g. "dashed".
 * @return {Element} The line.
 */
function StyleSample({ style }) {
	return (
		<span
			className="codexa-border-control__sample"
			style={{ borderTopStyle: style }}
			aria-hidden="true"
		/>
	);
}

/**
 * The style as a sample of the line, which opens the styles.
 *
 * @param {Object}                            props          Component props.
 * @param {string|undefined}                  props.value    The saved style.
 * @param {(value: string|undefined) => void} props.onChange Receives the style, or undefined for the default.
 * @return {Element} The picker.
 */
function StylePicker({ value, onChange }) {
	const shown = BORDER_STYLES.includes(value) ? value : DEFAULT_STYLE;
	const choices = [
		{
			value: undefined,
			label: sprintf(
				/* translators: %s: The value used when nothing is chosen, e.g. "Solid". */
				__("Default (%s)", "codexa-blocks"),
				STYLE_LABELS[DEFAULT_STYLE]
			),
			sample: DEFAULT_STYLE,
		},
		...BORDER_STYLES.map((style) => ({
			value: style,
			label: STYLE_LABELS[style],
			sample: style,
		})),
	];

	return (
		<Dropdown
			popoverProps={{ placement: "bottom-start" }}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					className="codexa-border-control__style"
					onClick={onToggle}
					aria-expanded={isOpen}
					aria-haspopup="true"
					label={sprintf(
						/* translators: %s: A border style, e.g. "Dashed". */
						__("Border style: %s", "codexa-blocks"),
						value
							? STYLE_LABELS[shown]
							: choices[0].label.toLowerCase()
					)}
					showTooltip
				>
					<StyleSample style={shown} />
				</Button>
			)}
			renderContent={({ onClose }) => (
				<NavigableMenu
					role="menu"
					aria-label={__("Border style", "codexa-blocks")}
				>
					<MenuGroup>
						{choices.map((choice) => (
							<MenuItem
								key={choice.label}
								role="menuitemradio"
								isSelected={choice.value === value}
								className="codexa-border-control__choice"
								onClick={() => {
									onChange(choice.value);
									onClose();
								}}
							>
								<StyleSample style={choice.sample} />
								{choice.label}
							</MenuItem>
						))}
					</MenuGroup>
				</NavigableMenu>
			)}
		/>
	);
}

/**
 * @param {Object}                            props               Component props.
 * @param {string}                            props.label         Label, e.g. "Border".
 * @param {Object}                            props.width         Per-device sides, e.g. { desktop: { top: "2px", … } }.
 * @param {string|undefined}                  props.style         The saved style.
 * @param {string|undefined}                  props.color         The saved color.
 * @param {(value: Object|undefined) => void} props.onWidthChange Receives the whole per-device width, or undefined.
 * @param {(value: string|undefined) => void} props.onStyleChange Receives the style, or undefined for the default.
 * @param {(value: string|undefined) => void} props.onColorChange Receives the color, or undefined to clear it.
 * @return {Element} The control.
 */
export function BorderControl({
	label,
	width,
	style,
	color,
	onWidthChange,
	onStyleChange,
	onColorChange,
}) {
	// The color's popover opens beside the whole control.
	const [anchor, setAnchor] = useState(null);

	const lead = (
		<div className="codexa-border-control__lead">
			<ColorSwatch
				label={__("Border color", "codexa-blocks")}
				value={color}
				onChange={onColorChange}
				anchor={anchor}
			/>
			<StylePicker value={style} onChange={onStyleChange} />
		</div>
	);

	return (
		<div className="codexa-border-control" ref={setAnchor}>
			<ResponsiveControl
				label={label}
				value={width}
				onChange={onWidthChange}
			>
				{(control) => (
					// A new set of fields per device, so the link never
					// carries over between devices.
					<BoxFields
						key={control.device}
						label={sprintf(
							/* translators: %s: Setting name with its device, e.g. "Border (tablet)". */
							__("%s width", "codexa-blocks"),
							control.label
						)}
						device={control.device}
						actions={control.actions}
						box={control.value}
						value={width}
						parts={SIDES}
						linkAll
						presets={[]}
						units="border"
						compact
						lead={lead}
						onChange={control.onChange}
					/>
				)}
			</ResponsiveControl>
		</div>
	);
}
