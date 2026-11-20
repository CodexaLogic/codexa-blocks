/**
 * Registers the Tabs block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The block is
 * rendered in PHP (CodexaBlocks\Blocks\Render\Tabs), which builds the
 * tab bar from the tabs' labels, so the block saves only its tabs.
 */
import { InnerBlocks } from "@wordpress/block-editor";
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { tabsIcon } from "./icon.jsx";
import "./style.scss";
import "./editor.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(tabsIcon),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
