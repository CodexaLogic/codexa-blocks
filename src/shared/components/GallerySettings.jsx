/**
 * A place in the Gallery block's sidebar for an add-on's own settings, in
 * the Settings tab after the Layout panel. A fill renders its own panels.
 * Empty, the block shows a Pro note (gallery/edit.jsx).
 *
 * An add-on renders a fill from a plugin (registerPlugin()). Its function
 * child receives the selected Gallery block's attributes, setAttributes,
 * and its images, each with its Media Library ID, in the gallery's order.
 *
 *     registerPlugin("my-gallery-settings", {
 *         render: () => (
 *             <GallerySettings>
 *                 {({ attributes, setAttributes, images }) => (
 *                     <PanelBody title="My settings">…</PanelBody>
 *                 )}
 *             </GallerySettings>
 *         ),
 *     });
 *
 * To draw something in the editor before or after the images, such as
 * filter buttons, an add-on uses the codexaBlocks.galleryBeforeItems and
 * codexaBlocks.galleryAfterItems filters instead (see gallery/edit.jsx),
 * since a slot shows in only one block at a time.
 */
import { createSlotFill } from "@wordpress/components";

export const { Fill: GallerySettings, Slot: GallerySettingsSlot } =
	createSlotFill("CodexaBlocksGallerySettings");
