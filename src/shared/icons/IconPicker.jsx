/**
 * Picks an icon from a button showing the current one, which opens a
 * searchable window of every offered icon.
 *
 * The grid has one Tab stop. Arrow keys move between icons, Home and End
 * jump to the ends, and Enter or Space picks one. Each icon's name is its
 * label and tooltip.
 *
 *     <IconPicker label="Icon" value={icon}
 *         onChange={(next) => setAttributes({ icon: next })} />
 *
 * Saves "set/icon", e.g. "codexa/phone", or "none".
 */
import {
	BaseControl,
	Button,
	Modal,
	SearchControl,
	SelectControl,
	Spinner,
} from "@wordpress/components";
import { useInstanceId } from "@wordpress/compose";
import { useMemo, useState } from "@wordpress/element";
import { __, _n, sprintf } from "@wordpress/i18n";

import { IconPickerActionsSlot } from "./IconPickerActions.jsx";
import { IconSvg } from "./IconSvg.jsx";
import { getIconSets, parseIcon, useIconSet } from "./icon-sets.js";

/** What "None" saves. */
const NONE = "none";

/**
 * Names an icon from its slug when its set gives no label, e.g.
 * "arrow-right" => "Arrow right".
 *
 * @param {string} slug Icon name.
 * @return {string} A readable name.
 */
const nameFromSlug = (slug) =>
	slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

/**
 * Whether a set draws its icons in more than one style (outline and solid).
 *
 * @param {Object|undefined} icons Icon name => icon data.
 * @return {boolean} True when some icon is solid.
 */
const hasStyles = (icons) =>
	Object.values(icons ?? {}).some((icon) => icon.style === "solid");

/**
 * Lists a set's icons in one style that match a search. Every word typed
 * must appear in the icon's label, name or search words, so "email" finds
 * the envelope. Sorted by label.
 *
 * @param {Object|undefined} icons  Icon name => icon data.
 * @param {string}           search What was typed.
 * @param {string}           style  "outline" or "solid", for a set with both; an icon without a style is an outline.
 * @return {Array<{name: string, label: string}>} Matching icons.
 */
