/**
 * Device-specific LengthControl fields for box sides or corners.
 * With presets, each field shows only the size, with its icon and label
 * below. Without presets, the icon appears before the number.
 *
 * Linked sides share fields in opposite pairs, or one field with linkAll.
 * Linked corners share one field. Linking starts enabled when the parts
 * sharing a field have matching values. Unlinked parts have separate fields.
 *
 * Each device stores padding, margin, or border widths as
 * { top, right, bottom, left }, or border radius as
 * { "top-left", "top-right", "bottom-right", "bottom-left" }.
 * Each value is a complete CSS value. Linking affects only the controls,
 * and every side or corner is always saved separately.
 *
 * Used by SpacingControl, BorderControl and RadiusControl.
 */
import { Button, Icon } from "@wordpress/components";
import { createPortal, useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";
import {
	cornerAll,
	cornerBottomLeft,
	cornerBottomRight,
	cornerTopLeft,
	cornerTopRight,
	link,
	linkOff,
	sidesAll,
	sidesBottom,
	sidesHorizontal,
	sidesLeft,
	sidesRight,
	sidesTop,
	sidesVertical,
} from "@wordpress/icons";

import { DEVICES, effectiveValue } from "../utilities/responsive-styles.js";
import { LengthField } from "./LengthControl.jsx";

/**
 * What each part is called and its icon, by kind; with what one field for
 * every part is called, and what pressing the link button does.
 */
const KINDS = {
	sides: {
		parts: {
			top: { name: __("Top", "codexa-blocks"), icon: sidesTop },
			right: { name: __("Right", "codexa-blocks"), icon: sidesRight },
			bottom: {
				name: __("Bottom", "codexa-blocks"),
				icon: sidesBottom,
			},
			left: { name: __("Left", "codexa-blocks"), icon: sidesLeft },
		},
		all: { name: __("All sides", "codexa-blocks"), icon: sidesAll },
		linkAll: __("Set all sides together", "codexa-blocks"),
		unlink: __("Set each side", "codexa-blocks"),
	},
	corners: {
		parts: {
			"top-left": {
				name: __("Top left", "codexa-blocks"),
				icon: cornerTopLeft,
			},
			"top-right": {
				name: __("Top right", "codexa-blocks"),
				icon: cornerTopRight,
			},
			"bottom-right": {
				name: __("Bottom right", "codexa-blocks"),
				icon: cornerBottomRight,
			},
			"bottom-left": {
				name: __("Bottom left", "codexa-blocks"),
				icon: cornerBottomLeft,
			},
		},
		all: { name: __("All corners", "codexa-blocks"), icon: cornerAll },
		linkAll: __("Set all corners together", "codexa-blocks"),
		unlink: __("Set each corner", "codexa-blocks"),
	},
};

/** Opposite sides, which share a field while linked (without linkAll). */
const PAIRS = [
	{
		parts: ["top", "bottom"],
		name: __("Top and bottom", "codexa-blocks"),
		icon: sidesVertical,
	},
	{
		parts: ["left", "right"],
		name: __("Left and right", "codexa-blocks"),
		icon: sidesHorizontal,
	},
];

/**
 * The fields shown while linked, one for every part, or each pair of
 * opposite sides that are both offered, then any side left on its own.
 *
 * @param {string}   kind    "sides" or "corners".
 * @param {string[]} parts   Offered parts, in CSS order.
 * @param {boolean}  linkAll One field for every part.
 * @return {Array<{parts: string[], name: string, icon: Element, isAll?: boolean}>} The fields.
 */
function linkedFields(kind, parts, linkAll) {
	const { all, parts: names } = KINDS[kind];

	const pairs = PAIRS.filter((pair) =>
		pair.parts.every((part) => parts.includes(part))
	);

	if (parts.length > 1 && (linkAll || kind === "corners")) {
		// With only one pair offered, such as a top and bottom margin, use that pair.
		const only = pairs.length === 1 && parts.length === 2;

		return only ? pairs : [{ parts, ...all, isAll: true }];
	}

	const paired = pairs.flatMap((pair) => pair.parts);

	return [
		...pairs,
		...parts
			.filter((part) => !paired.includes(part))
			.map((part) => ({ parts: [part], ...names[part] })),
	];
}

/**
 * Names the link button while unlinked by what pressing it does.
 *
 * @param {string}        kind   "sides" or "corners".
 * @param {Array<Object>} fields The fields linkedFields() returns.
 * @return {string} The label.
 */
function linkLabel(kind, fields) {
	if (fields[0].isAll) {
		return KINDS[kind].linkAll;
	}

	if (fields.length > 1 && fields.every(({ parts }) => parts.length > 1)) {
		return __(
			"Set top and bottom together, and left and right together",
			"codexa-blocks"
		);
	}

	return fields[0].parts[0] === "left"
		? __("Set left and right together", "codexa-blocks")
		: __("Set top and bottom together", "codexa-blocks");
}

/**
 * The value one part shows on a device without its own. Each part inherits on
 * its own, like the per-part CSS rules.
 *
 * @param {Object} value  Per-device box value.
 * @param {string} device Device being edited.
 * @param {string} part   e.g. "top" or "top-left".
 * @return {string|undefined} The inherited value, or undefined.
 */
function inheritedPart(value, device, part) {
	const perDevice = Object.fromEntries(
		DEVICES.map(({ key }) => [
			key,
			key === device ? undefined : value?.[key]?.[part],
		])
	);

	return effectiveValue(perDevice, device);
}

/**
 * The fallback one part shows when no device sets it, this device's own or
 * a larger device's.
 *
 * @param {Object|undefined} fallback Per-device box value.
 * @param {string}           device   Device being edited.
 * @param {string}           part     e.g. "top".
 * @return {string|undefined} The fallback, or undefined.
 */
function fallbackPart(fallback, device, part) {
	return effectiveValue(
		Object.fromEntries(
			DEVICES.map(({ key }) => [key, fallback?.[key]?.[part]])
		),
		device
	);
}

/**
 * @param {Object}                          props               Component props.
 * @param {string}                          props.label         The setting's name with its device, e.g. "Padding (tablet)".
 * @param {string}                          props.device        Device being edited.
 * @param {Object|undefined}                props.box           This device's own parts.
 * @param {Object|undefined}                props.value         The whole per-device value, for inherited parts.
 * @param {Object|undefined}                [props.fallback]    What applies while no device sets a part, in the value's shape.
 * @param {string}                          [props.kind]        "sides" (default) or "corners".
 * @param {string[]}                        props.parts         Parts to offer, in CSS order.
 * @param {boolean}                         [props.linkAll]     Linked, one field for every side instead of one per pair.
 * @param {Array}                           props.presets       Presets from usePresets().
 * @param {boolean}                         [props.withNone]    Offer None, which saves 0 (true by default).
 * @param {boolean}                         [props.withDefault] Offer Default, which clears the value (by default only without None).
 * @param {string}                          props.units         The kind of setting, a key of LENGTH_UNITS.
 * @param {boolean}                         [props.compact]     Number fields without the slider.
 * @param {Element}                         [props.lead]        Shown before the fields, beside the one field while linked, above them otherwise.
 * @param {HTMLElement|null}                [props.actions]     ResponsiveControl's header, where the link button goes.
 * @param {(box: Object|undefined) => void} props.onChange      Receives this device's new parts.
 * @return {Element} The fields.
 */
export function BoxFields({
	label,
	device,
	box,
	value,
	fallback,
	kind = "sides",
	parts,
	linkAll = false,
	presets,
	withNone = true,
	withDefault = !withNone,
	units,
	compact = false,
	lead,
	actions,
	onChange,
}) {
	const shownPart = (part) =>
		box?.[part] ??
		inheritedPart(value, device, part) ??
		fallbackPart(fallback, device, part);
	const linked = linkedFields(kind, parts, linkAll);
	const [isLinked, setIsLinked] = useState(() =>
		linked.every((field) =>
			field.parts.every(
				(part) => shownPart(part) === shownPart(field.parts[0])
			)
		)
	);

	/**
	 * Saves this device's parts. Only this kind's part names with a size
	 * are kept, so a saved value in any other shape, such as one string for
	 * every part, is replaced instead of spread into it letter by letter.
	 *
	 * @param {Object} changes Part => new value ("" clears it).
	 */
	const setParts = (changes) => {
		const saved = box && typeof box === "object" ? box : {};

		onChange(
			Object.fromEntries(
				Object.keys(KINDS[kind].parts)
					.map((part) => [
						part,
						part in changes ? changes[part] : saved[part],
					])
					.filter(
						([, size]) => typeof size === "string" && size !== ""
					)
			)
		);
	};

	const fields = isLinked
		? linked
		: parts.map((part) => ({ parts: [part], ...KINDS[kind].parts[part] }));

	// A single field for every part needs no name of its own.
	const isSingle =
		fields.length === 1 && fields[0].parts.length === parts.length;

	// With presets, every field is a compact SizeField, all on one row,
	// each named below by its icon and its part ("Top"). Without (border
	// widths), each field is a row of its own, the icon and then the number.
	const hasPresets = presets.length > 0;

	const rows = fields.map((field) => {
		const first = field.parts[0];
		const lengthField = (
			<LengthField
				label={
					isSingle
						? label
						: sprintf(
								/* translators: 1: Setting name with its device, e.g. "Padding (tablet)". 2: Side or corner, e.g. "Top and bottom". */
								__("%1$s, %2$s", "codexa-blocks"),
								label,
								field.name
							)
				}
				value={box?.[first]}
				inherited={
					box?.[first] === undefined ? shownPart(first) : undefined
				}
				presets={presets}
				withNone={withNone}
				withDefault={withDefault}
				units={units}
				compact={compact}
				narrow={hasPresets && fields.length > 1}
				onChange={(next) =>
					setParts(
						Object.fromEntries(
							field.parts.map((part) => [part, next])
						)
					)
				}
			/>
		);

		if (hasPresets) {
			// The name is already in the field's own label, so screen
			// readers skip the one shown below it.
			return (
				<div key={first} className="codexa-box-fields__field">
					{lengthField}
					<span
						className="codexa-box-fields__caption"
						aria-hidden="true"
					>
						<Icon icon={field.icon} size={14} />
						<span className="codexa-box-fields__name">
							{field.name}
						</span>
					</span>
				</div>
			);
		}

		return (
			<div key={first} className="codexa-box-fields__row">
				<Icon
					className="codexa-box-fields__icon"
					icon={field.icon}
					size={24}
				/>
				{lengthField}
			</div>
		);
	});

	const linkButton = parts.length > 1 && (
		<Button
			className="codexa-box-fields__link"
			size="small"
			icon={isLinked ? link : linkOff}
			label={isLinked ? KINDS[kind].unlink : linkLabel(kind, linked)}
			isPressed={isLinked}
			onClick={() => setIsLinked(!isLinked)}
		/>
	);

	return (
		<div className="codexa-box-fields">
			{
				// Beside the device switcher, or above the fields without one.
				actions ? createPortal(linkButton, actions) : linkButton
			}

			{hasPresets && (
				<div className="codexa-box-fields__fields">{rows}</div>
			)}
			{!hasPresets &&
				(lead && rows.length === 1 ? (
					<div className="codexa-box-fields__inline">
						{lead}
						{rows}
					</div>
				) : (
					<>
						{lead}
						{rows}
					</>
				))}
		</div>
	);
}
