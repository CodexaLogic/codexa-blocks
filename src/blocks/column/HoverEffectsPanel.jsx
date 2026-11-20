/**
 * The Column's Hover effects panel (Styles tab), with a switch for each
 * effect and its settings once on. Saved as hoverEffects (e.g. ["overlay",
 * "zoom"]) with hoverOverlayColor, hoverOverlayOpacity and
 * hoverBorderColor, read by columnStyles() and Column::render().
 */
import {
	CheckboxControl,
	PanelBody,
	RangeControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import { ColorRow, ColorRows, attributeColor } from "@codexa-blocks/editor";

import {
	HOVER_EFFECTS,
	HOVER_OVERLAY_OPACITY,
	hoverEffects,
} from "./column-styles.js";

const LABELS = {
	overlay: __("Overlay color", "codexa-blocks"),
	zoom: __("Zoom the background image", "codexa-blocks"),
	border: __("Border color", "codexa-blocks"),
};

/**
 * @param {Object}                       props               Component props.
 * @param {Object}                       props.attributes    The Column's attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @return {Element} The panel.
 */
export function HoverEffectsPanel({ attributes, setAttributes }) {
	const effects = hoverEffects(attributes.hoverEffects);
	const color = (name, label) =>
		attributeColor(attributes, setAttributes, name, label);

	/**
	 * Switches one effect on or off, keeping the list in its usual order.
	 *
	 * @param {string}  effect  e.g. "zoom".
	 * @param {boolean} checked Whether it's now on.
	 */
	const setEffect = (effect, checked) =>
		setAttributes({
			hoverEffects: hoverEffects(
				checked
					? [...effects, effect]
					: effects.filter((item) => item !== effect)
			),
		});

	// Each effect's own settings, shown under its switch while it's on.
	const settings = {
		overlay: (
			<>
				<ColorRows>
					<ColorRow
						label={__("Overlay", "codexa-blocks")}
						colors={[
							color(
								"hoverOverlayColor",
								__("Hover overlay", "codexa-blocks")
							),
						]}
					/>
				</ColorRows>
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={__("Hover overlay opacity (%)", "codexa-blocks")}
					help={__(
						"Without a color, the overlay is black, or the column's own overlay color.",
						"codexa-blocks"
					)}
					min={0}
					max={100}
					value={
						attributes.hoverOverlayOpacity ?? HOVER_OVERLAY_OPACITY
					}
					onChange={(next) =>
						setAttributes({
							hoverOverlayOpacity: next ?? HOVER_OVERLAY_OPACITY,
						})
					}
				/>
			</>
		),
		zoom: !attributes.backgroundImage && (
			<p className="codexa-panel-description">
				{__(
					"Add a background image in Background to see this.",
					"codexa-blocks"
				)}
			</p>
		),
		border: (
			<>
				<ColorRows>
					<ColorRow
						label={__("Border", "codexa-blocks")}
						colors={[
							color(
								"hoverBorderColor",
								__("Hover border", "codexa-blocks")
							),
						]}
					/>
				</ColorRows>
				<p className="codexa-panel-description">
					{__(
						"Shown on sides with a border width (Border).",
						"codexa-blocks"
					)}
				</p>
			</>
		),
	};

	return (
		<PanelBody
			title={__("Hover effects", "codexa-blocks")}
			initialOpen={effects.length > 0}
		>
			<p className="codexa-panel-description">
				{__(
					"Shown when the pointer is over the column, or the keyboard reaches its link. Choose any combination.",
					"codexa-blocks"
				)}
			</p>
			{HOVER_EFFECTS.map((effect) => (
				<div key={effect} className="codexa-hover-effect">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={LABELS[effect]}
						checked={effects.includes(effect)}
						onChange={(checked) => setEffect(effect, checked)}
					/>
					{effects.includes(effect) && settings[effect]}
				</div>
			))}
		</PanelBody>
	);
}
