/**
 * The link settings linkable blocks share, where it links (a post or any
 * address), a section to jump to, and once linked, new tab, nofollow and
 * sponsored.
 *
 * The section is a block's HTML anchor, on the linked post, on the page a
 * web address opens, or, with nothing else linked, on this page. An email
 * address, a phone number or a "#section" address takes none.
 *
 * Every block that uses these saves them under the same attribute names
 * (linkPostId, linkPostType, linkUrl, linkAnchor, linkOpensInNewTab and
 * linkRel), which CodexaBlocks\Utilities\Link reads on the page.
 *
 *     <PanelBody title="Link">
 *         <LinkControls attributes={attributes} setAttributes={setAttributes}
 *             unpublishedNotice="The linked post isn't published…">
 *             {!hasLink(attributes) && <Notice>…</Notice>}
 *         </LinkControls>
 *     </PanelBody>
 *
 * With `compact`, only the link field and Open in a new tab, for the
 * toolbar's link popover (LinkToolbar.jsx).
 *
 * The settings can belong to something other than a block, such as a
 * Gallery image. Pass its link values as `attributes` and a function that
 * saves them as `setAttributes`.
 */
import { Notice, TextControl, ToggleControl } from "@wordpress/components";
import { store as coreStore } from "@wordpress/core-data";
import { useSelect } from "@wordpress/data";
import { __ } from "@wordpress/i18n";

import { cleanAnchor } from "../utilities/link.js";
import { LinkSearchControl } from "./LinkSearchControl.jsx";

/**
 * Whether a block has a link set. Mirrors Link::has() in PHP.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} True when a post, an address or a section is chosen.
 */
export const hasLink = (attributes) =>
	Boolean(
		attributes.linkPostId ||
		attributes.linkUrl?.trim() ||
		attributes.linkAnchor
	);

/**
 * Where a section to jump to would be, or null where a link can't take
 * one. Mirrors Link::href() in PHP.
 *
 * @param {Object}           attributes            Link values.
 * @param {number|undefined} attributes.linkPostId The linked post's ID.
 * @param {string|undefined} attributes.linkUrl    The linked address.
 * @return {"post"|"url"|"page"|null} The linked post, a web address, this page, or null.
 */
const sectionTarget = ({ linkPostId, linkUrl }) => {
	const url = linkUrl?.trim() ?? "";

	if (linkPostId) {
		return "post";
	}

	if (url === "") {
		return "page";
	}

	return /^(?:https?:\/\/|\/(?!\/))/i.test(url) ? "url" : null;
};

/** The help under "Jump to a section", by where the section is. */
const SECTION_HELP = {
	post: __(
		"Optional: the HTML anchor of a block on the linked page, e.g. pricing. The link opens the page at that block.",
		"codexa-blocks"
	),
	url: __(
		"Optional: the ID of a section on that page, e.g. pricing. It's added to the address as #pricing.",
		"codexa-blocks"
	),
	page: __(
		"Optional: the HTML anchor of a block on this page, e.g. pricing. The link scrolls to that block.",
		"codexa-blocks"
	),
};

/**
 * Turns an on/off switch for one rel value into the new list.
 *
 * @param {string[]} rel     Current rel values.
 * @param {string}   value   e.g. "nofollow".
 * @param {boolean}  checked Whether it's now on.
 * @return {string[]} The new rel values.
 */
const toggleRel = (rel, value, checked) =>
	checked
		? [...new Set([...rel, value])]
		: rel.filter((item) => item !== value);

/**
 * @param {Object}                       props                   Component props.
 * @param {Object}                       props.attributes        Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes     Updates attributes.
 * @param {string}                       props.unpublishedNotice Says what happens on the page while the linked post isn't published.
 * @param {Element}                      [props.children]        Shown under the link field, e.g. a notice for a block without a link.
 * @param {boolean}                      [props.compact]         Only the link field and Open in a new tab.
 * @param {string}                       [props.label]           The link field's label. "Link to" by default.
 * @param {boolean}                      [props.sectionOnPage]   With nothing linked, offer a section on this page (true by default).
 * @return {Element} The controls.
 */
export function LinkControls({
	attributes,
	setAttributes,
	unpublishedNotice,
	children,
	compact = false,
	label = __("Link to", "codexa-blocks"),
	sectionOnPage = true,
}) {
	const {
		linkPostId,
		linkPostType,
		linkUrl,
		linkAnchor,
		linkOpensInNewTab = false,
		linkRel = [],
	} = attributes;

	/**
	 * Whether a link can take a section. A section on this page counts only
	 * where one is offered.
	 *
	 * @param {Object} values Link values, linkPostId and linkUrl.
	 * @return {boolean} Whether it can.
	 */
	const takesSection = (values) => {
		const target = sectionTarget(values);

		return target !== null && (target !== "page" || sectionOnPage);
	};

	const section = sectionTarget(attributes);
	const showSection = !compact && takesSection(attributes);

	// The linked post's status, to warn when it's no longer published. Read
	// as anyone who can see the post may ("view"), so it works for Authors
	// and Contributors linking to posts they can't edit.
	const linkedStatus = useSelect(
		(select) =>
			linkPostId && linkPostType
				? select(coreStore).getEntityRecord(
						"postType",
						linkPostType,
						linkPostId,
						{ context: "view" }
					)?.status
				: undefined,
		[linkPostId, linkPostType]
	);

	return (
		<>
			<LinkSearchControl
				label={label}
				value={{
					postId: linkPostId,
					postType: linkPostType,
					url: linkUrl,
				}}
				onChange={(next) =>
					setAttributes({
						linkPostId: next.postId,
						linkPostType: next.postType,
						linkUrl: next.url,
						// A section stays while the new link can take one.
						linkAnchor: takesSection({
							linkPostId: next.postId,
							linkUrl: next.url,
						})
							? linkAnchor
							: undefined,
					})
				}
			/>
			{children}
			{linkedStatus && linkedStatus !== "publish" && (
				<Notice status="warning" isDismissible={false}>
					{unpublishedNotice}
				</Notice>
			)}
			{showSection && (
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={__("Jump to a section", "codexa-blocks")}
					help={SECTION_HELP[section]}
					value={linkAnchor ?? ""}
					onChange={(next) =>
						setAttributes({
							linkAnchor: cleanAnchor(next) || undefined,
						})
					}
				/>
			)}
			{hasLink(attributes) && (
				<>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Open in a new tab", "codexa-blocks")}
						checked={linkOpensInNewTab}
						onChange={(next) =>
							setAttributes({ linkOpensInNewTab: next })
						}
					/>
				</>
			)}
			{hasLink(attributes) && !compact && (
				<>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Mark as nofollow", "codexa-blocks")}
						checked={linkRel.includes("nofollow")}
						onChange={(checked) =>
							setAttributes({
								linkRel: toggleRel(
									linkRel,
									"nofollow",
									checked
								),
							})
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__("Mark as sponsored", "codexa-blocks")}
						checked={linkRel.includes("sponsored")}
						onChange={(checked) =>
							setAttributes({
								linkRel: toggleRel(
									linkRel,
									"sponsored",
									checked
								),
							})
						}
					/>
				</>
			)}
		</>
	);
}
