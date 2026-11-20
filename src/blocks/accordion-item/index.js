/**
 * Registers the Accordion Item block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The item is
 * rendered in PHP (CodexaBlocks\Blocks\Render\AccordionItem) as a
 * <details> element, so it saves only its content.
 */
import { InnerBlocks } from "@wordpress/block-editor";
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { accordionItemIcon } from "./icon.jsx";

registerBlockType(metadata.name, {
	icon: blockIcon(accordionItemIcon),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
