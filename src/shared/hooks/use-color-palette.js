/**
 * The editor's color palettes, and the conversions between a saved color
 * and the color the editor shows. Used by ColorControl (the palette and
 * picker) and ColorRows (the circles that open it).
 *
 * A palette color is saved as its variable with its hex value as the
 * fallback, e.g. "var(--wp--preset--color--primary, #00606b)". A custom
 * color is saved as hex ("#3a3a3a", or "#3a3a3a80" with transparency). The
 * hex is what the browser shows, so themes can write their palette in any
 * format. The server only accepts hex (Style::color()).
 */
import { useSettings } from "@wordpress/block-editor";
import { useMemo } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

import { toHex } from "../utilities/color.js";

const SAVED_PRESET = /^var\(--wp--preset--color--([a-z0-9-]+),\s*(.+)\)$/;

/**
 * @return {{origins: Array<Object>, allowCustom: boolean, toShown: (saved: string|undefined) => string|undefined, toSaved: (color: string|undefined) => string|undefined, nameOf: (saved: string) => string}} The palettes and conversions.
 */
export function useColorPalette() {
	const [theme, defaults, custom, showDefaults, allowCustom] = useSettings(
		"color.palette.theme",
		"color.palette.default",
		"color.palette.custom",
		"color.defaultPalette",
		"color.custom"
	);

	return useMemo(() => {
		// The palettes the editor offers, grouped by origin as WordPress shows them.
		const origins = [
			{ name: __("Theme", "codexa-blocks"), colors: theme },
			{
				name: __("Default", "codexa-blocks"),
				colors: showDefaults ? defaults : [],
			},
			{ name: __("Custom", "codexa-blocks"), colors: custom },
		].filter(({ colors }) => colors?.length);

		const presets = origins.flatMap(({ colors }) => colors);

		/**
		 * The preset a saved value names, while the theme still has it.
		 *
		 * @param {string|undefined} saved Saved value.
		 * @return {{preset: Object|undefined, fallback: string|undefined}} The preset, and the color saved with it.
		 */
		const presetOf = (saved) => {
			const [, slug, fallback] =
				(typeof saved === "string" && saved.match(SAVED_PRESET)) || [];

			return {
				preset: slug
					? presets.find((entry) => entry.slug === slug)
					: undefined,
				fallback,
			};
		};

		return {
			origins,
			allowCustom: allowCustom !== false,

			/**
			 * Saved value => the color to show, the preset's current color while the
			 * theme has it, otherwise the saved fallback.
			 *
			 * @param {string|undefined} saved Saved value.
			 * @return {string|undefined} Color to show.
			 */
			toShown(saved) {
				const { preset, fallback } = presetOf(saved);

				return preset?.color ?? fallback ?? saved;
			},

			/**
			 * Picked color => saved value, a palette color as its variable with its hex
			 * fallback, any other color as hex.
			 *
			 * @param {string|undefined} color Color from the palette or picker.
			 * @return {string|undefined} Value to save.
			 */
			toSaved(color) {
				if (!color) {
					return undefined;
				}

				const preset = presets.find(
					(entry) => entry.color.toLowerCase() === color.toLowerCase()
				);
				const hex = toHex(color);

				return preset
					? `var(--wp--preset--color--${preset.slug}, ${hex})`
					: hex;
			},

			/**
			 * A saved color's name for screen readers, the palette name ("Primary") or
			 * the color itself ("#3a3a3a").
			 *
			 * @param {string} saved Saved value.
			 * @return {string} The name.
			 */
			nameOf(saved) {
				const { preset, fallback } = presetOf(saved);

				return preset?.name ?? fallback ?? saved;
			},
		};
	}, [theme, defaults, custom, showDefaults, allowCustom]);
}
