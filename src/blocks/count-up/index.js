/**
 * Registers the Count Up block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts. The block is
 * rendered in PHP (CodexaBlocks\Blocks\Render\CountUp), so it saves no
 * markup and its settings can change without block validation errors.
 */
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { countUpIcon } from "./icon.jsx";
import "./style.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(countUpIcon),
	edit: Edit,
	save: () => null,
});
