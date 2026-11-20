/**
 * The size presets a length setting offers.
 *
 * Spacing (padding, margin, gaps) uses the plugin's named sizes, XS to XL,
 * the same on every theme. Font and radius sizes come from the theme
 * (theme.json), falling back to the plugin's when it has none. Theme font
 * sizes get short names from their slugs (shortName()).
 *
 * Each preset saves its variable with its size as the fallback, e.g.
 * "var(--codexa-spacing-lg, 3rem)", so the size survives if the variable
 * is missing. A saved value matches its preset by variable alone
 * (samePreset()), so it stays that preset when a size changes later.
 */
import { useSettings } from "@wordpress/block-editor";
import { useMemo } from "@wordpress/element";
import { __, _x } from "@wordpress/i18n";

import { cssLength } from "./responsive-styles.js";

/**
 * The spacing sizes, smallest first, with the short name each size button
 * shows. The sizes must match --codexa-spacing-* in _variables.scss; they
 * are the fallbacks saved with each preset.
 */
export const SPACING_SIZES = Object.freeze([
	{
		slug: "xs",
		short: _x("XS", "spacing size", "codexa-blocks"),
		name: __("Extra small", "codexa-blocks"),
		size: "0.5rem",
	},
	{
		slug: "sm",
		short: _x("SM", "spacing size", "codexa-blocks"),
		name: __("Small", "codexa-blocks"),
		size: "1rem",
	},
	{
		slug: "md",
		short: _x("MD", "spacing size", "codexa-blocks"),
		name: __("Medium", "codexa-blocks"),
		size: "2rem",
	},
	{
		slug: "lg",
		short: _x("LG", "spacing size", "codexa-blocks"),
		name: __("Large", "codexa-blocks"),
		size: "3rem",
	},
	{
		slug: "xl",
		short: _x("XL", "spacing size", "codexa-blocks"),
		name: __("Extra large", "codexa-blocks"),
		size: "4rem",
	},
]);

/**
 * The value a spacing size saves, e.g. "var(--codexa-spacing-lg, 3rem)".
 *
 * @param {string} slug A size's slug from SPACING_SIZES, e.g. "lg".
 * @return {string} The value, or "" for an unknown slug.
 */
export function spacingValue(slug) {
	const size = SPACING_SIZES.find((entry) => entry.slug === slug);

	return size ? `var(--codexa-spacing-${slug}, ${size.size})` : "";
}

/** A preset's variable in a saved value, e.g. "var(--codexa-spacing-lg, 3rem)" => "--codexa-spacing-lg". */
const PRESET_VARIABLE = /^var\((--[a-z0-9-]+)\s*[,)]/;

/**
 * Whether two saved values are the same size, the same preset whatever its
 * fallback ("var(--codexa-spacing-lg, 4rem)" and "…, 3rem)" are both LG),
 * or else equal.
 *
 * @param {string|undefined} first  A saved value.
 * @param {string|undefined} second Another.
 * @return {boolean} True when they are the same size.
 */
export function samePreset(first, second) {
	const variable = (value) =>
		typeof value === "string"
			? value.match(PRESET_VARIABLE)?.[1]
			: undefined;
	const firstVariable = variable(first);

	return firstVariable !== undefined
		? firstVariable === variable(second)
		: first !== undefined && first === second;
}

/** The spacing sizes as presets, with the value each saves. */
const SPACING_PRESETS = Object.freeze(
	SPACING_SIZES.map((size) => ({ ...size, value: spacingValue(size.slug) }))
);

/**
 * Font sizes used when the theme defines none (and WordPress's own are
 * turned off), from the plugin's own tokens (--codexa-font-size-*,
 * src/common/scss/_variables.scss). The sizes must match the tokens; they
 * are the fallbacks saved with each preset.
 */
export const PLUGIN_FONT_SIZES = Object.freeze([
	{
		slug: "xs",
		short: _x("XS", "font size", "codexa-blocks"),
		name: __("Extra small", "codexa-blocks"),
		size: "0.875rem",
	},
	{
		slug: "sm",
		short: _x("SM", "font size", "codexa-blocks"),
		name: __("Small", "codexa-blocks"),
		size: "1rem",
	},
	{
		slug: "md",
		short: _x("MD", "font size", "codexa-blocks"),
		name: __("Medium", "codexa-blocks"),
		size: "1.25rem",
	},
	{
		slug: "lg",
		short: _x("LG", "font size", "codexa-blocks"),
		name: __("Large", "codexa-blocks"),
		size: "1.5rem",
	},
	{
		slug: "xl",
		short: _x("XL", "font size", "codexa-blocks"),
		name: __("Extra large", "codexa-blocks"),
		size: "2rem",
	},
	{
		slug: "2xl",
		short: _x("2XL", "font size", "codexa-blocks"),
		name: __("Huge", "codexa-blocks"),
		size: "2.5rem",
	},
]);

/** Most buttons in one row; a setting with more presets gets the slider. */
const MAX_BUTTONS = 7;

/**
 * A short name for a theme size from its slug, e.g. "x-large" => "XL". The
 * theme's full name is the accessible label.
 *
 * @param {string} slug The size's slug.
 * @return {string|null} The short name, or null when the slug isn't a size name.
 */
