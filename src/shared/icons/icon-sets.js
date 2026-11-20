/**
 * Icon sets in the editor, listing them, loading a set and reading a saved
 * icon.
 *
 * The sets come from Icons::editorSets() (window.codexaBlocksIconSets),
 * each with its JSON file's address. A set is fetched once per session,
 * when a picker opens or a block shows one of its icons. Icons are saved as
 * "set/icon", e.g. "codexa/phone" or "codexa/phone-solid", or "none".
 */
import { useEffect, useState } from "@wordpress/element";

/** Each set's icons once loaded, by set name. */
const loaded = new Map();

/** Each set's icons while loading, by set name. */
const loading = new Map();

/**
 * The icon sets the editor offers.
 *
 * @return {Array<{name: string, label: string, url: string}>} The sets.
 */
export const getIconSets = () =>
	Array.isArray(window.codexaBlocksIconSets)
		? window.codexaBlocksIconSets
		: [];

/**
 * Splits a saved icon into its set and name. Mirrors Icons::parse() in PHP.
 *
 * @param {string|undefined} value Saved icon, e.g. "codexa/phone".
 * @return {{set: string, name: string}|null} The set and icon name, or null for none.
 */
export function parseIcon(value) {
	const match = (value ?? "").match(/^([a-z0-9-]+)\/([a-z0-9-]+)$/);

	return match ? { set: match[1], name: match[2] } : null;
}

/**
 * Loads a set's icons. A set that fails to load gives no icons, and is
 * tried again the next time it's asked for.
 *
 * @param {string} name Set name.
 * @return {Promise<Object>} Icon name => icon data (label, svg, shapes).
 */
export function loadIconSet(name) {
	if (!loading.has(name)) {
		const set = getIconSets().find((entry) => entry.name === name);
		const request = set
			? window
					.fetch(set.url)
					.then((response) =>
						response.ok ? response.json() : Promise.reject()
					)
					.then((data) => {
						const icons =
							data?.icons && typeof data.icons === "object"
								? data.icons
								: {};

						loaded.set(name, icons);

						return icons;
					})
					.catch(() => {
						loading.delete(name);

						return {};
					})
			: Promise.resolve({});

		loading.set(name, request);
	}

	return loading.get(name);
}

/**
 * A set's icons, loading them on first use.
 *
 * @param {string|undefined} name Set name.
 * @return {Object|undefined} Icon name => icon data, or undefined while loading.
 */
export function useIconSet(name) {
	const [icons, setIcons] = useState(() => loaded.get(name));

	useEffect(() => {
		let isCurrent = true;

		if (name) {
			loadIconSet(name).then((result) => {
				if (isCurrent) {
					setIcons(result);
				}
			});
		}

		return () => {
			isCurrent = false;
		};
	}, [name]);

	return name ? (loaded.get(name) ?? icons) : undefined;
}
