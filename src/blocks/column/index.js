/**
 * Registers the Column block in the editor.
 *
 * Metadata comes from block.json; this adds the editor parts.
 */
import { registerBlockType } from "@wordpress/blocks";

import { blockIcon } from "@codexa-blocks/editor";

import metadata from "./block.json";
import { Edit } from "./edit.jsx";
import { columnIcon } from "./icon.jsx";
import { save } from "./save.js";
import "./style.scss";

registerBlockType(metadata.name, {
	icon: blockIcon(columnIcon),
	edit: Edit,
	save,
});