function matchingIcons(icons, search, style) {
	const words = search.toLowerCase().split(/\s+/).filter(Boolean);
	const isStyled = hasStyles(icons);

	return Object.entries(icons ?? {})
		.filter(([, icon]) => !isStyled || (icon.style ?? "outline") === style)
		.map(([name, icon]) => ({
			name,
			label: icon.label || nameFromSlug(name),
			text: `${icon.label} ${name} ${icon.keywords ?? ""}`.toLowerCase(),
		}))
		.filter(({ text }) => words.every((word) => text.includes(word)))
		.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Moves focus between the icons with the arrow keys, Home and End, keeping
 * one Tab stop for the whole grid (the focused icon gets tabIndex 0).
 *
 * @param {KeyboardEvent} event The key press.
 */
function moveFocus(event) {
	const grid = event.currentTarget;
	const items = [...grid.querySelectorAll(".codexa-icon-picker__item")];
	const index = items.indexOf(event.target);

	if (index === -1) {
		return;
	}

	// Icons per line, from the grid's laid-out columns.
	const columns = grid.ownerDocument.defaultView
		.getComputedStyle(grid)
		.gridTemplateColumns.split(" ").length;
	const isRtl =
		grid.ownerDocument.defaultView.getComputedStyle(grid).direction ===
		"rtl";
	const moves = {
		ArrowRight: isRtl ? -1 : 1,
		ArrowLeft: isRtl ? 1 : -1,
		ArrowDown: columns,
		ArrowUp: -columns,
		Home: -index,
		End: items.length - 1 - index,
	};

	if (!(event.key in moves)) {
		return;
	}

	event.preventDefault();

	const next =
		items[
			Math.min(Math.max(index + moves[event.key], 0), items.length - 1)
		];

	items.forEach((item) => item.setAttribute("tabindex", "-1"));
	next.setAttribute("tabindex", "0");
	next.focus();
}

/**
 * The window with the icons.
 *
 * @param {Object}                  props          Component props.
 * @param {string}                  props.title    The window's title, e.g. "Choose an icon".
 * @param {string}                  props.value    The saved icon.
 * @param {(value: string) => void} props.onChange Receives the picked icon.
 * @param {() => void}              props.onClose  Closes the window.
 * @return {Element} The window.
 */
function IconPickerModal({ title, value, onChange, onClose }) {
	const sets = getIconSets();
	const current = parseIcon(value);
	const [setName, setSetName] = useState(
		current && sets.some(({ name }) => name === current.set)
			? current.set
			: sets[0]?.name
	);
	const [search, setSearch] = useState("");
	const [style, setStyle] = useState(
		current?.name.endsWith("-solid") ? "solid" : "outline"
	);
	const icons = useIconSet(setName);
	const results = useMemo(
		() => matchingIcons(icons, search, style),
		[icons, search, style]
	);

	// The grid's Tab stop is the saved icon when it's listed, else the first.
	const selected = current?.set === setName ? current.name : undefined;
	const tabStop = results.some(({ name }) => name === selected)
		? selected
		: (results[0]?.name ?? NONE);

	const pick = (next) => {
		onChange(next);
		onClose();
	};

	return (
		<Modal
			title={title}
			onRequestClose={onClose}
			size="large"
			className="codexa-icon-picker__modal"
		>
			<div className="codexa-icon-picker__filters">
				<SearchControl
					__nextHasNoMarginBottom
					label={__("Search icons", "codexa-blocks")}
					value={search}
					onChange={setSearch}
				/>
				{hasStyles(icons) && (
					<div
						className="codexa-icon-picker__styles"
						role="group"
						aria-label={__("Icon style", "codexa-blocks")}
					>
						{[
							["outline", __("Outline", "codexa-blocks")],
							["solid", __("Solid", "codexa-blocks")],
						].map(([key, name]) => (
							<Button
								key={key}
								variant="secondary"
								isPressed={style === key}
								onClick={() => setStyle(key)}
							>
								{name}
							</Button>
						))}
					</div>
				)}
				{sets.length > 1 && (
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={__("Icon set", "codexa-blocks")}
						value={setName}
						options={sets.map(({ name, label }) => ({
							label,
							value: name,
						}))}
						onChange={setSetName}
					/>
				)}
			</div>

			{!icons && <Spinner />}

			{icons && (
				<>
					<p className="codexa-icon-picker__count" role="status">
						{sprintf(
							/* translators: %d: Number of icons shown. */
							_n(
								"%d icon",
								"%d icons",
								results.length,
								"codexa-blocks"
							),
							results.length
						)}
					</p>
					{/* The arrow keys move between the buttons inside (moveFocus()); */}
					{/* the group itself is never focused. */}
					{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
					<div
						className="codexa-icon-picker__grid"
						role="group"
						aria-label={title}
						onKeyDown={moveFocus}
					>
						{!search && (
							<Button
								className="codexa-icon-picker__item"
								tabIndex={tabStop === NONE ? 0 : -1}
								isPressed={!current}
								onClick={() => pick(NONE)}
							>
								<span className="codexa-icon-picker__none" />
								<span className="codexa-icon-picker__name">
									{__("None", "codexa-blocks")}
								</span>
							</Button>
						)}
						{results.map(({ name, label }) => (
							<Button
								key={name}
								className="codexa-icon-picker__item"
								tabIndex={tabStop === name ? 0 : -1}
								isPressed={selected === name}
								onClick={() => pick(`${setName}/${name}`)}
							>
								<IconSvg value={`${setName}/${name}`} />
								<span className="codexa-icon-picker__name">
									{label}
								</span>
							</Button>
						))}
					</div>
					{!results.length && (
						<p>{__("No icons match.", "codexa-blocks")}</p>
					)}
				</>
			)}
			{/* An add-on's links or actions, e.g. Codexa Blocks Pro's "Add your own icons". */}
			<IconPickerActionsSlot>
				{(fills) =>
					fills.length > 0 && (
						<div className="codexa-icon-picker__actions">
							{fills}
						</div>
					)
				}
			</IconPickerActionsSlot>
		</Modal>
	);
}

/**
 * @param {Object}                  props          Component props.
 * @param {string}                  props.label    The setting's name, e.g. "Icon".
 * @param {string}                  [props.help]   A line under the control.
 * @param {string|undefined}        props.value    Saved icon, e.g. "codexa/phone", or "none".
 * @param {(value: string) => void} props.onChange Receives the new icon, or "none".
 * @return {Element} The control.
 */
export function IconPicker({ label, help, value, onChange }) {
	const [isOpen, setIsOpen] = useState(false);
	const id = useInstanceId(IconPicker, "codexa-icon-picker");
	const current = parseIcon(value);
	const icons = useIconSet(current?.set);
	const name = current
		? (icons?.[current.name]?.label ?? nameFromSlug(current.name))
		: __("None", "codexa-blocks");

	return (
		<BaseControl __nextHasNoMarginBottom id={id} label={label} help={help}>
			<div className="codexa-icon-picker">
				<Button
					id={id}
					className="codexa-icon-picker__toggle"
					variant="secondary"
					aria-haspopup="dialog"
					onClick={() => setIsOpen(true)}
				>
					<IconSvg value={value} />
					<span>{name}</span>
				</Button>
				{current && (
					<Button
						variant="tertiary"
						size="compact"
						onClick={() => onChange(NONE)}
					>
						{__("Remove", "codexa-blocks")}
					</Button>
				)}
			</div>
			{isOpen && (
				<IconPickerModal
					title={__("Choose an icon", "codexa-blocks")}
					value={value}
					onChange={onChange}
					onClose={() => setIsOpen(false)}
				/>
			)}
		</BaseControl>
	);
}
