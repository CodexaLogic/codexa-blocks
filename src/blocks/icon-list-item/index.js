/**
 * Registers the Icon List Item block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The item is
 * rendered in PHP (CodexaBlocks\Blocks\Render\IconListItem), which looks
 * up a linked post's address when the page is built, so it saves nothing
 * of its own. Its styles are the Icon List's.
 */
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { iconListItemIcon } from "./icon.jsx";

registerBlockType(metadata.name, {
	icon: blockIcon(iconListItemIcon),
	edit: Edit,
	save: () => null,
	// Backspace at the start of an item joins it to the one before.
	merge: (attributes, next) => ({
		text: (attributes.text ?? "") + (next.text ?? ""),
	}),
});
