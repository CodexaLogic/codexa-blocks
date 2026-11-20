/**
 * Registers the Tab block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The tab is
 * rendered in PHP (CodexaBlocks\Blocks\Render\Tab), so it saves only its
 * content.
 */
import { InnerBlocks } from "@wordpress/block-editor";
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { tabIcon } from "./icon.jsx";

registerBlockType(metadata.name, {
	icon: blockIcon(tabIcon),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
