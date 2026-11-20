/**
 * Icon List Item editor, with the text typed in place and the item's own
 * icon, icon meaning and link.
 *
 * The preview builds the same classes as Render\IconListItem. The icon is
 * the item's own or the list's (block context). Enter starts a new item and
 * Backspace at the start joins it to the one before, as in core lists.
 *
 * Words in the text can be links (Ctrl+K). When the whole item is a link
 * (Link panel), the text's own links are turned off, since links can't nest.
 */
import { RichText, useBlockProps } from "@wordpress/block-editor";
import {
	Notice,
	PanelBody,
	TextControl,
	ToggleControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import {
	ColorRow,
	ColorRows,
	IconPicker,
	IconSvg,
	InspectorTabs,
	LinkControls,
	VisibilityControls,
	attributeColor,
	cssColor,
	hasLink,
	hiddenInEditor,
	parseIcon,
	responsiveStyles,
	useDevice,
} from "@codexa-blocks/editor";

/** The context the list gives its items, its icon. */
const ICON_CONTEXT = "codexa-blocks/iconListIcon";

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @param {Object}                       props.context       Block context, the list's icon.
 * @param {(forward: boolean) => void}   props.mergeBlocks   Joins this item to the one before or after.
 * @param {(forward: boolean) => void}   props.onRemove      Removes this item.
 * @return {Element} The editor view.
 */
export function Edit({
	attributes,
	setAttributes,
	context,
	mergeBlocks,
	onRemove,
}) {
	const { text, icon, iconLabel } = attributes;
	const isLinked = hasLink(attributes);
	const hasOwnIcon = icon !== "";
	const shownIcon = hasOwnIcon ? icon : context[ICON_CONTEXT];
	const [previewDevice] = useDevice();

	const styles = responsiveStyles().add(
		"icon-list-item-icon-color",
		{ desktop: attributes.iconColor },
		cssColor
	);
	const blockProps = useBlockProps({
		className: [
			styles.classNames(),
			!parseIcon(shownIcon) && "has-no-icon",
			...hiddenInEditor(attributes, previewDevice),
		]
			.filter(Boolean)
			.join(" "),
		style: styles.style(),
	});

	return (
		<>
			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Link", "codexa-blocks")}>
							<LinkControls
								attributes={attributes}
								setAttributes={setAttributes}
								unpublishedNotice={__(
									"The linked post isn't published, so the item shows without its link on the page.",
									"codexa-blocks"
								)}
							/>
							<Notice status="info" isDismissible={false}>
								{isLinked
									? __(
											"The whole item is a link, so links inside its text are removed.",
											"codexa-blocks"
										)
									: __(
											"Makes the whole item a link. To link a few words instead, select them and use the toolbar's Link button.",
											"codexa-blocks"
										)}
							</Notice>
						</PanelBody>

						<PanelBody title={__("Icon", "codexa-blocks")}>
							<ToggleControl
								__nextHasNoMarginBottom
								label={__("Its own icon", "codexa-blocks")}
								help={__(
									"Off: the list's icon.",
									"codexa-blocks"
								)}
								checked={hasOwnIcon}
								onChange={(next) =>
									setAttributes({
										icon: next
											? (context[ICON_CONTEXT] ?? "none")
											: "",
									})
								}
							/>
							{hasOwnIcon && (
								<IconPicker
									label={__("Icon", "codexa-blocks")}
									value={icon}
									onChange={(next) =>
										setAttributes({ icon: next })
									}
								/>
							)}
							{parseIcon(shownIcon) && (
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Icon meaning", "codexa-blocks")}
									help={__(
										"Only when the icon says something the text doesn't, such as Included or Not included. Screen readers read it before the text.",
										"codexa-blocks"
									)}
									value={iconLabel}
									onChange={(next) =>
										setAttributes({ iconLabel: next })
									}
								/>
							)}
						</PanelBody>
					</>
				}
				style={
					parseIcon(shownIcon) && (
						<PanelBody title={__("Colors", "codexa-blocks")}>
							<ColorRows>
								<ColorRow
									label={__("Icon", "codexa-blocks")}
									colors={[
										attributeColor(
											attributes,
											setAttributes,
											"iconColor",
											__("Icon", "codexa-blocks")
										),
									]}
								/>
							</ColorRows>
						</PanelBody>
					)
				}
				advanced={
					<VisibilityControls
						attributes={attributes}
						setAttributes={setAttributes}
					/>
				}
			/>

			<li {...blockProps}>
				<IconSvg
					value={shownIcon}
					className="wp-block-codexa-blocks-icon-list-item__icon"
				/>
				<RichText
					identifier="text"
					tagName="span"
					className="wp-block-codexa-blocks-icon-list-item__text"
					aria-label={__("List item text", "codexa-blocks")}
					placeholder={__("Add text…", "codexa-blocks")}
					allowedFormats={
						isLinked
							? ["core/bold", "core/italic"]
							: ["core/bold", "core/italic", "core/link"]
					}
					withoutInteractiveFormatting={isLinked}
					disableLineBreaks
					value={text}
					onChange={(next) => setAttributes({ text: next })}
					onMerge={mergeBlocks}
					onRemove={onRemove}
				/>
			</li>
		</>
	);
}