export function shortName(slug) {
	const value = String(slug).toLowerCase();

	if (["medium", "normal", "regular", "base"].includes(value)) {
		return "MD";
	}

	if (/^(?:\d?x[sl]|sm|md|lg)$/.test(value)) {
		return value.toUpperCase();
	}

	// "small", "x-large", "xx-small", "2x-large"…
	const named = value.match(/^(?:(\d)x|(x*))-?(small|large)$/);

	if (!named) {
		return null;
	}

	const count = named[1] ? Number(named[1]) : named[2].length;
	const letter = named[3] === "small" ? "S" : "L";

	if (count === 0) {
		return letter === "S" ? "SM" : "LG";
	}

	return `${count > 1 ? count : ""}X${letter}`;
}

/**
 * Gives each preset its short name when all of them have one, different
 * from the others, and there are few enough for one row of buttons.
 * Otherwise the presets are returned as they are, for the slider.
 *
 * @param {Array<{slug: string}>} presets Presets.
 * @return {Array<{slug: string, short?: string}>} The presets.
 */
function withShortNames(presets) {
	const names = presets.map(({ slug }) => shortName(slug));
	const isUsable =
		presets.length > 0 &&
		presets.length <= MAX_BUTTONS &&
		names.every(Boolean) &&
		new Set(names).size === names.length;

	return isUsable
		? presets.map((preset, index) => ({ ...preset, short: names[index] }))
		: presets;
}

/**
 * Radius sizes used when the theme defines none, from the plugin's own
 * tokens (--codexa-radius-*, src/common/scss/_variables.scss). The sizes
 * must match the tokens; they are the fallbacks saved with each preset.
 */
export const PLUGIN_RADII = Object.freeze([
	{ slug: "sm", name: __("Small", "codexa-blocks"), size: "0.25rem" },
	{ slug: "md", name: __("Medium", "codexa-blocks"), size: "0.5rem" },
	{ slug: "lg", name: __("Large", "codexa-blocks"), size: "1rem" },
	{ slug: "pill", name: __("Pill", "codexa-blocks"), size: "50rem" },
]);

/**
 * Theme preset kinds, each with its theme.json setting, the switch for
 * WordPress's default sizes (where there are defaults) and its CSS variable
 * name.
 */
const KINDS = {
	"font-size": {
		setting: "typography.fontSizes",
		defaults: "typography.defaultFontSizes",
		variable: "font-size",
	},
	radius: {
		setting: "border.radiusSizes",
		defaults: null,
		variable: "border-radius",
	},
};

/**
 * Collects the sizes the editor offers, custom, then theme, then WordPress's
 * defaults when kept, without duplicate slugs.
 *
 * @param {Array|Object|undefined} sizes        The useSettings() result.
 * @param {boolean}                withDefaults Include WordPress's default sizes.
 * @return {Array<{slug: string, size: string, name: string}>} Sizes.
 */
function flattenSizes(sizes, withDefaults = true) {
	const list = Array.isArray(sizes)
		? sizes
		: [
				...(sizes?.custom ?? []),
				...(sizes?.theme ?? []),
				...(withDefaults ? (sizes?.default ?? []) : []),
			];
	const seen = new Set();

	return list.filter(({ slug }) => !seen.has(slug) && seen.add(slug));
}

/**
 * The presets for one kind of length, with the plugin's own as a fallback.
 * Presets that would fail cssLength() are left out.
 *
 * @param {"spacing"|"font-size"|"radius"|false} kind Preset kind, or false for none.
 * @return {Array<{slug: string, name: string, size: string, value: string, short?: string}>} Presets, smallest first for spacing, in the theme's order otherwise.
 */
export function usePresets(kind) {
	// Hooks run on every render, so the theme setting is read even for
	// spacing, which doesn't use it.
	const config = KINDS[kind] ?? KINDS.radius;
	const [sizes, defaults] = useSettings(
		config.setting,
		config.defaults ?? config.setting
	);

	return useMemo(() => {
		if (kind === "spacing") {
			return SPACING_PRESETS;
		}

		if (!KINDS[kind]) {
			return [];
		}

		const withDefaults = config.defaults ? defaults !== false : false;
		let presets = flattenSizes(sizes, withDefaults).map(
			({ slug, name, size }) => ({
				slug,
				name,
				size: String(size),
				value: `var(--wp--preset--${config.variable}--${slug}, ${size})`,
			})
		);

		if (kind === "radius" && !presets.length) {
			return PLUGIN_RADII.map((radius) => ({
				...radius,
				value: `var(--codexa-radius-${radius.slug}, ${radius.size})`,
			}));
		}

		presets = presets.filter(({ value }) => cssLength(value) !== "");

		if (kind === "font-size") {
			return presets.length
				? withShortNames(presets)
				: PLUGIN_FONT_SIZES.map((size) => ({
						...size,
						value: `var(--codexa-font-size-${size.slug}, ${size.size})`,
					}));
		}

		return presets;
	}, [kind, config, sizes, defaults]);
}
