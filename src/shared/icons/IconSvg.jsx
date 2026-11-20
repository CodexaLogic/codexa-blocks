/**
 * Draws a saved icon in the editor, as the page does (Icons::svg() in
 * PHP), as an inline <svg> in the text color, hidden from screen readers.
 *
 * The icon is built from the set's data with the same allow-list of
 * elements and attributes as PHP, never from markup. While its set loads,
 * an empty box of the icon's size holds its place.
 */
import { createElement } from "@wordpress/element";

import { parseIcon, useIconSet } from "./icon-sets.js";

/** Drawing elements an icon may use. Must match Icons::SHAPES in PHP. */
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

/** A safe attribute value. Must match Icons::SAFE_VALUE in PHP. */
const SAFE_VALUE = /^[\w\s.,#%()+-]*$/;

/** Icons mirrored in right-to-left languages. Must match Icons::DIRECTIONAL in PHP. */
const DIRECTIONAL = /(?:^|-)(?:left|right|next|previous)(?:-|$)/;

/**
 * Keeps the allowed attributes with safe values, with React names. The fill
 * goes in the style attribute, as in Icons::svg(), so stylesheets that fill
 * every svg don't make line icons solid.
 *
 * @param {Object}      attributes Name => value.
 * @param {Set<string>} allowed    Names to keep.
 * @return {Object} React props.
 */
function toProps(attributes, allowed) {
	const props = Object.fromEntries(
		Object.entries(attributes ?? {})
			.filter(
				([name, value]) =>
					allowed.has(name) &&
					typeof value === "string" &&
					SAFE_VALUE.test(value) &&
					!/url\(|script:/i.test(value)
			)
			.map(([name, value]) => [
				name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
				value,
			])
	);
	const { fill, ...rest } = props;

	return fill ? { ...rest, style: { fill } } : rest;
}

/**
 * @param {Object}           props             Component props.
 * @param {string|undefined} props.value       Saved icon, e.g. "codexa/phone".
 * @param {string}           [props.className] Class for the <svg>.
 * @return {Element|null} The icon, a placeholder while it loads, or null for none.
 */
export function IconSvg({ value, className = "" }) {
	const parsed = parseIcon(value);
	const icons = useIconSet(parsed?.set);
	const icon = parsed ? icons?.[parsed.name] : undefined;

	if (!parsed || (icons && !icon)) {
		return null;
	}

	const classes = [
		className,
		DIRECTIONAL.test(parsed.name) && "is-directional",
	]
		.filter(Boolean)
		.join(" ");

	if (!icon) {
		return <span className={classes} aria-hidden="true" />;
	}

	return createElement(
		"svg",
		{
			...toProps(icon.svg, ROOT_ATTRIBUTES),
			xmlns: "http://www.w3.org/2000/svg",
			className: classes,
			"aria-hidden": true,
			focusable: false,
		},
		(icon.shapes ?? [])
			.filter((shape) => Array.isArray(shape) && SHAPES.has(shape[0]))
			.map(([tag, attributes], index) =>
				createElement(tag, {
					key: index,
					...toProps(attributes, SHAPE_ATTRIBUTES),
				})
			)
	);
}
