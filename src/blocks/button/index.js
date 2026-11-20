/**
 * Registers the Button block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The button
 * is rendered in PHP (CodexaBlocks\Blocks\Render\Button), which looks up
 * the linked post's address when the page is built, so the block saves
 * nothing of its own.
 */
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { buttonIcon } from "./icon.jsx";
import "./style.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(buttonIcon),
	edit: Edit,
	save: () => null,
});
