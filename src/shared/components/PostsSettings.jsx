/**
 * Places in the Posts block's sidebar for an add-on's own settings, in
 * the Settings tab.
 *
 * - PostsSettings holds an add-on's settings after the Content panel. A
 *   fill renders its own panel. Empty, the block shows a Pro note for
 *   filters (posts/edit.jsx).
 * - PostsLoadMoreSettings holds a way to show more posts, such as Pro's
 *   Load more, after Number of posts in the Posts panel. A fill renders
 *   controls, not a panel. Empty, the block shows a Pro note (posts/edit.jsx).
 *
 * An add-on renders a fill from a plugin (registerPlugin()), and its
 * function child receives the selected Posts block's attributes.
 *
 *     registerPlugin("my-posts-settings", {
 *         render: () => (
 *             <PostsSettings>
 *                 {({ attributes, setAttributes }) => (
 *                     <PanelBody title="My settings">…</PanelBody>
 *                 )}
 *             </PostsSettings>
 *         ),
 *     });
 */
import { createSlotFill } from "@wordpress/components";

export const { Fill: PostsSettings, Slot: PostsSettingsSlot } = createSlotFill(
	"CodexaBlocksPostsSettings"
);

export const { Fill: PostsLoadMoreSettings, Slot: PostsLoadMoreSettingsSlot } =
	createSlotFill("CodexaBlocksPostsLoadMoreSettings");
