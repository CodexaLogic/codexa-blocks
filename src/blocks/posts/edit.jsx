/**
 * Posts editor, with which posts to show, how each looks, and a preview.
 *
 * The preview reads the same posts as the page (postsQuery() through the
 * REST API) and uses the page's markup (Posts::items()), so the stylesheet
 * styles both. Preview links don't navigate.
 *
 * Only post types and taxonomies PHP allows are offered (SOURCES). A post
 * type no longer allowed, such as one from an add-on turned off, shows a
 * notice instead.
 *
 * Add-ons put their settings in the PostsSettings and PostsLoadMoreSettings
 * slots, and draw their part of the preview before the posts with the
 * codexaBlocks.postsBeforeItems filter, which mirrors the PHP filter
 * codexa_blocks/posts/before_items.
 */
import {
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
} from "@wordpress/block-editor";
import {
	Button,
	Notice,
	PanelBody,
	RangeControl,
	SelectControl,
	Spinner,
	TextControl,
	ToggleControl,
} from "@wordpress/components";
import { useSelect } from "@wordpress/data";
import { applyFilters } from "@wordpress/hooks";
import { __ } from "@wordpress/i18n";

import {
	CAROUSEL_TRACK,
	CarouselFields,
	CarouselFrame,
	ColorRow,
	ColorRows,
	DesignControls,
	IMAGE_SHAPE_OPTIONS,
	InspectorTabs,
	LengthControl,
	PostsLoadMoreSettingsSlot,
	PostsSettingsSlot,
	ProNote,
	RadiusControl,
	ResponsiveControl,
	ShadowControl,
	ShadowSettingsSlot,
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
	COLUMNS,
	COUNT,
	EXCERPT,
	SOURCES,
	SOURCES_EXTENDED,
	numberIn,
	postsQuery,
	postsStyles,
} from "./posts-styles.js";
import { TermPicker } from "./TermPicker.jsx";
import { usePosts } from "./use-posts.js";

/** Sort choices, with order by and direction together as people think of them. */
const SORTS = [
	{ value: "date/desc", label: __("Newest first", "codexa-blocks") },
	{ value: "date/asc", label: __("Oldest first", "codexa-blocks") },
	{
		value: "modified/desc",
		label: __("Recently updated", "codexa-blocks"),
	},
	{ value: "title/asc", label: __("Title, A to Z", "codexa-blocks") },
	{ value: "title/desc", label: __("Title, Z to A", "codexa-blocks") },
	{
		value: "menu_order/asc",
		label: __("Page order", "codexa-blocks"),
		needsOrder: true,
	},
];

