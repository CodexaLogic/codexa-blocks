/**
 * Accordion editor, with the items, the add button and the settings. The
 * preview builds the same classes and variables as Render\Accordion. Each
 * item opens and closes on its own (see accordion-item/edit.jsx).
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from "@wordpress/block-editor";
import { createBlock } from "@wordpress/blocks";
import {
	Button,
	PanelBody,
	SelectControl,
	ToggleControl,
} from "@wordpress/components";
import { useDispatch, useSelect } from "@wordpress/data";
import { __ } from "@wordpress/i18n";
import { plus } from "@wordpress/icons";

import {
	ColorRow,
	ColorRows,
	DesignControls,
	InspectorTabs,
	LengthControl,
	RadiusControl,
	SpacingControl,
	TypographyControl,
	VisibilityControls,
	attributeColor,
	cssLength,
	designStyles,
	responsiveStyles,
	useDevice,
} from "@codexa-blocks/editor";

import {
	ICONS,
	ICON_POSITIONS,
	TITLE_TAGS,
	itemStyles,
} from "./item-styles.js";

const ITEM = "codexa-blocks/accordion-item";

const ICON_LABELS = {
	chevron: __("Chevron", "codexa-blocks"),
	plus: __("Plus / Minus", "codexa-blocks"),
	none: __("None", "codexa-blocks"),
};

const TITLE_TAG_OPTIONS = TITLE_TAGS.map((tag) => ({
	label: tag === "span" ? __("Plain text", "codexa-blocks") : `<${tag}>`,
	value: tag,
}));

const POSITION_LABELS = {
	end: __("After the title", "codexa-blocks"),
	start: __("Before the title", "codexa-blocks"),
};

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @param {string}                       props.clientId      This block's editor ID.
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes, clientId }) {
	const color = (name, label) =>
		attributeColor(attributes, setAttributes, name, label);
	const {
		onlyOneOpen,
		icon,
		iconPosition,
		titleTag,
		titleBorderWidth,
		titleBorderRadius,
		titlePadding,
		titleTypography,
		contentBorderWidth,
		contentBorderRadius,
		contentPadding,
		itemGap,
		padding,
		margin,
	} = attributes;
	const [previewDevice] = useDevice();
	// Read when needed rather than subscribed, since the items only matter
	// when the switch below is on.
	const { getBlocks } = useSelect(blockEditorStore);
	const { insertBlock, updateBlockAttributes } =
		useDispatch(blockEditorStore);

	const styles = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength, ["top", "bottom"]);
	const iconClasses = itemStyles(styles, attributes);
	const editorClasses = designStyles(styles, attributes, previewDevice);

	const blockProps = useBlockProps({
		className: [styles.classNames(), ...iconClasses, ...editorClasses].join(
			" "
		),
		style: styles.style(),
	});

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		allowedBlocks: [ITEM],
		template: [[ITEM], [ITEM]],
		renderAppender: () => (
			<Button
				variant="secondary"
				icon={plus}
				className="wp-block-codexa-blocks-accordion__add"
				onClick={() =>
					insertBlock(createBlock(ITEM), undefined, clientId)
				}
			>
				{__("Add item", "codexa-blocks")}
			</Button>
		),
	});

	/**
	 * Turns "Only one open at a time" on or off. Turning it on keeps the
	 * first item that is set to open on load, and turns the others off, so
	 * the saved settings match what the page will do.
	 *
	 * @param {boolean} checked The switch's new state.
	 */
	const setOnlyOneOpen = (checked) => {
		setAttributes({ onlyOneOpen: checked });

		if (checked) {
			getBlocks(clientId)
				.filter((item) => item.attributes.isOpen)
				.slice(1)
				.forEach((item) =>
					updateBlockAttributes(item.clientId, { isOpen: false })
				);
		}
	};

	return (
		<>
			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Accordion", "codexa-blocks")}>
							<ToggleControl
								__nextHasNoMarginBottom
								label={__(
									"Only one open at a time",
									"codexa-blocks"
								)}
								help={__(
									"Opening an item closes the one that is open. Choose which item starts open in that item's settings.",
									"codexa-blocks"
								)}
								checked={onlyOneOpen}
								onChange={setOnlyOneOpen}
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Title tag", "codexa-blocks")}
								help={__(
									"A heading puts the titles in the page outline. They look the same either way.",
									"codexa-blocks"
								)}
								value={titleTag}
								options={TITLE_TAG_OPTIONS}
								onChange={(next) =>
									setAttributes({ titleTag: next })
								}
							/>
						</PanelBody>

						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
							<LengthControl
								label={__(
									"Space between items",
									"codexa-blocks"
								)}
								value={itemGap}
								onChange={(next) =>
									setAttributes({ itemGap: next })
								}
							/>
							<SpacingControl
								label={__("Padding", "codexa-blocks")}
								value={padding}
								onChange={(next) =>
									setAttributes({ padding: next })
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
				style={
					<>
						<PanelBody title={__("Titles", "codexa-blocks")}>
							<ColorRows
								states={[
									__("Normal", "codexa-blocks"),
									__("Hover", "codexa-blocks"),
									__("Open", "codexa-blocks"),
								]}
							>
								<ColorRow
									label={__("Text", "codexa-blocks")}
									colors={[
										color(
											"titleColor",
											__("Title text", "codexa-blocks")
										),
										color(
											"titleHoverColor",
											__(
												"Hover title text",
												"codexa-blocks"
											)
										),
										color(
											"titleOpenColor",
											__(
												"Open title text",
												"codexa-blocks"
											)
										),
									]}
								/>
								<ColorRow
									label={__("Background", "codexa-blocks")}
									colors={[
										color(
											"titleBackground",
											__(
												"Title background",
												"codexa-blocks"
											)
										),
										color(
											"titleHoverBackground",
											__(
												"Hover title background",
												"codexa-blocks"
											)
										),
										color(
											"titleOpenBackground",
											__(
												"Open title background",
												"codexa-blocks"
											)
										),
									]}
								/>
								<ColorRow
									label={__("Border", "codexa-blocks")}
									colors={[
										color(
											"titleBorderColor",
											__("Title border", "codexa-blocks")
										),
										color(
											"titleHoverBorderColor",
											__(
												"Hover title border",
												"codexa-blocks"
											)
										),
										color(
											"titleOpenBorderColor",
											__(
												"Open title border",
												"codexa-blocks"
											)
										),
									]}
								/>
							</ColorRows>
							<TypographyControl
								value={titleTypography}
								onChange={(next) =>
									setAttributes({ titleTypography: next })
								}
							/>
							<SpacingControl
								label={__("Border width", "codexa-blocks")}
								value={titleBorderWidth}
								withPresets={false}
								onChange={(next) =>
									setAttributes({ titleBorderWidth: next })
								}
							/>
							<RadiusControl
								label={__("Border radius", "codexa-blocks")}
								value={titleBorderRadius}
								onChange={(next) =>
									setAttributes({ titleBorderRadius: next })
								}
							/>
							<SpacingControl
								label={__("Padding", "codexa-blocks")}
								value={titlePadding}
								onChange={(next) =>
									setAttributes({ titlePadding: next })
								}
							/>
						</PanelBody>
						<PanelBody
							title={__("Icon", "codexa-blocks")}
							initialOpen={false}
						>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Type", "codexa-blocks")}
								value={icon}
								options={ICONS.map((value) => ({
									label: ICON_LABELS[value],
									value,
								}))}
								onChange={(next) =>
									setAttributes({ icon: next })
								}
							/>
							{icon !== "none" && (
								<>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__("Position", "codexa-blocks")}
										value={iconPosition}
										options={ICON_POSITIONS.map(
											(value) => ({
												label: POSITION_LABELS[value],
												value,
											})
										)}
										onChange={(next) =>
											setAttributes({
												iconPosition: next,
											})
										}
									/>
									<ColorRows>
										<ColorRow
											label={__("Color", "codexa-blocks")}
											colors={[
												color(
													"iconColor",
													__(
														"Icon color",
														"codexa-blocks"
													)
												),
											]}
										/>
									</ColorRows>
								</>
							)}
						</PanelBody>
						<PanelBody title={__("Content", "codexa-blocks")}>
							<ColorRows>
								<ColorRow
									label={__("Text", "codexa-blocks")}
									colors={[
										color(
											"contentColor",
											__("Content text", "codexa-blocks")
										),
									]}
								/>
								<ColorRow
									label={__("Link", "codexa-blocks")}
									colors={[
										color(
											"contentLinkColor",
											__("Content link", "codexa-blocks")
										),
										color(
											"contentLinkHoverColor",
											__(
												"Content link hover",
												"codexa-blocks"
											)
										),
									]}
								/>
								<ColorRow
									label={__("Background", "codexa-blocks")}
									colors={[
										color(
											"contentBackground",
											__(
												"Content background",
												"codexa-blocks"
											)
										),
									]}
								/>
								<ColorRow
									label={__("Border", "codexa-blocks")}
									colors={[
										color(
											"contentBorderColor",
											__(
												"Content border",
												"codexa-blocks"
											)
										),
									]}
								/>
							</ColorRows>
							<SpacingControl
								label={__("Border width", "codexa-blocks")}
								value={contentBorderWidth}
								withPresets={false}
								onChange={(next) =>
									setAttributes({ contentBorderWidth: next })
								}
							/>
							<RadiusControl
								label={__("Border radius", "codexa-blocks")}
								parts={["bottom-right", "bottom-left"]}
								value={contentBorderRadius}
								onChange={(next) =>
									setAttributes({
										contentBorderRadius: next,
									})
								}
							/>
							<SpacingControl
								label={__("Padding", "codexa-blocks")}
								value={contentPadding}
								onChange={(next) =>
									setAttributes({ contentPadding: next })
								}
							/>
						</PanelBody>
						<DesignControls
							attributes={attributes}
							setAttributes={setAttributes}
							withColors={false}
							withBackgroundColor={false}
						/>
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
