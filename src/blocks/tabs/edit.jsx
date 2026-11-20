/**
 * Tabs editor, with the tab bar, the selected tab's content and the settings.
 *
 * The preview builds the same classes and variables as Render\Tabs. Labels
 * are typed into the tab bar. One tab's content shows at a time, the one
 * last clicked or holding the selected block, shared through the
 * "codexa-blocks/activeTab" context. The toolbar moves and removes it.
 */
import {
	BlockContextProvider,
	BlockControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from "@wordpress/block-editor";
import { createBlock } from "@wordpress/blocks";
import {
	Button,
	PanelBody,
	SelectControl,
	ToolbarButton,
	ToolbarGroup,
} from "@wordpress/components";
import { useDispatch, useRegistry, useSelect } from "@wordpress/data";
import { useEffect, useState } from "@wordpress/element";
import { __, isRTL, sprintf } from "@wordpress/i18n";
import {
	chevronDown,
	chevronLeft,
	chevronRight,
	chevronUp,
	plus,
	trash,
} from "@wordpress/icons";

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

import { ORIENTATIONS, TAB_ALIGNS, tabStyles } from "./tab-styles.js";

const TAB = "codexa-blocks/tab";

/**
 * Default label of the tab at a position.
 *
 * @param {number} index Zero-based position.
 * @return {string} e.g. "Tab 2".
 */
const defaultLabel = (index) =>
	/* translators: %d: tab number. */
	sprintf(__("Tab %d", "codexa-blocks"), index + 1);

const ORIENTATION_LABELS = {
	horizontal: __("Across the top", "codexa-blocks"),
	vertical: __("Down the side", "codexa-blocks"),
};

// Named left and right; saved as start and end.
const ALIGN_LABELS = {
	start: __("Left", "codexa-blocks"),
	center: __("Center", "codexa-blocks"),
	end: __("Right", "codexa-blocks"),
	stretch: __("Fill the width", "codexa-blocks"),
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
		orientation,
		tabAlign,
		initialTab,
		tabBorderWidth,
		tabBorderRadius,
		tabGap,
		tabPadding,
		tabTypography,
		contentBorderWidth,
		contentBorderRadius,
		contentPadding,
		padding,
		margin,
	} = attributes;

	const [previewDevice] = useDevice();

	// The tabs' IDs and labels. Each is selected on its own, so typing in a
	// tab's content (which changes neither) doesn't re-render the tab bar.
	const order = useSelect(
		(select) => select(blockEditorStore).getBlockOrder(clientId),
		[clientId]
	);
	const labels = useSelect(
		(select) => {
			const { getBlockOrder, getBlockAttributes } =
				select(blockEditorStore);

			return getBlockOrder(clientId).map(
				(id) => getBlockAttributes(id)?.label ?? ""
			);
		},
		[clientId]
	);

	// The tab holding the selected block, or -1.
	const selectedIndex = useSelect(
		(select) => {
			const { getSelectedBlockClientId, getBlockParents, getBlockOrder } =
				select(blockEditorStore);
			const selected = getSelectedBlockClientId();

			if (!selected) {
				return -1;
			}

			const chain = [selected, ...getBlockParents(selected)];

			return getBlockOrder(clientId).findIndex((id) =>
				chain.includes(id)
			);
		},
		[clientId]
	);

	const registry = useRegistry();
	const {
		insertBlock,
		moveBlocksDown,
		moveBlocksUp,
		removeBlock,
		updateBlockAttributes,
	} = useDispatch(blockEditorStore);

	const [active, setActive] = useState(initialTab);

	// Show the tab that holds the selected block.
	useEffect(() => {
		if (selectedIndex >= 0) {
			setActive(selectedIndex);
		}
	}, [selectedIndex]);

	const current = Math.max(0, Math.min(active, order.length - 1));

	const styles = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength, ["top", "bottom"]);
	const layoutClasses = tabStyles(styles, attributes);
	const editorClasses = designStyles(styles, attributes, previewDevice);

	const blockProps = useBlockProps({
		className: [
			styles.classNames(),
			...layoutClasses,
			...editorClasses,
		].join(" "),
		style: styles.style(),
	});

	const innerBlocksProps = useInnerBlocksProps(
		{ className: "wp-block-codexa-blocks-tabs__panels" },
		{
			allowedBlocks: [TAB],
			template: [
				[TAB, { label: defaultLabel(0) }],
				[TAB, { label: defaultLabel(1) }],
			],
			renderAppender: false,
		}
	);

	const addTab = () =>
		insertBlock(
			createBlock(TAB, { label: defaultLabel(order.length) }),
			order.length,
			clientId
		);

	/**
	 * Moves the shown tab one place earlier (-1) or later (1), and keeps it
	 * shown. "Tab that starts open" is a position, so it follows the tab
	 * it named. One batch, so one Undo reverses both.
	 *
	 * @param {-1|1} step Direction.
	 */
	const moveTab = (step) => {
		const target = current + step;

		registry.batch(() => {
			if (step < 0) {
				moveBlocksUp([order[current]], clientId);
			} else {
				moveBlocksDown([order[current]], clientId);
			}

			if (initialTab === current) {
				setAttributes({ initialTab: target });
			} else if (initialTab === target) {
				setAttributes({ initialTab: current });
			}
		});

		setActive(target);
	};

	/**
	 * Removes the shown tab and its content in one batch, so one Undo brings it
	 * back, and keeps "Tab that starts open" on the same tab.
	 */
	const removeTab = () => {
		const remaining = order.length - 1;

		registry.batch(() => {
			removeBlock(order[current], false);

			if (initialTab > current) {
				setAttributes({ initialTab: initialTab - 1 });
			} else if (initialTab === current) {
				setAttributes({
					initialTab: Math.min(current, remaining - 1),
				});
			}
		});

		setActive(Math.min(current, remaining - 1));
	};

	// Arrows point the way the tab moves, up and down for vertical tabs, and
	// left and right across the top, swapped in right-to-left languages.
	const vertical = orientation === "vertical";
	const rtl = isRTL();
	const movers = {
		earlier: vertical
			? { icon: chevronUp, label: __("Move tab up", "codexa-blocks") }
			: {
					icon: rtl ? chevronRight : chevronLeft,
					label: rtl
						? __("Move tab right", "codexa-blocks")
						: __("Move tab left", "codexa-blocks"),
				},
		later: vertical
			? {
					icon: chevronDown,
					label: __("Move tab down", "codexa-blocks"),
				}
			: {
					icon: rtl ? chevronLeft : chevronRight,
					label: rtl
						? __("Move tab left", "codexa-blocks")
						: __("Move tab right", "codexa-blocks"),
				},
	};

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarButton
						icon={movers.earlier.icon}
						label={movers.earlier.label}
						disabled={current === 0}
						onClick={() => moveTab(-1)}
					/>
					<ToolbarButton
						icon={movers.later.icon}
						label={movers.later.label}
						disabled={current === order.length - 1}
						onClick={() => moveTab(1)}
					/>
					<ToolbarButton
						icon={trash}
						label={__("Remove tab", "codexa-blocks")}
						disabled={order.length < 2}
						onClick={removeTab}
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Tabs", "codexa-blocks")}>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Tab position", "codexa-blocks")}
								help={__(
									"Where the block is narrower than 480px, as on a phone or in a narrow column, tabs down the side move to the top.",
									"codexa-blocks"
								)}
								value={orientation}
								options={ORIENTATIONS.map((value) => ({
									label: ORIENTATION_LABELS[value],
									value,
								}))}
								onChange={(next) =>
									setAttributes({ orientation: next })
								}
							/>
							{orientation === "horizontal" && (
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Tab alignment", "codexa-blocks")}
									value={tabAlign}
									options={TAB_ALIGNS.map((value) => ({
										label: ALIGN_LABELS[value],
										value,
									}))}
									onChange={(next) =>
										setAttributes({ tabAlign: next })
									}
								/>
							)}
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__(
									"Tab that starts open",
									"codexa-blocks"
								)}
								value={String(
									Math.min(initialTab, order.length - 1)
								)}
								options={labels.map((label, index) => ({
									label: label || defaultLabel(index),
									value: String(index),
								}))}
								onChange={(next) =>
									setAttributes({ initialTab: Number(next) })
								}
							/>
						</PanelBody>

						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
							<LengthControl
								label={__(
									"Space between tabs",
									"codexa-blocks"
								)}
								value={tabGap}
								onChange={(next) =>
									setAttributes({ tabGap: next })
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
						<PanelBody title={__("Tabs", "codexa-blocks")}>
							<ColorRows
								states={[
									__("Normal", "codexa-blocks"),
									__("Hover", "codexa-blocks"),
									__("Active", "codexa-blocks"),
								]}
							>
								<ColorRow
									label={__("Text", "codexa-blocks")}
									colors={[
										color(
											"tabColor",
											__("Tab text", "codexa-blocks")
										),
										color(
											"tabHoverColor",
											__(
												"Hover tab text",
												"codexa-blocks"
											)
										),
										color(
											"tabActiveColor",
											__(
												"Active tab text",
												"codexa-blocks"
											)
										),
									]}
								/>
								<ColorRow
									label={__("Background", "codexa-blocks")}
									colors={[
										color(
											"tabBackground",
											__(
												"Tab background",
												"codexa-blocks"
											)
										),
										color(
											"tabHoverBackground",
											__(
												"Hover tab background",
												"codexa-blocks"
											)
										),
										color(
											"tabActiveBackground",
											__(
												"Active tab background",
												"codexa-blocks"
											)
										),
									]}
								/>
								<ColorRow
									label={__("Border", "codexa-blocks")}
									colors={[
										color(
											"tabBorderColor",
											__("Tab border", "codexa-blocks")
										),
										color(
											"tabHoverBorderColor",
											__(
												"Hover tab border",
												"codexa-blocks"
											)
										),
										color(
											"tabActiveBorderColor",
											__(
												"Active tab border",
												"codexa-blocks"
											)
										),
									]}
								/>
							</ColorRows>
							<TypographyControl
								value={tabTypography}
								onChange={(next) =>
									setAttributes({ tabTypography: next })
								}
							/>
							<SpacingControl
								label={__("Border width", "codexa-blocks")}
								value={tabBorderWidth}
								withPresets={false}
								onChange={(next) =>
									setAttributes({ tabBorderWidth: next })
								}
							/>
							<RadiusControl
								label={__("Border radius", "codexa-blocks")}
								value={tabBorderRadius}
								onChange={(next) =>
									setAttributes({ tabBorderRadius: next })
								}
							/>
							<SpacingControl
								label={__("Padding", "codexa-blocks")}
								value={tabPadding}
								onChange={(next) =>
									setAttributes({ tabPadding: next })
								}
							/>
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
								value={contentBorderRadius}
								onChange={(next) =>
									setAttributes({ contentBorderRadius: next })
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

			<div {...blockProps}>
				<div className="wp-block-codexa-blocks-tabs__list">
					{order.map((id, index) => (
						// Clicking a tab shows its content, but focus doesn't, because WordPress
						// focuses the first label whenever the block is selected. The label text
						// is still reachable with the keyboard.
						// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
						<div
							key={id}
							className={[
								"wp-block-codexa-blocks-tabs__tab",
								index === current && "is-active",
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => setActive(index)}
						>
							<RichText
								tagName="span"
								aria-label={defaultLabel(index)}
								placeholder={defaultLabel(index)}
								allowedFormats={["core/bold", "core/italic"]}
								value={labels[index]}
								onChange={(next) =>
									updateBlockAttributes(id, { label: next })
								}
							/>
						</div>
					))}
					<Button
						className="wp-block-codexa-blocks-tabs__add"
						icon={plus}
						label={__("Add tab", "codexa-blocks")}
						onClick={addTab}
					/>
				</div>

				<BlockContextProvider
					value={{ "codexa-blocks/activeTab": order[current] }}
				>
					<div {...innerBlocksProps} />
				</BlockContextProvider>
			</div>
		</>
	);
}
