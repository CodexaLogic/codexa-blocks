/**
 * A place for an add-on's own divider settings, at the end of a block's
 * Dividers panel. While nothing fills it, the panel shows a note that Pro
 * has more instead (DividerControls.jsx).
 *
 * An add-on renders a fill from a plugin (registerPlugin()). Its function
 * child receives the block's name and its dividers, each with
 * - label, its name, e.g. "Bottom"
 * - edge, "top" or "bottom"
 * - value, the saved divider (Dividers.php) or undefined
 * - onChange, which saves a new divider
 *
 *     registerPlugin("my-divider-settings", {
 *         render: () => (
 *             <DividerSettings>
 *                 {({ dividers }) => …}
 *             </DividerSettings>
 *         ),
 *     });
 *
 * An add-on's own keys in a divider are kept as they are. Its classes
 * reach the divider through the codexaBlocks.dividerClasses filter here
 * and codexa_blocks/divider_classes on the page. Shapes are added in PHP
 * only, with codexa_blocks/divider_shapes.
 */
import { createSlotFill } from "@wordpress/components";

export const { Fill: DividerSettings, Slot: DividerSettingsSlot } =
	createSlotFill("CodexaBlocksDividerSettings");
