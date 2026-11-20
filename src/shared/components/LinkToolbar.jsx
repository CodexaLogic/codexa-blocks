/**
 * A Link button in the block toolbar, like the WordPress Button block's,
 * opening the link field in a popover under the block. The full link
 * settings stay in the sidebar (LinkControls.jsx); the popover holds the
 * link field and Open in a new tab, the two most often changed.
 *
 * Ctrl+K (⌘K) opens the popover and Ctrl+Shift+K removes the link, as in
 * WordPress, while focus is anywhere in the block.
 *
 *     const [element, setElement] = useState(null);
 *     const blockProps = useBlockProps({ ref: setElement });
 *     <LinkToolbar attributes={attributes} setAttributes={setAttributes}
 *         anchor={element} isSelected={isSelected}
 *         unpublishedNotice="The linked post isn't published…" />
 */
import { BlockControls } from "@wordpress/block-editor";
import { Button, Popover, ToolbarButton } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { link as linkIcon } from "@wordpress/icons";
import { displayShortcut, isKeyboardEvent } from "@wordpress/keycodes";

import { LinkControls, hasLink } from "./LinkControls.jsx";

/** Every link attribute, cleared, which puts each back to its default. */
const NO_LINK = {
	linkPostId: undefined,
	linkPostType: undefined,
	linkUrl: undefined,
	linkAnchor: undefined,
	linkOpensInNewTab: undefined,
	linkRel: undefined,
};

/**
 * @param {Object}                       props                   Component props.
 * @param {Object}                       props.attributes        Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes     Updates attributes.
 * @param {?Element}                     props.anchor            The block's element, which the popover opens under and which listens for the shortcuts.
 * @param {boolean}                      props.isSelected        Whether the block is selected.
 * @param {string}                       props.unpublishedNotice Says what happens on the page while the linked post isn't published.
 * @return {Element} The toolbar button and, while editing, the popover.
 */
export function LinkToolbar({
	attributes,
	setAttributes,
	anchor,
	isSelected,
	unpublishedNotice,
}) {
	const [isEditing, setIsEditing] = useState(false);
	const isLinked = hasLink(attributes);

	// Closes when another block is selected.
	useEffect(() => {
		if (!isSelected) {
			setIsEditing(false);
		}
	}, [isSelected]);

	useEffect(() => {
		if (!anchor || !isSelected) {
			return undefined;
		}

		const onKeyDown = (event) => {
			if (isKeyboardEvent.primary(event, "k")) {
				// Also keeps the Command Palette, on the same shortcut, shut.
				event.preventDefault();
				setIsEditing(true);
			} else if (isKeyboardEvent.primaryShift(event, "k")) {
				event.preventDefault();
				setAttributes(NO_LINK);
			}
		};

		anchor.addEventListener("keydown", onKeyDown);

		return () => anchor.removeEventListener("keydown", onKeyDown);
	}, [anchor, isSelected, setAttributes]);

	// Closes the popover and puts focus back on the block, so the
	// keyboard isn't left on the page body.
	const close = () => {
		setIsEditing(false);
		anchor?.focus();
	};

	const remove = () => {
		setAttributes(NO_LINK);
		close();
	};

	return (
		<>
			<BlockControls group="block">
				<ToolbarButton
					icon={linkIcon}
					label={
						isLinked
							? __("Edit link", "codexa-blocks")
							: __("Link", "codexa-blocks")
					}
					shortcut={displayShortcut.primary("k")}
					isActive={isLinked}
					aria-expanded={isEditing}
					onClick={() => setIsEditing(true)}
				/>
			</BlockControls>
			{isEditing && anchor && (
				<Popover
					anchor={anchor}
					placement="bottom"
					shift
					focusOnMount="firstElement"
					onClose={close}
					onFocusOutside={() => setIsEditing(false)}
					className="codexa-link-popover"
				>
					<div className="codexa-link-popover__body">
						<LinkControls
							attributes={attributes}
							setAttributes={setAttributes}
							unpublishedNotice={unpublishedNotice}
							compact
						/>
						<div className="codexa-link-popover__actions">
							{isLinked && (
								<Button
									__next40pxDefaultSize
									variant="tertiary"
									isDestructive
									onClick={remove}
								>
									{__("Remove link", "codexa-blocks")}
								</Button>
							)}
							<Button
								__next40pxDefaultSize
								variant="primary"
								onClick={close}
							>
								{__("Done", "codexa-blocks")}
							</Button>
						</div>
					</div>
				</Popover>
			)}
		</>
	);
}
