/**
 * A place for an add-on's own shadow settings, below a block's shadow
 * settings. While nothing fills it, the block shows a note that Pro has
 * custom shadows instead (gallery/edit.jsx, posts/edit.jsx,
 * DesignControls.jsx).
 *
 * An add-on renders a fill from a plugin (registerPlugin()). Its function
 * child receives the block's name, attributes and shadows, so one fill can
 * serve every block with shadows. Each shadow has
 * - label, its name, e.g. "Hover shadow"
 * - value, its saved value (ShadowControl.jsx)
 * - onChange, which saves a new value
 * - base, optional, what it shows without its own value, e.g. a hover
 *   shadow that matches the normal one
 *
 *     registerPlugin("my-shadow-settings", {
 *         render: () => (
 *             <ShadowSettings>
 *                 {({ shadows }) => …}
 *             </ShadowSettings>
 *         ),
 *     });
 *
 * A custom shadow is saved as "var(--codexa-shadow-custom, <shadow>)",
 * with the shadow in the saved form the checks accept (cssShadow(),
 * Style::shadow()). It then shows as Custom in ShadowControl, takes the
 * block's shadow color, and is printed on the page like any other.
 */
import { createSlotFill } from "@wordpress/components";

export const { Fill: ShadowSettings, Slot: ShadowSettingsSlot } =
	createSlotFill("CodexaBlocksShadowSettings");
