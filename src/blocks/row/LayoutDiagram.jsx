/**
 * A small picture of a column layout, with the Row's columns at their
 * relative widths, wrapping as the grid does, and the first or last column
 * stretched where the layout says. Used by the new Row picker and the Layout
 * choices. In right-to-left languages editor.scss mirrors it, as the grid is.
 */
import { Rect, SVG } from "@wordpress/primitives";

import { fillSpan } from "./layouts.js";

const WIDTH = 48;
const HEIGHT = 32;
const GAP = 2;

/**
 * Places columns as the browser does, left to right, where a column that
 * doesn't fit the rest of a line starts the next.
 *
 * @param {number}   tracks Columns side by side.
 * @param {number[]} spans  Tracks each column spans, in order.
 * @return {Array<{track: number, line: number, span: number}>} Where each column starts, and its span.
 */
function placeColumns(tracks, spans) {
	const cells = [];
	let track = 0;
	let line = 0;

	for (const span of spans) {
		if (track + span > tracks) {
			track = 0;
			line++;
		}

		cells.push({ track, line, span });
		track += span;
	}

	return cells;
}

/**
 * @param {Object} props          Component props.
 * @param {string} props.template Grid template, e.g. "2fr 1fr".
 * @param {number} [props.count]  Columns to draw; more than the template's tracks wrap onto more lines. Defaults to one line.
 * @param {string} [props.fill]   "first" or "last" to stretch that column across the empty space of its line.
 * @return {Element} The diagram.
 */
export function LayoutDiagram({ template, count, fill }) {
	const tracks = template.split(" ").map(parseFloat);
	const total = tracks.reduce((sum, track) => sum + track, 0);
	const columns = Math.max(count ?? tracks.length, 1);

	const spans = Array(columns).fill(1);
	const span = fillSpan(tracks.length, columns);

	if (fill === "first" || fill === "last") {
		spans[fill === "first" ? 0 : columns - 1] = span;
	}

	const cells = placeColumns(tracks.length, spans);
	const lines = cells[cells.length - 1].line + 1;

	// Many thin lines (twelve columns, one per line) get thinner gaps.
	const gap = Math.min(GAP, HEIGHT / (lines * 4));
	const space = WIDTH - GAP * (tracks.length - 1);
	const lineHeight = (HEIGHT - gap * (lines - 1)) / lines;

	// Left edge and width of each track, the same on every line.
	const widths = tracks.map((track) => (track / total) * space);
	const lefts = [];
	let x = 0;

	for (const width of widths) {
		lefts.push(x);
		x += width + GAP;
	}

	return (
		<SVG
			className="codexa-layout-diagram"
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			width={WIDTH}
			height={HEIGHT}
			aria-hidden="true"
			focusable="false"
		>
			{cells.map((cell, index) => {
				const end = cell.track + cell.span - 1;

				return (
					<Rect
						key={index}
						x={lefts[cell.track]}
						y={cell.line * (lineHeight + gap)}
						width={lefts[end] + widths[end] - lefts[cell.track]}
						height={lineHeight}
						rx={Math.min(2, lineHeight / 2)}
					/>
				);
			})}
		</SVG>
	);
}
