/**
 * Buttons editor, with the buttons side by side and their alignment. The
 * preview builds the same classes and variables as Render\Buttons. The
 * wrapper is also the row the buttons sit in, as on the page.
 */
import {
	BlockControls,
	JustifyContentControl,
	useBlockProps,
	useInnerBlocksProps,
} from "@wordpress/block-editor";
import { PanelBody, SelectControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import {
	InspectorTabs,
	LengthControl,
	ResponsiveControl,
	SpacingControl,
	VisibilityControls,
	cssLength,
	effectiveValue,
	fromJustifyToolbar,
	hiddenInEditor,
	responsiveStyles,
	setDeviceValue,
	toJustifyToolbar,
	useDevice,
} from "@codexa-blocks/editor";

import { ALIGNMENTS, LAYOUTS, buttonsStyles } from "./buttons-styles.js";

const BUTTON = "codexa-blocks/button";

// Named left and right, like the toolbar; saved as start and end.
const ALIGN_LABELS = {
	start: __("Left", "codexa-blocks"),
	center: __("Center", "codexa-blocks"),
	end: __("Right", "codexa-blocks"),
	"space-between": __("Space between", "codexa-blocks"),
};

const LAYOUT_LABELS = {
	row: __("Side by side", "codexa-blocks"),
	stack: __("One per line", "codexa-blocks"),
};

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes }) {
	const { buttonAlign, buttonLayout, buttonGap, margin } = attributes;
	const [device] = useDevice();

	const styles = responsiveStyles().box("margin", margin, cssLength, [
		"top",
		"bottom",
	]);
	buttonsStyles(styles, attributes);

	const blockProps = useBlockProps({
		className: [styles.classNames(), ...hiddenInEditor(attributes, device)]
			.filter(Boolean)
			.join(" "),
		style: styles.style(),
	});
	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		allowedBlocks: [BUTTON],
		template: [[BUTTON]],
		// Where the drop indicator goes when a button is dragged.
		orientation:
			effectiveValue(buttonLayout, device) === "stack"
				? "vertical"
				: "horizontal",
	});

	const shownAlign = effectiveValue(buttonAlign, device) ?? "start";

	return (
		<>
			<BlockControls group="block">
				<JustifyContentControl
					allowedControls={[
						"left",
						"center",
						"right",
						"space-between",
					]}
					value={toJustifyToolbar(shownAlign)}
					onChange={(next) =>
						setAttributes({
							buttonAlign: setDeviceValue(
								buttonAlign,
								device,
								fromJustifyToolbar(next)
							),
						})
					}
				/>
			</BlockControls>

			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Layout", "codexa-blocks")}>
							<ResponsiveControl
								label={__("Arrangement", "codexa-blocks")}
								value={buttonLayout}
								onChange={(next) =>
									setAttributes({ buttonLayout: next })
								}
							>
								{({ label, value, inherited, onChange }) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={label}
										hideLabelFromVision
										value={value ?? inherited ?? "row"}
										options={LAYOUTS.map((option) => ({
											label: LAYOUT_LABELS[option],
											value: option,
										}))}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>
							<ResponsiveControl
								label={__("Alignment", "codexa-blocks")}
								value={buttonAlign}
								onChange={(next) =>
									setAttributes({ buttonAlign: next })
								}
							>
								{({ label, value, inherited, onChange }) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={label}
										hideLabelFromVision
										value={value ?? inherited ?? "start"}
										options={ALIGNMENTS.map((option) => ({
											label: ALIGN_LABELS[option],
											value: option,
										}))}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>
						</PanelBody>
						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
							<LengthControl
								label={__(
									"Space between buttons",
									"codexa-blocks"
								)}
								value={buttonGap}
								onChange={(next) =>
									setAttributes({ buttonGap: next })
								}
							/>
							<SpacingControl
								label={__("Margin", "codexa-blocks")}
								units="margin"
								value={margin}
								sides={["top", "bottom"]}
								onChange={(next) =>
									setAttributes({ margin: next })
								}
							/>
						</PanelBody>
					</>
				}
				advanced={
					<VisibilityControls
						attributes={attributes}
						setAttributes={setAttributes}
					/>
				}
			/>
			<div {...innerBlocksProps} />
		</>
	);
}
