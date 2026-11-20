/**
 * Accordion Item editor, with the title, the content and the open setting.
 *
 * Uses the PHP renderer's classes (AccordionItem) on <div>s instead of
 * <details> and <summary>, so the title can be typed into. .is-open stands
 * in for [open].
 *
 * Open and closed is editor state, not saved. The item starts open when set
 * to open on page load, and opens when anything in it is selected. Clicking
 * the title row outside its text, or the toolbar button, toggles it.
 */
import {
	BlockControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from "@wordpress/block-editor";
import { PanelBody, ToggleControl, ToolbarButton } from "@wordpress/components";
import { useDispatch, useSelect } from "@wordpress/data";
import { useRef, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { chevronDown, chevronUp } from "@wordpress/icons";

import {
	InspectorTabs,
	VisibilityControls,
	hiddenInEditor,
	useDevice,
} from "@codexa-blocks/editor";
import { TITLE_TAGS } from "../accordion/item-styles.js";

const CLASS = "wp-block-codexa-blocks-accordion-item";

/**
 * @param {Object}                       props               Block edit props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Updates attributes.
 * @param {string}                       props.clientId      This block's editor ID.
 * @param {Object}                       props.context       Context from the Accordion (onlyOneOpen and titleTag).
 * @return {Element} The editor view.
 */
export function Edit({ attributes, setAttributes, clientId, context }) {
	const { title, isOpen } = attributes;
	const onlyOneOpen = Boolean(context["codexa-blocks/onlyOneOpen"]);
	const titleTag = TITLE_TAGS.includes(context["codexa-blocks/titleTag"])
		? context["codexa-blocks/titleTag"]
		: "span";

	const hasChildSelected = useSelect(
		(select) =>
			select(blockEditorStore).hasSelectedInnerBlock(clientId, true),
		[clientId]
	);
	// Read when needed rather than subscribed, since the other items only
	// matter when this one is set to open.
	const { getBlocks, getBlockRootClientId } = useSelect(blockEditorStore);
	const { updateBlockAttributes } = useDispatch(blockEditorStore);

	const [isExpanded, setIsExpanded] = useState(isOpen);
	const [previewDevice] = useDevice();

	// Something inside was selected, so open it to be seen and edited.
	if (hasChildSelected && !isExpanded) {
		setIsExpanded(true);
	}

	const blockProps = useBlockProps({
		className:
			[
				isExpanded && "is-open",
				...hiddenInEditor(attributes, previewDevice),
			]
				.filter(Boolean)
				.join(" ") || undefined,
	});
	const innerBlocksProps = useInnerBlocksProps(
		{ className: `${CLASS}__content` },
		{ template: [["core/paragraph"]] }
	);

	/**
	 * Sets whether the item starts open. With "Only one open at a time" on
	 * the Accordion, opening this item turns the setting off on the others.
	 *
	 * @param {boolean} checked The switch's new state.
	 */
	const setOpen = (checked) => {
		setAttributes({ isOpen: checked });

		if (checked) {
			setIsExpanded(true);
		}

		if (checked && onlyOneOpen) {
			getBlocks(getBlockRootClientId(clientId))
				.filter(
					(item) =>
						item.clientId !== clientId && item.attributes.isOpen
				)
				.forEach((item) =>
					updateBlockAttributes(item.clientId, { isOpen: false })
				);
		}
	};

	// Whether the last press on the title row started on its text. Read on
	// press, not click, because selecting the item can move it under the
	// pointer, and a click that ends off the text would then toggle it.
	const pressedText = useRef(false);

	/**
	 * Notes where a press on the title row started.
	 *
	 * @param {PointerEvent} event The press.
	 */
	const notePress = (event) => {
		pressedText.current = Boolean(
			event.target.closest(`.${CLASS}__title-text`)
		);
	};

	/**
	 * Opens or closes the item from a click on its title row. A click on
	 * the text places the cursor there instead.
	 */
	const toggleFromTitle = () => {
		if (!pressedText.current) {
			setIsExpanded(!isExpanded);
		}
	};

	return (
		<>
			<BlockControls group="block">
				<ToolbarButton
					icon={isExpanded ? chevronUp : chevronDown}
					label={
						isExpanded
							? __("Close item", "codexa-blocks")
							: __("Open item", "codexa-blocks")
					}
					onClick={() => setIsExpanded(!isExpanded)}
				/>
			</BlockControls>
			<InspectorTabs
				layout={
					<PanelBody title={__("Item", "codexa-blocks")}>
						<ToggleControl
							__nextHasNoMarginBottom
							label={__(
								"Open when the page loads",
								"codexa-blocks"
							)}
							help={
								onlyOneOpen
									? __(
											"Only one item can start open. Turning this on turns it off for the others.",
											"codexa-blocks"
										)
									: undefined
							}
							checked={isOpen}
							onChange={setOpen}
						/>
					</PanelBody>
				}
				advanced={
					<VisibilityControls
						attributes={attributes}
						setAttributes={setAttributes}
					/>
				}
			/>

			<div {...blockProps}>
				{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- The toolbar button does the same from the keyboard. */}
				<div
					className={`${CLASS}__title`}
					onPointerDown={notePress}
					onClick={toggleFromTitle}
				>
					<RichText
						tagName={titleTag}
						className={`${CLASS}__title-text`}
						aria-label={__("Item title", "codexa-blocks")}
						placeholder={__("Item title", "codexa-blocks")}
						allowedFormats={["core/bold", "core/italic"]}
						value={title}
						onChange={(next) => setAttributes({ title: next })}
					/>
				</div>
				{isExpanded && <div {...innerBlocksProps} />}
			</div>
		</>
	);
}
