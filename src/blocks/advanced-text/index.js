/**
 * Registers the Advanced Text block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The text is
 * rendered in PHP (CodexaBlocks\Blocks\Render\AdvancedText), which looks
 * up a linked post's address when the page is built, so the block saves
 * nothing of its own.
 */
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { advancedTextIcon } from "./icon.jsx";
import "./style.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(advancedTextIcon),
	edit: Edit,
	save: () => null,
});
