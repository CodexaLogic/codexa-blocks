/**
 * Drag handles between a Row's columns, for setting the column widths by
 * hand in the editor.
 *
 * Shown while previewing desktop or tablet, and sets that device's layout.
 * Each handle covers a gap between two of the grid's tracks and runs down
 * through every line, since all lines share the same widths.
 * Hovering the gap shows a line and a round grip with a left-right arrow,
 * and while the Row is selected the grips show without hovering. Dragging
 * a handle moves that edge freely, to a tenth of a percent; holding Shift
 * snaps it to the lines of the 12-column grid (halves, thirds, quarters).
 * Once Tab has reached a handle (only while the Row is selected), the arrow
 * keys move it by one percent, and with Shift to the next grid line. The
 * widths are previewed while dragging and saved once, when the pointer is
 * released, so a drag is one undo step. In a right-to-left language the
 * first column is on the right, and the handles, the drag and the arrow
 * keys follow it.
 */
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";
import { Path, SVG } from "@wordpress/primitives";

import {
	formatPercent,
	fromPercent,
	fromUnits,
	moveEdge,
	toPercent,
	toUnits,
} from "./layouts.js";

/** Narrowest handle, in pixels, so a small or zero gap can still be grabbed. */
const MIN_HANDLE_WIDTH = 16;

/** A left-right arrow, drawn in the grip. */
const resizeArrow = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M7.5 7 2.5 12l5 5v-3.25h9V17l5-5-5-5v3.25h-9z" />
	</SVG>
);

/**
 * Whether the grid runs right to left, so its first track is on the right.
 *
 * @param {HTMLElement} grid The Row's grid element.
 * @return {boolean} True in a right-to-left language.
 */
const isRightToLeft = (grid) =>
	grid.ownerDocument.defaultView.getComputedStyle(grid).direction === "rtl";

/**
 * Measures each gap between two grid tracks, relative to the Row. Read from
 * the grid's track sizes and gap, not the columns, so the handles stay in
 * the gaps when a column is stretched or the order is reversed.
 *
 * @param {HTMLElement} grid The Row's grid element.
 * @return {Array<{left: number, top: number, width: number, height: number}>} One handle box per gap, centered on it.
 */
function measureEdges(grid) {
	const style = grid.ownerDocument.defaultView.getComputedStyle(grid);
	// The browser gives the track sizes in pixels, e.g. "300px 150px".
	const sizes = style.gridTemplateColumns.split(" ").map(parseFloat);
	// "normal" when no gap is set, which is no gap at all.
	const gap = parseFloat(style.columnGap) || 0;
	// Measured from the Row's inner edge, where the handles' left is 0.
	const left =
		grid.offsetLeft + grid.clientLeft + parseFloat(style.paddingLeft);
	const width =
		grid.clientWidth -
		parseFloat(style.paddingLeft) -
		parseFloat(style.paddingRight);
	const isRtl = style.direction === "rtl";
	// Distance from the grid's start, its left edge or its right in RTL.
	let along = 0;

	return sizes.slice(0, -1).map((size) => {
		along += size;

		const center = along + gap / 2;
		const handleWidth = Math.max(MIN_HANDLE_WIDTH, gap);
		const edge = {
			// The handle's left edge, half its width before the gap's center.
			left:
				(isRtl ? left + width - center : left + center) -
				handleWidth / 2,
			top: grid.offsetTop,
			width: handleWidth,
			height: grid.offsetHeight,
		};

		along += gap;

		return edge;
	});
}

/**
 * Describes the two columns beside an edge, e.g. "58.3% / 41.7%".
 *
 * @param {number[]} units Width of each column, in twelfths.
 * @param {number}   edge  Index of the edge.
 * @return {string} The two widths.
 */
const pairText = (units, edge) =>
	[units[edge], units[edge + 1]]
		.map((unit) => formatPercent(toPercent(unit)))
		.join(" / ");

/**
 * @param {Object}                      props           Component props.
 * @param {{current: HTMLElement}}      props.gridRef   The Row's grid element.
 * @param {string}                      props.template  The layout shown on the device being edited, e.g. "1fr 1fr".
 * @param {string}                      [props.draft]   The template being previewed during a drag.
 * @param {boolean}                     props.focusable Whether the handles are in the keyboard's Tab order (while the Row is selected).
 * @param {(template?: string) => void} props.onPreview Receives the template to preview while dragging, or nothing when the drag ends.
 * @param {(template: string) => void}  props.onChange  Receives the template to save.
 * @return {Element} The handles.
 */