const TITLE_LEVELS = ["h2", "h3", "h4", "h5", "h6"].map((value) => ({
	value,
	label: value.toUpperCase(),
}));

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
		postType,
		taxonomy,
		terms,
		count,
		orderBy,
		order,
		excludeCurrent,
		layout,
		carousel,
		columns,
		gap,
		showImage,
		imageShape,
		imageSize,
		imageRadius,
		fallbackImageId,
		showTitle,
		titleLevel,
		showDate,
		showExcerpt,
		excerptLength,
		showReadMore,
		readMoreText,
		cardPadding,
		contentPadding,
		cardRadius,
		cardShadow,
		cardShadowColor,
		cardHoverShadow,
		titleTypography,
		dateTypography,
		excerptTypography,
		readMoreStyle,
		readMoreTypography,
		readMorePadding,
		readMoreRadius,
		padding,
		margin,
	} = attributes;
	const [previewDevice] = useDevice();

	const source = SOURCES.find(({ slug }) => slug === postType);
	const shownTaxonomy = source?.taxonomies.find(
		({ slug }) => slug === taxonomy
	);
	const currentPostId = useSelect(
		(select) => select("core/editor")?.getCurrentPostId?.() ?? 0,
		[]
	);
	const query = postsQuery(attributes, source, currentPostId);
	const words = numberIn(excerptLength, EXCERPT, 20);
	const { isLoading, posts, imageSizes } = usePosts(query, postType, {
		words,
		size: imageSize,
		fallbackImageId,
	});

	const styles = responsiveStyles()
		.box("padding", padding, cssLength)
		.box("margin", margin, cssLength, ["top", "bottom"]);
	const ownClasses = postsStyles(styles, attributes);
	const editorClasses = designStyles(styles, attributes, previewDevice);

	const blockProps = useBlockProps({
		className: [styles.classNames(), ...ownClasses, ...editorClasses].join(
			" "
		),
		style: styles.style(),
	});

	const sorts = SORTS.filter(
		({ needsOrder }) => !needsOrder || source?.hasOrder
	);
	const sort = `${orderBy}/${order}`;
	const TitleTag = titleLevel;
	const isCarousel = layout === "carousel";
	const carouselSettings =
		carousel && typeof carousel === "object" ? carousel : {};
	const moreText = readMoreText.trim() || __("Read more", "codexa-blocks");

	// Links in the preview stay in the editor.
	const stay = (event) => event.preventDefault();

	// The list as it is, or in the carousel, as Posts.php prints it.
	const layOut = (list) =>
		isCarousel ? (
			<CarouselFrame
				blockName="codexa-blocks/posts"
				settings={carouselSettings}
				label={__("Posts", "codexa-blocks")}
			>
				{list}
			</CarouselFrame>
		) : (
			list
		);

	return (
		<>
			<InspectorTabs
				layout={
					<>
						<PanelBody title={__("Posts", "codexa-blocks")}>
							{SOURCES.length > 1 && (
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Show", "codexa-blocks")}
									value={source ? postType : ""}
									options={[
										...(source
											? []
											: [
													{
														value: "",
														label: __(
															"Choose…",
															"codexa-blocks"
														),
													},
												]),
										...SOURCES.map(({ slug, label }) => ({
											value: slug,
											label,
										})),
									]}
									onChange={(next) =>
										setAttributes({
											postType: next,
											taxonomy: "",
											terms: [],
											orderBy:
												orderBy === "menu_order"
													? "date"
													: orderBy,
										})
									}
								/>
							)}
							{!SOURCES_EXTENDED && (
								<ProNote
									description={__(
										"Show all post types.",
										"codexa-blocks"
									)}
								/>
							)}
							{source?.taxonomies.length > 0 && (
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Filter by", "codexa-blocks")}
									value={shownTaxonomy ? taxonomy : ""}
									options={[
										{
											value: "",
											label: __(
												"No filter",
												"codexa-blocks"
											),
										},
										...source.taxonomies.map(
											({ slug, label }) => ({
												value: slug,
												label,
											})
										),
									]}
									onChange={(next) =>
										setAttributes({
											taxonomy: next,
											terms: [],
										})
									}
								/>
							)}
							{shownTaxonomy && (
								<TermPicker
									key={shownTaxonomy.slug}
									label={shownTaxonomy.label}
									taxonomy={shownTaxonomy.slug}
									value={terms}
									onChange={(next) =>
										setAttributes({ terms: next })
									}
								/>
							)}
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Number of posts", "codexa-blocks")}
								min={COUNT.min}
								max={COUNT.max}
								value={numberIn(count, COUNT, 6)}
								onChange={(next) =>
									setAttributes({
										count: numberIn(next, COUNT, 6),
									})
								}
							/>
							{/* Ways to show more posts, after how many show. */}
							<PostsLoadMoreSettingsSlot
								fillProps={{ attributes, setAttributes }}
							>
								{(fills) =>
									fills.length ? (
										fills
									) : (
										<ProNote
											description={__(
												"Show more posts with a Load more button or infinite scroll.",
												"codexa-blocks"
											)}
										/>
									)
								}
							</PostsLoadMoreSettingsSlot>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Sort", "codexa-blocks")}
								value={
									sorts.some(({ value }) => value === sort)
										? sort
										: "date/desc"
								}
								options={sorts.map(({ value, label }) => ({
									value,
									label,
								}))}
								onChange={(next) => {
									const [nextOrderBy, nextOrder] =
										next.split("/");

									setAttributes({
										orderBy: nextOrderBy,
										order: nextOrder,
									});
								}}
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={__(
									"Leave out the post being viewed",
									"codexa-blocks"
								)}
								help={__(
									"So a list of posts on a post doesn't show that post again.",
									"codexa-blocks"
								)}
								checked={excludeCurrent}
								onChange={(next) =>
									setAttributes({ excludeCurrent: next })
								}
							/>
						</PanelBody>

						<PanelBody
							title={__("Layout", "codexa-blocks")}
							initialOpen={false}
						>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={__("Layout", "codexa-blocks")}
								value={isCarousel ? "carousel" : "grid"}
								options={[
									{
										value: "grid",
										label: __("Grid", "codexa-blocks"),
									},
									{
										value: "carousel",
										label: __("Carousel", "codexa-blocks"),
									},
								]}
								onChange={(next) =>
									setAttributes({ layout: next })
								}
							/>
							<ResponsiveControl
								label={
									isCarousel
										? __("Posts in view", "codexa-blocks")
										: __("Columns", "codexa-blocks")
								}
								value={columns}
								onChange={(next) =>
									setAttributes({ columns: next })
								}
							>
								{(control) => (
									<RangeControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={control.label}
										hideLabelFromVision
										min={COLUMNS.min}
										max={COLUMNS.max}
										value={
											control.value ??
											control.inherited ??
											COLUMNS.min
										}
										onChange={(next) =>
											control.onChange(next)
										}
									/>
								)}
							</ResponsiveControl>
						</PanelBody>

						{isCarousel && (
							<PanelBody
								title={__("Carousel settings", "codexa-blocks")}
								initialOpen={false}
							>
								<CarouselFields
									blockName="codexa-blocks/posts"
									attributes={attributes}
									settings={carouselSettings}
									setSettings={(next) =>
										setAttributes({
											carousel: {
												...carouselSettings,
												...next,
											},
										})
									}
								/>
							</PanelBody>
						)}

						<PanelBody
							title={__("Content", "codexa-blocks")}
							initialOpen={false}
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label={__("Featured image", "codexa-blocks")}
								checked={showImage}
								onChange={(next) =>
									setAttributes({ showImage: next })
								}
							/>
							{showImage && (
								<>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__(
											"Image shape",
											"codexa-blocks"
										)}
										value={imageShape}
										options={IMAGE_SHAPE_OPTIONS}
										onChange={(next) =>
											setAttributes({ imageShape: next })
										}
									/>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={__(
											"Image size",
											"codexa-blocks"
										)}
										help={__(
											"The largest file the page loads. Browsers pick a smaller one where it is enough.",
											"codexa-blocks"
										)}
										value={imageSize}
										options={imageSizes.map(
											({ slug, name }) => ({
												label: name,
												value: slug,
											})
										)}
										onChange={(next) =>
											setAttributes({ imageSize: next })
										}
									/>
									<FallbackImage
										id={fallbackImageId}
										onChange={(next) =>
											setAttributes({
												fallbackImageId: next,
											})
										}
									/>
								</>
							)}
							<ToggleControl
								__nextHasNoMarginBottom
								label={__("Title", "codexa-blocks")}
								checked={showTitle}
								onChange={(next) =>
									setAttributes({ showTitle: next })
								}
							/>
							{showTitle && (
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Title tag", "codexa-blocks")}
									help={__(
										"One level below the heading above the posts, so the page's outline stays in order.",
										"codexa-blocks"
									)}
									value={titleLevel}
									options={TITLE_LEVELS}
									onChange={(next) =>
										setAttributes({ titleLevel: next })
									}
								/>
							)}
							<ToggleControl
								__nextHasNoMarginBottom
								label={__("Date", "codexa-blocks")}
								checked={showDate}
								onChange={(next) =>
									setAttributes({ showDate: next })
								}
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={__("Excerpt", "codexa-blocks")}
								checked={showExcerpt}
								onChange={(next) =>
									setAttributes({ showExcerpt: next })
								}
							/>
							{showExcerpt && (
								<RangeControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__(
										"Excerpt length (words)",
										"codexa-blocks"
									)}
									help={__(
										"A post's own excerpt is used when it has one, shortened to this length.",
										"codexa-blocks"
									)}
									min={EXCERPT.min}
									max={EXCERPT.max}
									value={words}
									onChange={(next) =>
										setAttributes({
											excerptLength: numberIn(
												next,
												EXCERPT,
												20
											),
										})
									}
								/>
							)}
							<ToggleControl
								__nextHasNoMarginBottom
								label={__("Read more link", "codexa-blocks")}
								checked={showReadMore}
								onChange={(next) =>
									setAttributes({ showReadMore: next })
								}
							/>
							{showReadMore && (
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__(
										"Read more text",
										"codexa-blocks"
									)}
									help={__(
										"Screen readers also hear the post's title, so every link has its own name.",
										"codexa-blocks"
									)}
									placeholder={__(
										"Read more",
										"codexa-blocks"
									)}
									value={readMoreText}
									onChange={(next) =>
										setAttributes({ readMoreText: next })
									}
								/>
							)}
						</PanelBody>

						<PostsSettingsSlot
							fillProps={{ attributes, setAttributes }}
						>
							{(fills) =>
								fills.length ? (
									fills
								) : (
									<PanelBody
										title={__("Filters", "codexa-blocks")}
										initialOpen={false}
									>
										<ProNote
											description={__(
												"Let visitors filter the posts by category.",
												"codexa-blocks"
											)}
										/>
									</PanelBody>
								)
							}
						</PostsSettingsSlot>

						<PanelBody
							title={__("Spacing", "codexa-blocks")}
							initialOpen={false}
						>
							<LengthControl
								label={__(
									"Space between posts",
									"codexa-blocks"
								)}
								value={gap}
								onChange={(next) =>
									setAttributes({ gap: next })
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
						<PanelBody title={__("Cards", "codexa-blocks")}>
							<ColorRows>
								<ColorRow
									label={__("Background", "codexa-blocks")}
									colors={[
										color(
											"cardBackground",
											__(
												"Card background",
												"codexa-blocks"
											)
										),
									]}
								/>
							</ColorRows>
							<SpacingControl
								label={__("Card padding", "codexa-blocks")}
								value={cardPadding}
								onChange={(next) =>
									setAttributes({ cardPadding: next })
								}
							/>
							<SpacingControl
								label={__("Content padding", "codexa-blocks")}
								value={contentPadding}
								onChange={(next) =>
									setAttributes({ contentPadding: next })
								}
							/>
							<RadiusControl
								label={__(
									"Card corner radius",
									"codexa-blocks"
								)}
								value={cardRadius}
								onChange={(next) =>
									setAttributes({ cardRadius: next })
								}
							/>
							<ShadowControl
								label={__("Shadow", "codexa-blocks")}
								value={cardShadow}
								// A color stays only with a shadow to draw.
								onChange={(next) =>
									setAttributes({
										cardShadow: next,
										...(next
											? {}
											: { cardShadowColor: undefined }),
									})
								}
								color={color(
									"cardShadowColor",
									__("Shadow color", "codexa-blocks")
								)}
							/>
							<ShadowControl
								label={__("Hover shadow", "codexa-blocks")}
								emptyLabel={__(
									"Same as normal",
									"codexa-blocks"
								)}
								withNone
								help={__(
									"Shown while the pointer is over a card, and when a link in it has keyboard focus.",
									"codexa-blocks"
								)}
								value={cardHoverShadow}
								onChange={(next) =>
									setAttributes({
										cardHoverShadow: next,
										...(next && next !== "none"
											? {}
											: {
													cardHoverShadowColor:
														undefined,
												}),
									})
								}
								color={{
									...color(
										"cardHoverShadowColor",
										__(
											"Hover shadow color",
											"codexa-blocks"
										)
									),
									// Follows the normal shadow's color.
									inherited: cardShadow
										? cardShadowColor
										: undefined,
									inheritedName: __(
										"same as normal",
										"codexa-blocks"
									),
								}}
							/>
							<ShadowSettingsSlot
								fillProps={{
									name: "codexa-blocks/posts",
									attributes,
									setAttributes,
									shadows: [
										{
											label: __(
												"Shadow",
												"codexa-blocks"
											),
											value: cardShadow,
											onChange: (next) =>
												setAttributes({
													cardShadow: next,
												}),
										},
										{
											label: __(
												"Hover shadow",
												"codexa-blocks"
											),
											value: cardHoverShadow,
											base: cardShadow,
											onChange: (next) =>
												setAttributes({
													cardHoverShadow: next,
												}),
										},
									],
								}}
							>
								{(fills) =>
									fills.length ? (
										fills
									) : (
										<ProNote
											description={__(
												"Customize a shadow's direction, distance, blur and spread.",
												"codexa-blocks"
											)}
										/>
									)
								}
							</ShadowSettingsSlot>
							{showImage && (
								<RadiusControl
									label={__(
										"Image corner radius",
										"codexa-blocks"
									)}
									value={imageRadius}
									onChange={(next) =>
										setAttributes({ imageRadius: next })
									}
								/>
							)}
						</PanelBody>
						{showTitle && (
							<PanelBody
								title={__("Title", "codexa-blocks")}
								initialOpen={false}
							>
								<ColorRows
									states={[
										__("Normal", "codexa-blocks"),
										__("Hover", "codexa-blocks"),
									]}
								>
									<ColorRow
										label={__("Text", "codexa-blocks")}
										colors={[
											color(
												"titleColor",
												__("Title", "codexa-blocks")
											),
											color(
												"titleHoverColor",
												__(
													"Title on hover",
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
						{showDate && (
							<PanelBody
								title={__("Date", "codexa-blocks")}
								initialOpen={false}
							>
								<ColorRows>
									<ColorRow
										label={__("Text", "codexa-blocks")}
										colors={[
											color(
												"dateColor",
												__("Date", "codexa-blocks")
											),
										]}
									/>
								</ColorRows>
								<TypographyControl
									value={dateTypography}
									onChange={(next) =>
										setAttributes({ dateTypography: next })
									}
								/>
							</PanelBody>
						)}
						{showExcerpt && (
							<PanelBody
								title={__("Excerpt", "codexa-blocks")}
								initialOpen={false}
							>
								<ColorRows>
									<ColorRow
										label={__("Text", "codexa-blocks")}
										colors={[
											color(
												"excerptColor",
												__("Excerpt", "codexa-blocks")
											),
										]}
									/>
								</ColorRows>
								<TypographyControl
									value={excerptTypography}
									onChange={(next) =>
										setAttributes({
											excerptTypography: next,
										})
									}
								/>
							</PanelBody>
						)}
						{showReadMore && (
							<PanelBody
								title={__("Read more", "codexa-blocks")}
								initialOpen={false}
							>
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={__("Style", "codexa-blocks")}
									value={readMoreStyle}
									options={[
										{
											label: __("Link", "codexa-blocks"),
											value: "link",
										},
										{
											label: __(
												"Button",
												"codexa-blocks"
											),
											value: "button",
										},
									]}
									onChange={(next) =>
										setAttributes({ readMoreStyle: next })
									}
								/>
								<ColorRows
									states={[
										__("Normal", "codexa-blocks"),
										__("Hover", "codexa-blocks"),
									]}
								>
									<ColorRow
										label={__("Text", "codexa-blocks")}
										colors={[
											color(
												"readMoreColor",
												__("Read more", "codexa-blocks")
											),
											color(
												"readMoreHoverColor",
												__(
													"Read more on hover",
													"codexa-blocks"
												)
											),
										]}
									/>
									{readMoreStyle === "button" && (
										<ColorRow
											label={__(
												"Background",
												"codexa-blocks"
											)}
											colors={[
												color(
													"readMoreBackground",
													__(
														"Read more background",
														"codexa-blocks"
													)
												),
												color(
													"readMoreHoverBackground",
													__(
														"Read more background on hover",
														"codexa-blocks"
													)
												),
											]}
										/>
									)}
								</ColorRows>
								<TypographyControl
									value={readMoreTypography}
									onChange={(next) =>
										setAttributes({
											readMoreTypography: next,
										})
									}
								/>
								{readMoreStyle === "button" && (
									<>
										<SpacingControl
											label={__(
												"Padding",
												"codexa-blocks"
											)}
											value={readMorePadding}
											onChange={(next) =>
												setAttributes({
													readMorePadding: next,
												})
											}
										/>
										<RadiusControl
											label={__(
												"Corner radius",
												"codexa-blocks"
											)}
											value={readMoreRadius}
											onChange={(next) =>
												setAttributes({
													readMoreRadius: next,
												})
											}
										/>
									</>
								)}
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
				{!source && (
					<Notice status="warning" isDismissible={false}>
						{__(
							"This block's post type isn't available on this site, so the page shows nothing here. Choose what to show in the sidebar.",
							"codexa-blocks"
						)}
					</Notice>
				)}
				{source && isLoading && <Spinner />}
				{source && !isLoading && posts.length === 0 && (
					<Notice status="info" isDismissible={false}>
						{__(
							"No published posts match these settings, so the page shows nothing here.",
							"codexa-blocks"
						)}
					</Notice>
				)}
				{posts.length > 0 &&
					/**
					 * Filters what the editor draws before the posts, such as
					 * filter buttons. Mirrors the PHP filter
					 * codexa_blocks/posts/before_items.
					 *
					 * @param {Element|null} element Null by default.
					 * @param {Object}       props   The block's attributes and the posts shown.
					 */
					(applyFilters("codexaBlocks.postsBeforeItems", null, {
						attributes,
						posts,
					}) ??
						null)}
				{posts.length > 0 &&
					layOut(
						// role="list" because Safari stops announcing a list once its
						// markers are removed unless the role is set; Posts.php
						// does the same.
						// eslint-disable-next-line jsx-a11y/no-redundant-roles -- See above.
						<ul
							className={[
								"wp-block-codexa-blocks-posts__items",
								isCarousel && CAROUSEL_TRACK,
							]
								.filter(Boolean)
								.join(" ")}
							role="list"
						>
							{posts.map((post) => (
								<li
									key={post.id}
									className="wp-block-codexa-blocks-posts__item"
								>
									<article className="wp-block-codexa-blocks-posts__post">
										{showImage && post.image && (
											<a
												className="wp-block-codexa-blocks-posts__image-link"
												href="#post"
												onClick={stay}
												tabIndex={-1}
												aria-hidden={
													showTitle || undefined
												}
												aria-label={
													showTitle
														? undefined
														: post.title
												}
											>
												<img
													className="wp-block-codexa-blocks-posts__image"
													src={post.image.src}
													width={post.image.width}
													height={post.image.height}
													alt=""
													loading="lazy"
												/>
											</a>
										)}
										{(showTitle ||
											showDate ||
											(showExcerpt && post.excerpt) ||
											showReadMore) && (
											<div className="wp-block-codexa-blocks-posts__body">
												{showTitle && (
													<TitleTag className="wp-block-codexa-blocks-posts__title">
														<a
															href="#post"
															onClick={stay}
														>
															{post.title}
														</a>
													</TitleTag>
												)}
												{showDate && (
													<time
														className="wp-block-codexa-blocks-posts__date"
														dateTime={post.dateTime}
													>
														{post.date}
													</time>
												)}
												{showExcerpt &&
													post.excerpt && (
														<p className="wp-block-codexa-blocks-posts__excerpt">
															{post.excerpt}
														</p>
													)}
												{showReadMore && (
													<a
														className="wp-block-codexa-blocks-posts__more"
														href="#post"
														onClick={stay}
													>
														{moreText}
														<span className="wp-block-codexa-blocks-posts__hidden">
															: {post.title}
														</span>
													</a>
												)}
											</div>
										)}
									</article>
								</li>
							))}
						</ul>
					)}
			</div>
		</>
	);
}

/**
 * Picks the image shown for posts without a featured image.
 *
 * @param {Object}               props          Component props.
 * @param {number}               props.id       The image's ID, or 0.
 * @param {(id: number) => void} props.onChange Receives the new ID, or 0.
 * @return {Element} The control.
 */
function FallbackImage({ id, onChange }) {
	return (
		<MediaUploadCheck>
			<div className="codexa-posts-fallback">
				<p className="codexa-posts-fallback__label">
					{__("Image for posts without one", "codexa-blocks")}
				</p>
				<MediaUpload
					allowedTypes={["image"]}
					value={id || undefined}
					onSelect={(media) => onChange(media?.id ?? 0)}
					render={({ open }) => (
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={open}
						>
							{id
								? __("Replace image", "codexa-blocks")
								: __("Choose image", "codexa-blocks")}
						</Button>
					)}
				/>
				{id > 0 && (
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						isDestructive
						onClick={() => onChange(0)}
					>
						{__("Remove", "codexa-blocks")}
					</Button>
				)}
			</div>
		</MediaUploadCheck>
	);
}
