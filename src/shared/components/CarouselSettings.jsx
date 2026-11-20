/**
 * A place in the Carousel settings panel, after the arrows and dots, for
 * an add-on's carousel settings, such as Pro's autoplay. The same slot
 * serves every block with a carousel (CarouselFields), so one fill can
 * cover them all. Empty, the panel shows a Pro note.
 *
 * A fill renders controls, not a panel. Its function child receives the
 * block's name and attributes, and the carousel's settings with
 * setSettings, which saves them with the carousel's own. An add-on renders
 * the fill from a plugin (registerPlugin()):
 *
 *     registerPlugin("my-carousel-settings", {
 *         render: () => (
 *             <CarouselSettings>
 *                 {({ blockName, settings, setSettings }) => (
 *                     <ToggleControl … />
 *                 )}
 *             </CarouselSettings>
 *         ),
 *     });
 */
import { createSlotFill } from "@wordpress/components";

export const { Fill: CarouselSettings, Slot: CarouselSettingsSlot } =
	createSlotFill("CodexaBlocksCarouselSettings");