export function ColumnResizer({
	gridRef,
	template,
	draft,
	focusable,
	onPreview,
	onChange,
}) {
	const [edges, setEdges] = useState([]);
	const [active, setActive] = useState(null);
	const drag = useRef(null);
	const shown = draft ?? template;
	const units = toUnits(shown);

	const measure = useCallback(() => {
		if (gridRef.current) {
			setEdges(measureEdges(gridRef.current));
		}
	}, [gridRef]);

	// Measure again after every change of widths, before the browser paints.
	useLayoutEffect(measure, [measure, shown]);

	// ...and whenever the Row or a column changes size (content, window).
	useEffect(() => {
		const grid = gridRef.current;
		const view = grid?.ownerDocument.defaultView;
		const observer = view?.ResizeObserver
			? new view.ResizeObserver(measure)
			: null;

		if (observer) {
			observer.observe(grid);
			[...grid.children].forEach((child) => observer.observe(child));
		}

		return () => observer?.disconnect();
	}, [gridRef, measure, shown]);

	/**
	 * Converts a pointer position to twelfths from the start of the grid.
	 *
	 * @param {number} clientX Pointer position.
	 * @return {number} Position in twelfths.
	 */
	const toPosition = (clientX) => {
		const grid = gridRef.current;
		const box = grid.getBoundingClientRect();
		const fromStart = isRightToLeft(grid)
			? box.right - clientX
			: clientX - box.left;

		return fromPercent((fromStart / box.width) * 100);
	};

	const onPointerDown = (event, edge) => {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		drag.current = { edge, start: units, next: template };
		setActive(edge);
	};

	const onPointerMove = (event) => {
		if (!drag.current) {
			return;
		}

		const next = fromUnits(
			moveEdge(
				drag.current.start,
				drag.current.edge,
				toPosition(event.clientX),
				event.shiftKey
			)
		);

		if (next !== drag.current.next) {
			drag.current.next = next;
			onPreview(next);
		}
	};

	const endDrag = (save) => {
		const finished = drag.current;

		drag.current = null;
		setActive(null);
		onPreview();

		if (save && finished && finished.next !== template) {
			onChange(finished.next);
		}
	};

	const onKeyDown = (event, edge) => {
		const arrow = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

		if (!arrow) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		const step = isRightToLeft(gridRef.current) ? -arrow : arrow;
		const edgeAt = units
			.slice(0, edge + 1)
			.reduce((sum, unit) => sum + unit, 0);

		// With Shift, to the next grid line; otherwise one percent along.
		const position = event.shiftKey
			? (step > 0 ? Math.floor : Math.ceil)(edgeAt + step)
			: edgeAt + fromPercent(step);
		const next = fromUnits(moveEdge(units, edge, position, event.shiftKey));

		if (next !== template) {
			onChange(next);
		}
	};

	return edges.map(({ left, top, width, height }, edge) => {
		const position = units
			.slice(0, edge + 1)
			.reduce((sum, unit) => sum + unit, 0);

		return (
			// A focusable separator is an interactive widget in WAI-ARIA (a
			// "splitter"), which this lint rule doesn't recognize.
			// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
			<div
				key={edge}
				className={[
					"wp-block-codexa-blocks-row__handle",
					active === edge && "is-resizing",
				]
					.filter(Boolean)
					.join(" ")}
				style={{ left, top, width, height }}
				role="separator"
				aria-orientation="vertical"
				aria-label={sprintf(
					/* translators: 1: Number of a column. 2: Number of the next column. */
					__("Width of columns %1$d and %2$d", "codexa-blocks"),
					edge + 1,
					edge + 2
				)}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(toPercent(position))}
				aria-valuetext={pairText(units, edge)}
				tabIndex={focusable ? 0 : -1}
				draggable={false}
				onDragStart={(event) => event.preventDefault()}
				onPointerDown={(event) => onPointerDown(event, edge)}
				onPointerMove={onPointerMove}
				onPointerUp={() => endDrag(true)}
				onPointerCancel={() => endDrag(false)}
				onKeyDown={(event) => onKeyDown(event, edge)}
			>
				<span
					className="wp-block-codexa-blocks-row__handle-grip"
					aria-hidden="true"
				>
					{resizeArrow}
				</span>
				<span
					className="wp-block-codexa-blocks-row__handle-label"
					aria-hidden="true"
				>
					{pairText(units, edge)}
				</span>
			</div>
		);
	});
}
