/**
 * The editor twin of CodexaBlocks\Utilities\Style and ResponsiveStyles.
 *
 * Builds the same classes and CSS variables from a block's per-device
 * settings, so the editor preview and the published page use the same
 * stylesheet rules (src/common/scss/_responsive.scss). PHP stays the
 * security check for the published page; the validators here mirror its
 * rules so the preview never shows a value the page would drop.
 */

/**
 * Devices in cascade order, with the suffix each adds to class and variable
 * names. Must match ResponsiveStyles::DEVICES in PHP.
 */
export const DEVICES = Object.freeze([
	{ key: "desktop", suffix: "" },
	{ key: "tablet", suffix: "-tablet" },
	{ key: "mobile", suffix: "-mobile" },
]);

/** Sides of a box setting, in CSS order. Must match ResponsiveStyles::SIDES. */
export const SIDES = Object.freeze(["top", "right", "bottom", "left"]);

/** Corners of a box setting, in CSS order. Must match ResponsiveStyles::CORNERS. */
export const CORNERS = Object.freeze([
	"top-left",
	"top-right",
	"bottom-right",
	"bottom-left",
]);

const NUMBER = String.raw`-?(?:\d+|\d*\.\d+)`;
const UNITS = "px|rem|em|%|vh|vw|svh|lvh|dvh|vmin|vmax|ch|ex";
const PLAIN_LENGTH = new RegExp(`^(?:0|${NUMBER}(?:${UNITS}))$`);
const PRESET =
	/^var\((?:--wp--preset--(?:spacing|font-size|border-radius)--|--codexa-(?:radius|spacing|font-size)-)[a-z0-9-]+,\s*(.+)\)$/;
