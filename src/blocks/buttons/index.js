/**
 * Registers the Buttons block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The block is
 * rendered in PHP (CodexaBlocks\Blocks\Render\Buttons), so it saves only
 * its buttons.
 */
import { InnerBlocks } from "@wordpress/block-editor";
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { buttonsIcon } from "./icon.jsx";
import "./style.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(buttonsIcon),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
