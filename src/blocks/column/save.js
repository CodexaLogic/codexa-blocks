/**
 * Saves only the inner blocks. The wrapper is rendered in PHP
 * (CodexaBlocks\Blocks\Render\Column), so its markup and classes can
 * change without invalidating saved content.
 */
import { InnerBlocks } from "@wordpress/block-editor";

/**
 * @return {Element} The inner blocks' saved content.
 */
export function save() {
	return <InnerBlocks.Content />;
}