const SIZING_FUNCTION = /^(?:clamp|min|max|calc)\(/;
const SAFE_CHARACTERS = /^[a-z0-9.%+\-*/,() ]+$/;

/**
 * Validates a length without a preset wrapper. Mirrors Style::plainLength().
 *
 * @param {string} value Lowercase, trimmed value.
 * @return {string} The value, or "".
 */
function plainLength(value) {
	if (PLAIN_LENGTH.test(value)) {
		return value;
	}

	const otherFunction = value
		.replace(/\b(?:clamp|min|max|calc)\(/g, "")
		.match(/[a-z]+\(/);
	const balanced =
		(value.match(/\(/g) ?? []).length === (value.match(/\)/g) ?? []).length;

	return value.length <= 200 &&
		SIZING_FUNCTION.test(value) &&
		SAFE_CHARACTERS.test(value) &&
		!otherFunction &&
		balanced
		? value
		: "";
}

/**
 * Validates a length. Mirrors Style::length() in PHP.
 *
 * @param {string|number|undefined} value Saved value.
 * @return {string} The value, or "" when it is not a safe length.
 */
export function cssLength(value) {
	if (typeof value !== "string" && typeof value !== "number") {
		return "";
	}

	const clean = String(value).trim().toLowerCase();
	const preset = clean.match(PRESET);

	if (preset) {
		return plainLength(preset[1]) ? clean : "";
	}

	return plainLength(clean);
}

/**
 * Validates a line height, a plain number from 0.5 to 5. Mirrors
 * Style::lineHeight() in PHP.
 *
 * @param {string|number|undefined} value Saved value.
 * @return {string} The value, or "" when it is not a line height.
 */
export function cssLineHeight(value) {
	if (typeof value !== "string" && typeof value !== "number") {
		return "";
	}

	const clean = String(value).trim();
	const number = Number(clean);

	return /^\d(?:\.\d{1,2})?$/.test(clean) && number >= 0.5 && number <= 5
		? clean
		: "";
}

const GRID_TRACK = String.raw`\d{1,2}(?:\.\d{1,2})?fr`;
const GRID_TEMPLATE = new RegExp(`^${GRID_TRACK}(?: ${GRID_TRACK}){0,5}$`);

/**
 * Validates a grid column template made of fr units, such as "2fr 1fr".
 * Mirrors Style::gridTemplate() in PHP.
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The value, or "" when it is not a valid template.
 */
export function cssGridTemplate(value) {
	return typeof value === "string" && GRID_TEMPLATE.test(value) ? value : "";
}

/**
 * Validates how many grid columns an element spans, "auto" for one or
 * "span 2" to "span 6". Mirrors Style::gridSpan() in PHP.
 *
 * @param {string|undefined} value Calculated value.
 * @return {string} The value, or "" when it is not a valid span.
 */
export function cssGridSpan(value) {
	return typeof value === "string" && /^(?:auto|span [2-6])$/.test(value)
		? value
		: "";
}

/**
 * Converts an on/off setting to the 1 or 0 a CSS calculation can use.
 * Mirrors Style::flag() in PHP.
 *
 * @param {boolean|undefined} value Saved value.
 * @return {string} "1" for true, "0" for false, "" for anything else.
 */
export function cssFlag(value) {
	if (typeof value !== "boolean") {
		return "";
	}

	return value ? "1" : "0";
}

const COLOR_PRESET = /^var\(--wp--preset--color--[a-z0-9-]+,\s*(.+)\)$/;
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;

/**
 * Validates a color without a preset wrapper. Mirrors Style::plainColor().
 *
 * @param {string} value Lowercase, trimmed value.
 * @return {string} The value, or "".
 */
function plainColor(value) {
	return value === "transparent" ||
		value === "currentcolor" ||
		HEX_COLOR.test(value)
		? value
		: "";
}

/**
 * Validates a color. Mirrors Style::color() in PHP.
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The value, or "" when it is not a safe color.
 */
export function cssColor(value) {
	if (typeof value !== "string") {
		return "";
	}

	const clean = value.trim().toLowerCase();
	const preset = clean.match(COLOR_PRESET);

	if (preset) {
		return plainColor(preset[1]) ? clean : "";
	}

	return plainColor(clean);
}

/** One length in a saved shadow, in pixels as the browser resolves them. */
const SHADOW_LENGTH = String.raw`-?(?:\d+|\d*\.\d+)px`;

/** One saved shadow layer, optional inset, two to four lengths and a hex color. */
const SHADOW_LAYER = String.raw`(?:inset )?${SHADOW_LENGTH}(?: ${SHADOW_LENGTH}){1,3} #(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})`;

/** A shadow in the saved form, one to five layers. */
const SAVED_SHADOW = new RegExp(`^${SHADOW_LAYER}(?:, ${SHADOW_LAYER}){0,4}$`);

/** A saved shadow preset, its variable with its shadow as the fallback. */
const SHADOW_PRESET =
	/^var\((?:--wp--preset--shadow--|--codexa-shadow-)[a-z0-9-]+, (.+)\)$/;

/**
 * Whether a shadow is in the saved form, as toSavedShadow() writes it and
 * the plugin's own shadows are. Mirrors Style::plainShadow() in PHP.
 *
 * @param {string} value A shadow.
 * @return {boolean} True when it is.
 */
export const isSavedShadow = (value) => SAVED_SHADOW.test(value);

/**
 * The shadow a saved preset was saved with, its fallback.
 *
 * @param {string|undefined} value Saved value, e.g. "var(--codexa-shadow-md, 0px 6px 16px 0px #00000026)".
 * @return {string} e.g. "0px 6px 16px 0px #00000026", or "" when the value isn't a valid preset.
 */
export function shadowFallback(value) {
	if (typeof value !== "string") {
		return "";
	}

	const fallback = value.trim().toLowerCase().match(SHADOW_PRESET)?.[1] ?? "";

	return isSavedShadow(fallback) ? fallback : "";
}

/**
 * Validates a shadow, a preset with its saved shadow as the fallback, or
 * "none". With a color, every layer of the fallback takes it. Mirrors
 * Style::shadow() in PHP.
 *
 * @param {string|undefined} value   Saved value.
 * @param {string|undefined} [color] Saved shadow color (see cssColor()).
 * @return {string} The shadow, or "" when the value is neither.
 */
export function cssShadow(value, color) {
	if (typeof value !== "string") {
		return "";
	}

	const clean = value.trim().toLowerCase();

	if (clean === "none") {
		return clean;
	}

	const fallback = shadowFallback(clean);

	if (!fallback) {
		return "";
	}

	const tint = cssColor(color);

	if (!tint) {
		return clean;
	}

	// Each layer ends with its color. Keep the rest and add the new color.
	return fallback
		.split(", ")
		.map((layer) => `${layer.slice(0, layer.lastIndexOf(" "))} ${tint}`)
		.join(", ");
}

/**
 * Converts a saved background image to a CSS url() value. Mirrors
 * Style::backgroundImage(), except that the editor shows the saved URL; PHP
 * looks the URL up from the attachment ID instead.
 *
 * @param {Object|string|undefined} value { id, url }, or "none".
 * @return {string} 'url("…")', "none", or "".
 */
export function cssBackgroundImage(value) {
	if (value === "none") {
		return "none";
	}

	const url = value?.url;

	return typeof url === "string" && /^https?:\/\/[^"\\()<>\s]+$/i.test(url)
		? `url("${url}")`
		: "";
}

/**
 * Converts a saved focal point to a CSS background position. Mirrors
 * Style::position() in PHP.
 *
 * @param {{x: number, y: number}|undefined} value Focal point, each from 0 to 1.
 * @return {string} e.g. "50% 30%", or "".
 */
export function cssPosition(value) {
	if (typeof value?.x !== "number" || typeof value?.y !== "number") {
		return "";
	}

	const axis = (number) =>
		`${Math.round(Math.min(Math.max(number, 0), 1) * 10000) / 100}%`;

	return `${axis(value.x)} ${axis(value.y)}`;
}

/**
 * Converts a saved percentage (0 to 100) to the fraction CSS opacity uses.
 * Mirrors Style::opacity() in PHP.
 *
 * @param {number|undefined} value Saved value.
 * @return {string} e.g. "0.5" for 50, or "".
 */
export function cssOpacity(value) {
	return typeof value === "number" && value >= 0 && value <= 100
		? String(Math.round(value) / 100)
		: "";
}

/**
 * A palette color as cssColor() returns it, with its slug, e.g.
 * "var(--wp--preset--color--white, #ffffff)" => "white". Must match
 * ResponsiveStyles::PALETTE_COLOR in PHP.
 */
const PALETTE_COLOR = /^var\(--wp--preset--color--([a-z0-9-]+),/;

/**
 * Builds the classes and variables for a block's per-device settings. Mirrors
 * ResponsiveStyles in PHP. A palette color also gets a class naming it, e.g.
 * "has-codexa-button-color--white".
 *
 * @example
 * const styles = responsiveStyles()
 *     .box("padding", attributes.padding, cssLength)
 *     .add("min-height", attributes.minHeight, cssLength);
 *
 * useBlockProps({ className: styles.classNames(), style: styles.style() });
 *
 * @return {Object} Builder with add(), box(), classNames() and style().
 */
export function responsiveStyles() {
	const classes = [];
	const variables = {};

	const builder = {
		/**
		 * Adds a per-device setting.
		 *
		 * @param {string}                                  property Name used in the class and variable.
		 * @param {Object}                                  value    { desktop, tablet, mobile }.
		 * @param {(v: string|boolean|undefined) => string} sanitize Returns the CSS value, or "".
		 * @return {Object} The builder.
		 */
		add(property, value, sanitize) {
			for (const { key, suffix } of DEVICES) {
				const clean = sanitize(value?.[key]);

				if (clean) {
					classes.push(`has-codexa-${property}${suffix}`);
					variables[`--codexa-${property}${suffix}`] = clean;

					// The "--" keeps it apart from the device classes.
					const palette = String(clean).match(PALETTE_COLOR);

					if (palette) {
						classes.push(
							`has-codexa-${property}${suffix}--${palette[1]}`
						);
					}
				}
			}

			return builder;
		},

		/**
		 * Adds a per-device box setting (padding, margin), one side at a time.
		 *
		 * @param {string}                          property "padding" or "margin".
		 * @param {Object}                          value    Per-device sides, e.g. { desktop: { top, … }, tablet: {…} }.
		 * @param {(v: string|undefined) => string} sanitize Returns the CSS value, or "".
		 * @param {string[]}                        [sides]  Sides to read, in CSS order.
		 * @return {Object} The builder.
		 */
		box(property, value, sanitize, sides = SIDES) {
			for (const side of sides) {
				builder.add(
					`${property}-${side}`,
					Object.fromEntries(
						DEVICES.map(({ key }) => [key, value?.[key]?.[side]])
					),
					sanitize
				);
			}

			return builder;
		},

		/** @return {string} Class names, space separated. */
		classNames: () => [...new Set(classes)].join(" "),

		/** @return {Object} The variables, for a React style prop. */
		style: () => ({ ...variables }),
	};

	return builder;
}

/**
 * Returns the value a device shows, its own or the next larger device's.
 *
 * @param {Object} value  { desktop, tablet, mobile }.
 * @param {string} device "desktop", "tablet" or "mobile".
 * @return {string|boolean|Object|undefined} The effective value, or undefined.
 */
export function effectiveValue(value, device) {
	const index = DEVICES.findIndex(({ key }) => key === device);

	for (let i = index; i >= 0; i--) {
		const candidate = value?.[DEVICES[i].key];

		if (candidate !== undefined && candidate !== "") {
			return candidate;
		}
	}

	return undefined;
}

/**
 * Sets one device's value and drops empty devices, so saved content only
 * holds what was actually chosen. When no device has a value left, returns
 * undefined, so the attribute is removed instead of saved as {}.
 *
 * @param {Object|undefined}                value  Current { desktop, tablet, mobile }.
 * @param {string}                          device Device to change.
 * @param {string|boolean|Object|undefined} next   New value; undefined, "" or an empty object clears it.
 * @return {Object|undefined} The new per-device value, or undefined when it is empty.
 */
export function setDeviceValue(value, device, next) {
	const isEmpty =
		next === undefined ||
		next === null ||
		next === "" ||
		(typeof next === "object" &&
			Object.values(next).every((v) => v === undefined || v === ""));
	const result = { ...(value ?? {}) };

	if (isEmpty) {
		delete result[device];
	} else {
		result[device] = next;
	}

	return Object.keys(result).length ? result : undefined;
}
