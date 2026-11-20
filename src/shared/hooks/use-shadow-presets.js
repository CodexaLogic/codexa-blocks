/**
 * The shadow presets the editor offers, the theme's (shadow.presets),
 * WordPress's when kept (shadow.defaultPresets) and any added in the Site
 * Editor. Without any, the plugin's own (PLUGIN_SHADOWS) fill in.
 *
 * Each is saved as its variable with its shadow as the fallback, e.g.
 * "var(--wp--preset--shadow--natural, 6px 6px 9px 0px #00000033)", so it
 * follows the theme and survives without it. The fallback is in the saved
 * form (toSavedShadow()). Presets that can't be converted are left out.
 */
import { useSettings } from "@wordpress/block-editor";
import { useMemo } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

import { toSavedShadow } from "../utilities/shadow.js";

/**
 * Shadows used when the theme offers none, from the plugin's own tokens
 * (--codexa-shadow-*, src/common/scss/_variables.scss). The shadows must
 * match the tokens; they are the fallbacks saved with each preset.
 */
export const PLUGIN_SHADOWS = Object.freeze([
	{
		slug: "sm",
		name: __("Small", "codexa-blocks"),
		shadow: "0px 1px 3px 0px #0000001f",
	},
	{
		slug: "md",
		name: __("Medium", "codexa-blocks"),
		shadow: "0px 6px 16px 0px #00000026",
	},
	{
		slug: "lg",
		name: __("Large", "codexa-blocks"),
		shadow: "0px 16px 40px 0px #0003",
	},
]);

/**
 * @return {Array<{slug: string, name: string, shadow: string, value: string}>} The presets, theme's first.
 */
export function useShadowPresets() {
	const [theme, defaults, custom, showDefaults] = useSettings(
		"shadow.presets.theme",
		"shadow.presets.default",
		"shadow.presets.custom",
		"shadow.defaultPresets"
	);

	return useMemo(() => {
		const seen = new Set();
		const presets = [
			...(theme ?? []),
			...(showDefaults === false ? [] : (defaults ?? [])),
			...(custom ?? []),
		]
			.filter(({ slug, shadow }) => {
				const valid =
					/^[a-z0-9-]+$/.test(slug ?? "") &&
					typeof shadow === "string" &&
					!seen.has(slug);

				seen.add(slug);

				return valid;
			})
			.map(({ slug, name, shadow }) => {
				const saved = toSavedShadow(shadow);

				return {
					slug,
					name: name || slug,
					shadow,
					value: saved
						? `var(--wp--preset--shadow--${slug}, ${saved})`
						: "",
				};
			})
			.filter(({ value }) => value);

		return presets.length
			? presets
			: PLUGIN_SHADOWS.map((preset) => ({
					...preset,
					value: `var(--codexa-shadow-${preset.slug}, ${preset.shadow})`,
				}));
	}, [theme, defaults, custom, showDefaults]);
}
