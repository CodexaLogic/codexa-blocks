/**
 * Compact size field showing the device's value, such as "SM" or "24px".
 * Opens a preset picker with resolved sizes and None or Default first,
 * followed by a custom number and unit control.
 *
 * Used for preset sizes in LengthControl and for each side or corner
 * in BoxFields, which displays labels below the fields.
 *
 * Tablet and mobile show inherited values dimmed when no device-specific
 * value is set, using the next larger device's effective size.
 * samePreset() matches saved presets by CSS variable, regardless of fallback.
 */
import {
	Dropdown,
	Icon,
	MenuGroup,
	MenuItem,
	NavigableMenu,
} from "@wordpress/components";
import { __, sprintf } from "@wordpress/i18n";
import { check, chevronDown } from "@wordpress/icons";

import { samePreset } from "../utilities/presets.js";
import { LengthInput } from "./LengthInput.jsx";

/** What "None" saves. */
const NONE = "0";

/**
 * @param {Object}                  props               Component props.
 * @param {string}                  props.label         The setting's name with its device (and side), e.g. "Padding (tablet), Top".
 * @param {Array}                   props.presets       Presets, from usePresets().
 * @param {string|undefined}        props.value         This device's saved value.
 * @param {string|undefined}        props.inherited     The value this device inherits when it has none of its own.
 * @param {string}                  props.units         The kind of setting, a key of LENGTH_UNITS, for the custom size.
 * @param {(value: string) => void} props.onChange      Receives the chosen value, or "" to clear it.
 * @param {boolean}                 [props.withNone]    Offer None, which saves 0 (true by default).
 * @param {boolean}                 [props.withDefault] Offer Default, which clears the size so the block's own applies (by default only without None).
 * @param {boolean}                 [props.narrow]      One of several fields on a row (a side or corner) that shows a dash instead of "Default" when nothing is set.
 * @return {Element} The field.
 */
export function SizeField({
	label,
	presets,
	value,
	inherited,
	units,
	onChange,
	withNone = true,
	withDefault = !withNone,
	narrow = false,
}) {
	const own = value === "" ? undefined : value;
	const shown = own ?? inherited;
	const none = {
		value: NONE,
		short: __("None", "codexa-blocks"),
		name: __("None", "codexa-blocks"),
		size: "0",
	};
	const choices = [
		withDefault && {
			value: "",
			short: __("Default", "codexa-blocks"),
			name: __("Default", "codexa-blocks"),
		},
		withNone && none,
		...presets,
	].filter(Boolean);
	const preset = presets.find((choice) => samePreset(choice.value, shown));
	const isNone = withNone && shown === NONE;
	// A custom size is any size that isn't None or a preset.
	const custom = own !== undefined && !isNone && !preset ? own : undefined;

	// With nothing set, the theme's or block's own size applies. Narrow fields
	// (one per side) just show a dash.
	let text = narrow ? "–" : __("Default", "codexa-blocks");

	if (isNone) {
		text = none.short;
	} else if (preset) {
		text = preset.short ?? preset.name;
	} else if (shown) {
		text = shown;
	}

	const isSelected = (choice) =>
		choice.value === "" ? own === undefined : samePreset(choice.value, own);

	return (
		<Dropdown
			className="codexa-size-field"
			contentClassName="codexa-size-field__popover"
			popoverProps={{ placement: "bottom-start" }}
			renderToggle={({ isOpen, onToggle }) => (
				<button
					type="button"
					className={[
						"codexa-size-field__toggle",
						own === undefined && "is-inherited",
					]
						.filter(Boolean)
						.join(" ")}
					aria-expanded={isOpen}
					aria-haspopup="true"
					aria-label={sprintf(
						/* translators: 1: A setting, e.g. "Primary", "Link hover" or "Padding (tablet), Top". 2: Its value, e.g. "Accent", "#3a3a3a", "not set" or "24px". */
						__("%1$s: %2$s", "codexa-blocks"),
						label,
						own === undefined && !shown
							? __("default", "codexa-blocks")
							: text
					)}
					onClick={onToggle}
				>
					<span className="codexa-size-field__value">{text}</span>
					<Icon
						className="codexa-size-field__arrow"
						icon={chevronDown}
						size={18}
					/>
				</button>
			)}
			renderContent={({ onClose }) => (
				<div className="codexa-size-field__content">
					<NavigableMenu role="menu" aria-label={label}>
						<MenuGroup>
							{choices.map((choice) => (
								<MenuItem
									key={choice.value || "default"}
									role="menuitemradio"
									isSelected={isSelected(choice)}
									icon={
										isSelected(choice) ? check : undefined
									}
									iconPosition="left"
									suffix={
										choice.size ? (
											<span className="codexa-size-field__size">
												{choice.size}
											</span>
										) : undefined
									}
									onClick={() => {
										onChange(choice.value);
										onClose();
									}}
								>
									{choice.short &&
									choice.short !== choice.name
										? sprintf(
												/* translators: 1: A size's short name, e.g. "SM". 2: Its full name, e.g. "Small". */
												__(
													"%1$s · %2$s",
													"codexa-blocks"
												),
												choice.short,
												choice.name
											)
										: choice.name}
								</MenuItem>
							))}
						</MenuGroup>
					</NavigableMenu>
					<div className="codexa-size-field__custom">
						<span className="codexa-size-field__custom-label">
							{__("Custom size", "codexa-blocks")}
						</span>
						<LengthInput
							label={sprintf(
								/* translators: %s: Setting with its device, e.g. "Padding (tablet), Top". */
								__("%s, custom size", "codexa-blocks"),
								label
							)}
							value={custom}
							// A preset's size as the hint, e.g. 1 rem for SM.
							inherited={custom === undefined ? shown : undefined}
							onChange={onChange}
							units={units}
							compact
						/>
					</div>
				</div>
			)}
		/>
	);
}
