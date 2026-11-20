/**
 * Writes build/icons/codexa.json from the SVG files in src/icons/codexa/.
 * Each icon has an outline (outline/name.svg) and a solid version
 * (solid/name.svg), saved as "name" and "name-solid".
 *
 * The editor fetches the file only when the icon picker or a button with
 * an icon needs it, and PHP (CodexaBlocks\Utilities\Icons) reads it to
 * print the icons a page uses as inline SVG.
 *
 * Each SVG names its icon in <title> and lists search words in <desc>, so
 * typing "email" finds the envelope.
 *
 *     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" …>
 *         <title>Envelope</title><desc>email mail message contact</desc>
 *         <path d="…"/></svg>
 *
 * Icons are kept as data, their root attributes and a list of [element,
 * attributes] shapes. Only the drawing elements and attributes below are
 * kept, and values with url() or a script scheme are dropped.
 *
 *     { "name": "codexa", "icons": { "phone-solid": {
 *         "label": "Phone", "keywords": "call telephone …", "style": "solid",
 *         "svg": { "viewBox": "0 0 24 24", "fill": "currentColor" },
 *         "shapes": [["path", { "d": "M9.29 3.21…" }]] } } }
 *
 * Runs at the start of npm run build and npm run dev. To add an icon, add
 * its outline/ and solid/ files, drawn on the same 24-unit grid. Run it on
 * its own with node scripts/build-icons.mjs.
 */

import {
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

/** Where the icons are drawn, one folder per style. */
const SOURCE = "src/icons/codexa";

/** Each style's folder, and the suffix its icons' names get. */
const STYLES = { outline: "", solid: "-solid" };

/** Where the set is written. */
const OUTPUT = "build/icons/codexa.json";

/** Drawing elements kept. Must match Icons::SHAPES in PHP. */
const SHAPES = new Set([
	"path",
	"circle",
	"ellipse",
	"rect",
	"line",
	"polyline",
	"polygon",
]);

/** Presentation attributes the root <svg> keeps. Must match Icons::ROOT_ATTRIBUTES in PHP. */
const ROOT_ATTRIBUTES = new Set([
	"viewBox",
	"fill",
	"stroke",
	"stroke-width",
	"stroke-linecap",
	"stroke-linejoin",
]);

/** Attributes a shape keeps. Must match Icons::SHAPE_ATTRIBUTES in PHP. */
const SHAPE_ATTRIBUTES = new Set([
	"d",
	"cx",
	"cy",
	"r",
	"rx",
	"ry",
	"x",
	"y",
	"x1",
	"y1",
	"x2",
	"y2",
	"width",
	"height",
	"points",
	"transform",
	"fill",
	"fill-rule",
	"clip-rule",
	"stroke",
	"stroke-width",
	"stroke-linecap",
	"stroke-linejoin",
	"opacity",
	"vector-effect",
]);

/** A value made only of numbers, words, path commands and punctuation. Must match Icons::SAFE_VALUE in PHP. */
const SAFE_VALUE = /^[\w\s.,#%()+-]*$/;

/**
 * Reads an element's attributes.
 *
 * @param {string} source The attributes as written, e.g. 'd="M4 12" fill="none"'.
 * @return {Object<string, string>} Name => value.
 */
function readAttributes(source) {
	return Object.fromEntries(
		[...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [
			name,
			value,
		])
	);
}

/**
 * Keeps the allowed attributes with safe values.
 *
 * @param {Object<string, string>} attributes Name => value.
 * @param {Set<string>}            allowed    Names to keep.
 * @return {Object<string, string>} The kept attributes.
 */
function keep(attributes, allowed) {
	return Object.fromEntries(
		Object.entries(attributes).filter(
			([name, value]) =>
				allowed.has(name) &&
				SAFE_VALUE.test(value) &&
				!/url\(|script:/i.test(value)
		)
	);
}

/**
 * Converts one SVG source into the set's format.
 *
 * An icon without a fill gets currentColor, the text color; without it,
 * it would be black.
 *
 * @param {string} source The SVG file.
 * @return {{label: string, keywords: string, svg: Object, shapes: Array}} The icon.
 */
function convert(source) {
	const root = source.match(/<svg\b([^>]*)>/);
	const attributes = readAttributes(root?.[1] ?? "");

	attributes.fill ??= "currentColor";

	const shapes = [...source.matchAll(/<([a-z]+)\b([^>]*?)\/?>/g)]
		.filter(([, tag]) => SHAPES.has(tag))
		.map(([, tag, rest]) => [
			tag,
			keep(readAttributes(rest), SHAPE_ATTRIBUTES),
		]);

	return {
		label: source.match(/<title>([^<]*)<\/title>/)?.[1].trim() ?? "",
		keywords: source.match(/<desc>([^<]*)<\/desc>/)?.[1].trim() ?? "",
		svg: keep(attributes, ROOT_ATTRIBUTES),
		shapes,
	};
}

const icons = {};

for (const [style, suffix] of Object.entries(STYLES)) {
	for (const file of readdirSync(join(SOURCE, style)).sort()) {
		const slug = basename(file, ".svg");

		if (!file.endsWith(".svg") || !/^[a-z0-9-]+$/.test(slug)) {
			continue;
		}

		const icon = convert(readFileSync(join(SOURCE, style, file), "utf8"));

		if (icon.label && icon.svg.viewBox && icon.shapes.length) {
			icons[slug + suffix] = { ...icon, style };
		}
	}
}

// Start from an empty folder, so a set that's renamed or removed doesn't
// leave its old file in build/ and in the plugin zip.
rmSync(dirname(OUTPUT), { recursive: true, force: true });
mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify({ name: "codexa", icons }));

console.log(`${OUTPUT}: ${Object.keys(icons).length} icons`);
