/**
 * The Dividers panel, a shape along the block's top and bottom edges.
 *
 * Each edge shows its shapes as picture buttons, None first. A chosen shape
 * adds color, height per device, stretch, flip, invert (when the shape has
 * an inverted form) and in front of the content. Saved as topDivider and
 * bottomDivider (Dividers.php). None removes the attribute.
 */
import {
	BaseControl,
	Button,
	PanelBody,
	RangeControl,
	ToggleControl,
} from "@wordpress/components";
import { __, sprintf } from "@wordpress/i18n";

import {
	DIVIDER_EDGES,
	DIVIDER_STRETCH,
	DIVIDER_VIEW_BOX,
	dividerStretch,
	getDividerShapes,
} from "../utilities/dividers.js";
import { ColorRow, ColorRows } from "./ColorRows.jsx";
import { DividerSettingsSlot } from "./DividerSettings.jsx";
import { LengthControl } from "./LengthControl.jsx";
import { ProNote } from "./ProNote.jsx";

/** Each edge's name in the panel. */
const EDGE_LABELS = {
	top: __("Top", "codexa-blocks"),
	bottom: __("Bottom", "codexa-blocks"),
};

/**
 * The shape buttons for one edge.
 *
 * @param {Object}                           props          Component props.
 * @param {string}                           props.label    The edge's name, e.g. "Top".
 * @param {string}                           props.edge     "top" or "bottom".
 * @param {string|undefined}                 props.value    The chosen shape's slug.
 * @param {Array<Object>}                    props.shapes   From getDividerShapes().
 * @param {(slug: string|undefined) => void} props.onChange Receives the slug, or undefined for None.
 * @return {Element} The buttons.
 */
function ShapePicker({ label, edge, value, shapes, onChange }) {
	const chosen = shapes.find(({ slug }) => slug === value);

	return (
		<fieldset className="codexa-divider-control__shapes">
			<BaseControl.VisualLabel as="legend">
				{label}
			</BaseControl.VisualLabel>
			<div className="codexa-divider-control__choices">
				<Button
					className="codexa-divider-control__choice is-none"
					label={__("None", "codexa-blocks")}
					showTooltip
					isPressed={!chosen}
					onClick={() => onChange(undefined)}
				>
					<span
						className="codexa-divider-control__none"
						aria-hidden="true"
					/>
				</Button>
				{shapes.map((shape) => (
					<Button
						key={shape.slug}
						className="codexa-divider-control__choice"
						label={shape.name}
						showTooltip
						isPressed={shape.slug === chosen?.slug}
						onClick={() => onChange(shape.slug)}
					>
						<svg
							className={`codexa-divider-control__shape is-${edge}`}
							viewBox={DIVIDER_VIEW_BOX}
							preserveAspectRatio="none"
							aria-hidden="true"
							focusable="false"
						>
							<path d={shape.path} />
						</svg>
					</Button>
				))}
			</div>
			<p className="codexa-divider-control__chosen" aria-hidden="true">
				{chosen?.name ?? __("None", "codexa-blocks")}
			</p>
		</fieldset>
	);
}

/**
 * One edge's divider, its shape and then its settings once it has one.
 *
 * @param {Object}                              props          Component props.
 * @param {string}                              props.edge     "top" or "bottom".
 * @param {Object|undefined}                    props.value    The saved divider.
 * @param {Array<Object>}                       props.shapes   From getDividerShapes().
 * @param {(divider: Object|undefined) => void} props.onChange Receives the divider to save, or undefined to remove it.
 * @return {Element} The settings.
 */
function DividerFields({ edge, value, shapes, onChange }) {
	const label = EDGE_LABELS[edge];
	const shape = shapes.find(({ slug }) => slug === value?.shape);

	/**
	 * Saves the divider with one setting changed. A setting back at its
	 * default is dropped.
	 *
	 * @param {string}                                 key  The setting.
	 * @param {string|number|boolean|Object|undefined} next Its value.
	 */
	const set = (key, next) => {
		const divider = { ...value, [key]: next };

		if (next === undefined || next === false) {
			delete divider[key];
		}

		onChange(divider);
	};

	return (
		<div className="codexa-divider-control">
			<ShapePicker
				label={label}
				edge={edge}
				value={shape?.slug}
				shapes={shapes}
				onChange={(slug) =>
					// Choosing another shape keeps the other settings.
					onChange(slug ? { ...value, shape: slug } : undefined)
				}
			/>

			{shape && (
				<>
					<ColorRows>
						<ColorRow
							label={__("Color", "codexa-blocks")}
							colors={[
								{
									label: sprintf(
										/* translators: %s: An edge, "Top" or "Bottom". */
										__("%s divider color", "codexa-blocks"),
										label
									),
									value: value.color,
									onChange: (next) => set("color", next),
									inherited: "#ffffff",
									inheritedName: __(
										"white, the default",
										"codexa-blocks"
									),
								},
							]}
						/>
					</ColorRows>
					<LengthControl
						label={__("Height", "codexa-blocks")}
						presets={false}
						units="height"
						help={__(
							"Without one, it grows with the screen, from 3rem to 6rem.",
							"codexa-blocks"
						)}
						value={value.height}
						onChange={(next) => set("height", next)}
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={__("Stretch (%)", "codexa-blocks")}
						help={__(
							"Wider than the block makes the shape gentler. The middle part shows.",
							"codexa-blocks"
						)}
						min={DIVIDER_STRETCH.min}
						max={DIVIDER_STRETCH.max}
						step={10}
						value={dividerStretch(value.stretch)}
						onChange={(next) =>
							set(
								"stretch",
								next === undefined ||
									dividerStretch(next) === DIVIDER_STRETCH.min
									? undefined
									: dividerStretch(next)
							)
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Flip horizontally", "codexa-blocks")}
						checked={Boolean(value.flip)}
						onChange={(next) => set("flip", next)}
					/>
					{shape.inverted && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={__("Invert", "codexa-blocks")}
							help={__(
								"The shape the other way around, a dip instead of a rise.",
								"codexa-blocks"
							)}
							checked={Boolean(value.invert)}
							onChange={(next) => set("invert", next)}
						/>
					)}
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("In front of the content", "codexa-blocks")}
						help={__(
							"Drawn over the columns instead of behind them.",
							"codexa-blocks"
						)}
						checked={Boolean(value.front)}
						onChange={(next) => set("front", next)}
					/>
				</>
			)}
		</div>
	);
}

/**
 * @param {Object}                       props               Component props.
 * @param {string}                       props.name          The block's name, for add-ons.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @return {Element} The panel.
 */
export function DividerControls({ name, attributes, setAttributes }) {
	const shapes = getDividerShapes();
	const dividers = DIVIDER_EDGES.map(({ edge, attribute }) => ({
		label: EDGE_LABELS[edge],
		edge,
		value: attributes[attribute],
		onChange: (next) => setAttributes({ [attribute]: next }),
	}));

	return (
		<PanelBody title={__("Dividers", "codexa-blocks")} initialOpen={false}>
			{dividers.map(({ edge, value, onChange }) => (
				<DividerFields
					key={edge}
					edge={edge}
					value={value}
					shapes={shapes}
					onChange={onChange}
				/>
			))}
			<DividerSettingsSlot fillProps={{ name, dividers }}>
				{(fills) =>
					fills.length ? (
						fills
					) : (
						<ProNote
							description={__(
								"More shapes, and a gentle drift animation.",
								"codexa-blocks"
							)}
						/>
					)
				}
			</DividerSettingsSlot>
		</PanelBody>
	);
}
