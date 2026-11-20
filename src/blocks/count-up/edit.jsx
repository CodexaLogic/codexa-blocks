/**
 * Count Up editor, the preview and its settings. The preview builds the
 * same classes and variables as Render\CountUp and shows the final number.
 * The toolbar replays the count. A counter hidden on the previewed device
 * is faded, so it can still be selected.
 */
import {
	AlignmentControl,
	BlockControls,
	ContrastChecker,
	RichText,
	useBlockProps,
} from "@wordpress/block-editor";
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from "@wordpress/components";
import { useEffect, useRef, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

import {
	ColorRow,
	ColorRows,
	DesignControls,
	InspectorTabs,
	LengthControl,
	ResponsiveControl,
	SpacingControl,
	TypographyControl,
	VisibilityControls,
	attributeColor,
	cssColor,
	cssLength,
	designStyles,
	effectiveValue,
	responsiveStyles,
	setDeviceValue,
	typographyStyles,
	useDevice,
} from "@codexa-blocks/editor";

import {
	MAX_DECIMALS,
	MAX_DURATION,
	animateCount,
	formatNumber,
	prefersReducedMotion,
} from "./counter.js";

const TEXT_ALIGN_OPTIONS = [
	{ label: __("Left", "codexa-blocks"), value: "left" },
	{ label: __("Center", "codexa-blocks"), value: "center" },
	{ label: __("Right", "codexa-blocks"), value: "right" },
];

const THOUSANDS_OPTIONS = [
	{ label: __("Comma (1,000)", "codexa-blocks"), value: "," },
	{ label: __("Period (1.000)", "codexa-blocks"), value: "." },
	{ label: __("Space (1 000)", "codexa-blocks"), value: " " },
	{ label: __("None (1000)", "codexa-blocks"), value: "" },
];

const DECIMAL_OPTIONS = [
	{ label: __("Period (1.5)", "codexa-blocks"), value: "." },
	{ label: __("Comma (1,5)", "codexa-blocks"), value: "," },
];

const TITLE_TAG_OPTIONS = [
	{ label: __("Div", "codexa-blocks"), value: "div" },
	{ label: __("Heading 2", "codexa-blocks"), value: "h2" },
	{ label: __("Heading 3", "codexa-blocks"), value: "h3" },
	{ label: __("Heading 4", "codexa-blocks"), value: "h4" },
	{ label: __("Heading 5", "codexa-blocks"), value: "h5" },
	{ label: __("Heading 6", "codexa-blocks"), value: "h6" },
];

const TITLE_POSITION_OPTIONS = [
	{ label: __("Below the number", "codexa-blocks"), value: "below" },
	{ label: __("Above the number", "codexa-blocks"), value: "above" },
];

/**
 * Returns the text alignment when it is one of the offered values.
 * Mirrors the validation in the PHP renderer.
 *
 * @param {string|undefined} value Saved value.
 * @return {string} The value, or "".
 */
const textAlign = (value) =>
	TEXT_ALIGN_OPTIONS.some((option) => option.value === value) ? value : "";

/**
 * Reads a number field, keeping the old value while the field is empty or
 * half-typed (e.g. "-").
 *
 * @param {string} raw      Field text.
 * @param {number} previous Current value.
 * @return {number} The number to save.
 */
const toNumber = (raw, previous) => {
	const value = Number.parseFloat(raw);

	return Number.isFinite(value) ? value : previous;
};

/**
 * Finds the first non-transparent background behind an element, for the
 * contrast check.
 *
 * @param {HTMLElement|null} element Start element.
 * @return {string|undefined} CSS color.
 */
function backgroundBehind(element) {
	for (let node = element; node; node = node.parentElement) {
		const color =
			node.ownerDocument.defaultView.getComputedStyle(
				node
			).backgroundColor;

		if (color && color !== "transparent" && !color.endsWith(", 0)")) {
			return color;
		}
	}

	return undefined;
}

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes }) {
	const color = (name, label) =>
		attributeColor(attributes, setAttributes, name, label);
	const {
		start,
		end,
		decimals,
		prefix,
		suffix,
		thousandsSeparator,
		decimalSeparator,
		duration,
		displayTitle,
		title,
		titleTag,
		titlePosition,
		titleGap,
		numberTypography,
		titleTypography,
		numberColor,
		titleColor,
		padding,
		margin,
	} = attributes;

	const [previewDevice] = useDevice();
	const numberRef = useRef(null);
	const valueRef = useRef(null);
	const cancelRef = useRef(null);
	const [contrast, setContrast] = useState({});

	const finalText = formatNumber(
		end,
		decimals,
		decimalSeparator,
		thousandsSeparator
	);
	const startText = formatNumber(
		start,
		decimals,
		decimalSeparator,
		thousandsSeparator
	);
	// Same as CountUp::chars() in PHP, so the CSS can shrink long numbers.
	const chars =
		prefix.length +
		Math.max(startText.length, finalText.length) +
		suffix.length;

	const styles = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength, ["top", "bottom"])
		.add("text-align", attributes.textAlign, textAlign)
		.add("title-gap", titleGap, cssLength)
		.add("number-color", { desktop: numberColor }, cssColor)
		.add("count-up-title-color", { desktop: titleColor }, cssColor);
	typographyStyles(styles, "number", numberTypography);
	typographyStyles(styles, "title", titleTypography);
	const editorClasses = designStyles(styles, attributes, previewDevice);

	const blockProps = useBlockProps({
		className: [styles.classNames(), ...editorClasses].join(" "),
		style: {
			...styles.style(),
			"--codexa-count-up-chars": Math.max(1, chars),
		},
	});

	// Stop a running replay when the block unmounts or the value changes.
	useEffect(() => () => cancelRef.current?.(), [finalText]);

	// Read the colors the number is really drawn with, for the contrast check.
	useEffect(() => {
		const number = numberRef.current;

		if (!number) {
			return;
		}

		const computed =
			number.ownerDocument.defaultView.getComputedStyle(number);

		const size = Number.parseFloat(computed.fontSize);

		setContrast({
			text: computed.color,
			background: backgroundBehind(number),
			// WCAG large text is 24px, or 18.66px when bold.
			isLarge:
				size >= 24 ||
				(size >= 18.66 &&
					Number.parseInt(computed.fontWeight, 10) >= 700),
		});
	}, [attributes, previewDevice]);

	const replay = () => {
		const element = valueRef.current;

		if (
			!element ||
			prefersReducedMotion(element.ownerDocument.defaultView)
		) {
			return;
		}

		cancelRef.current?.();
		cancelRef.current = animateCount(element, {
			start,
			end,
			decimals,
			decimalSeparator,
			thousandsSeparator,
			duration,
			finalText,
		});
	};

	const titleElement = displayTitle && (
		<RichText
			tagName={titleTag}
			className="wp-block-codexa-blocks-count-up__title"
			value={title}
			onChange={(value) => setAttributes({ title: value })}
			placeholder={__("Add a title", "codexa-blocks")}
			allowedFormats={["core/bold", "core/italic"]}
		/>
	);

	return (
		<>
			<BlockControls>
				<AlignmentControl
					value={effectiveValue(attributes.textAlign, previewDevice)}
					onChange={(value) =>
						setAttributes({
							textAlign: setDeviceValue(
								attributes.textAlign,
								previewDevice,
								value
							),
						})
					}
				/>
				<ToolbarGroup>
					<ToolbarButton onClick={replay}>
						{__("Replay count", "codexa-blocks")}
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>

			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Number", "codexa-blocks")}>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								label={__("Start at", "codexa-blocks")}
								value={String(start)}
								onChange={(raw) =>
									setAttributes({
										start: toNumber(raw, start),
									})
								}
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								label={__("End at", "codexa-blocks")}
								value={String(end)}
								onChange={(raw) =>
									setAttributes({ end: toNumber(raw, end) })
								}
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Prefix", "codexa-blocks")}
								help={__(
									"Shown before the number, e.g. $.",
									"codexa-blocks"
								)}
								value={prefix}
								onChange={(value) =>
									setAttributes({ prefix: value })
								}
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Suffix", "codexa-blocks")}
								help={__(
									"Shown after the number, e.g. + or %.",
									"codexa-blocks"
								)}
								value={suffix}
								onChange={(value) =>
									setAttributes({ suffix: value })
								}
							/>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Decimal places", "codexa-blocks")}
								min={0}
								max={MAX_DECIMALS}
								value={decimals}
								onChange={(value) =>
									setAttributes({ decimals: value ?? 0 })
								}
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__(
									"Thousands separator",
									"codexa-blocks"
								)}
								value={thousandsSeparator}
								options={THOUSANDS_OPTIONS}
								onChange={(value) =>
									setAttributes({ thousandsSeparator: value })
								}
							/>
							{decimals > 0 && (
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__(
										"Decimal separator",
										"codexa-blocks"
									)}
									value={decimalSeparator}
									options={DECIMAL_OPTIONS}
									onChange={(value) =>
										setAttributes({
											decimalSeparator: value,
										})
									}
								/>
							)}
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__(
									"Duration (seconds)",
									"codexa-blocks"
								)}
								help={__(
									"Five seconds at most, so the motion stops on its own. Visitors who ask for reduced motion see the final number straight away.",
									"codexa-blocks"
								)}
								min={0.5}
								max={MAX_DURATION}
								step={0.1}
								value={duration}
								onChange={(value) =>
									setAttributes({ duration: value ?? 2.5 })
								}
							/>
						</PanelBody>

						<PanelBody
							title={__("Title", "codexa-blocks")}
							initialOpen={false}
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label={__("Show title", "codexa-blocks")}
								checked={displayTitle}
								onChange={(value) =>
									setAttributes({ displayTitle: value })
								}
							/>
							{displayTitle && (
								<>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__("Title tag", "codexa-blocks")}
										value={titleTag}
										options={TITLE_TAG_OPTIONS}
										onChange={(value) =>
											setAttributes({ titleTag: value })
										}
									/>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__(
											"Title position",
											"codexa-blocks"
										)}
										value={titlePosition}
										options={TITLE_POSITION_OPTIONS}
										onChange={(value) =>
											setAttributes({
												titlePosition: value,
											})
										}
									/>
								</>
							)}
						</PanelBody>

						<PanelBody
							title={__("Layout", "codexa-blocks")}
							initialOpen={false}
						>
							<ResponsiveControl
								label={__("Alignment", "codexa-blocks")}
								value={attributes.textAlign}
								onChange={(next) =>
									setAttributes({ textAlign: next })
								}
							>
								{({ label, value, inherited, onChange }) => (
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={label}
										hideLabelFromVision
										value={value ?? inherited ?? ""}
										options={[
											{
												label: __(
													"Default",
													"codexa-blocks"
												),
												value: "",
											},
											...TEXT_ALIGN_OPTIONS,
										]}
										onChange={onChange}
									/>
								)}
							</ResponsiveControl>
						</PanelBody>

						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
							{displayTitle && (
								<LengthControl
									label={__(
										"Space between number and title",
										"codexa-blocks"
									)}
									value={titleGap}
									onChange={(next) =>
										setAttributes({ titleGap: next })
									}
								/>
							)}
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
						<PanelBody title={__("Number", "codexa-blocks")}>
							<ColorRows>
								<ColorRow
									label={__("Text", "codexa-blocks")}
									colors={[
										color(
											"numberColor",
											__("Number color", "codexa-blocks")
										),
									]}
								/>
							</ColorRows>
							<ContrastChecker
								textColor={contrast.text}
								backgroundColor={contrast.background}
								isLargeText={contrast.isLarge}
							/>
							<TypographyControl
								value={numberTypography}
								onChange={(next) =>
									setAttributes({ numberTypography: next })
								}
							/>
						</PanelBody>
						{displayTitle && (
							<PanelBody
								title={__("Title", "codexa-blocks")}
								initialOpen={false}
							>
								<ColorRows>
									<ColorRow
										label={__("Text", "codexa-blocks")}
										colors={[
											color(
												"titleColor",
												__(
													"Title color",
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
							</PanelBody>
						)}
						<DesignControls
							attributes={attributes}
							setAttributes={setAttributes}
							withColors={false}
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

			<div {...blockProps}>
				{titlePosition === "above" && titleElement}
				<div
					className="wp-block-codexa-blocks-count-up__number"
					ref={numberRef}
				>
					{prefix && (
						<span className="wp-block-codexa-blocks-count-up__prefix">
							{prefix}
						</span>
					)}
					<span
						className="wp-block-codexa-blocks-count-up__value"
						ref={valueRef}
					>
						{finalText}
					</span>
					{suffix && (
						<span className="wp-block-codexa-blocks-count-up__suffix">
							{suffix}
						</span>
					)}
				</div>
				{titlePosition === "below" && titleElement}
			</div>
		</>
	);
}
