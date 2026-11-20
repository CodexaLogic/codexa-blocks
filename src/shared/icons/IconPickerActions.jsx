/**
 * A place at the bottom of the icon picker's window for an add-on's links
 * or actions, such as Codexa Blocks Pro's "Add your own icons". Empty,
 * it shows nothing.
 *
 * An add-on renders a fill from a plugin (registerPlugin()).
 *
 *     registerPlugin("my-icon-links", {
 *         render: () => (
 *             <IconPickerActions>
 *                 <ExternalLink href="…">Get more icons</ExternalLink>
 *             </IconPickerActions>
 *         ),
 *     });
 */
import { createSlotFill } from "@wordpress/components";

export const { Fill: IconPickerActions, Slot: IconPickerActionsSlot } =
	createSlotFill("CodexaBlocksIconPickerActions");
