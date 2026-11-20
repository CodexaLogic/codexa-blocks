/**
 * Registers the Gallery block in the editor, with its own gallery types.
 *
 * Metadata comes from block.json; this adds the editor parts. The block is
 * rendered in PHP (CodexaBlocks\Blocks\Render\Gallery), so it saves no
 * markup and its settings can change without block validation errors.
 */
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { galleryIcon } from "./icon.jsx";
import "./types/grid.jsx";
import "./types/masonry.jsx";
import "./types/carousel.jsx";
import "./style.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(galleryIcon),
	edit: Edit,
	save: () => null,
});
