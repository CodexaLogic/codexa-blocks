/**
 * Registers the Posts block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The block is
 * rendered in PHP (CodexaBlocks\Blocks\Render\Posts), so it saves no
 * markup, and the page always shows the latest posts.
 */
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { postsIcon } from "./icon.jsx";
import "./style.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(postsIcon),
	edit: Edit,
	save: () => null,
});
