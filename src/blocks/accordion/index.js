/**
 * Registers the Accordion block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The wrapper
 * is rendered in PHP (CodexaBlocks\Blocks\Render\Accordion), so the block
 * saves only its items, and its markup and classes can change without
 * invalidating saved content.
 */
import { InnerBlocks } from "@wordpress/block-editor";
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { accordionIcon } from "./icon.jsx";
import "./style.scss";
import "./editor.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(accordionIcon),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
