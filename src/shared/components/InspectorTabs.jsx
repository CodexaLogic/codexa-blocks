/**
 * A Codexa block's sidebar as three tabs, each with an icon and a name.
 * Settings holds content, links and arrangement, Styles holds colors,
 * borders, backgrounds and typography, and Advanced holds visibility and
 * the HTML tag. The chosen tab is saved in the user's preferences.
 *
 * WordPress draws its own Advanced panel (HTML anchor, CSS classes, fields
 * other plugins add) after every block's controls, so it shows at the
 * bottom of the Advanced tab and the stylesheet hides it on other tabs. A
 * block without an Advanced tab shows it below every tab.
 *
 * A block passes each tab's panels, and empty tabs aren't shown.
 *
 *     <InspectorTabs
 *         layout={<PanelBody title="Columns">…</PanelBody>}
 *         style={<DesignControls … />}
 *         advanced={<VisibilityControls … />}
 *     />
 */
import { InspectorControls } from "@wordpress/block-editor";
import { TabPanel } from "@wordpress/components";
import { useDispatch, useSelect } from "@wordpress/data";
import { useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Icon, brush, cog, layout as layoutIcon } from "@wordpress/icons";
import { store as preferencesStore } from "@wordpress/preferences";

/** Where the chosen tab is saved in the user's preferences. */
const SCOPE = "codexa-blocks";
const KEY = "inspectorTab";

/**
 * A tab's title, its icon above its name.
 *
 * @param {Object} props      Component props.
 * @param {Object} props.icon An icon from WordPress's icon library.
 * @param {string} props.name The tab's name.
 * @return {Element} The title.
 */
function TabTitle({ icon, name }) {
	return (
		<>
			<Icon icon={icon} size={20} />
			<span>{name}</span>
		</>
	);
}

/**
 * The tabs themselves, separate from InspectorTabs because they mount each
 * time the block is selected, so the "first report" flag starts fresh.
 *
 * @param {Object}                                 props      Component props.
 * @param {Array<{name: string, panels: Element}>} props.tabs Tabs that have panels, with their titles.
 * @return {Element} The tab panel.
 */
function Tabs({ tabs }) {
	const saved = useSelect(
		(select) => select(preferencesStore).get(SCOPE, KEY),
		[]
	);
	const { set } = useDispatch(preferencesStore);
	// TabPanel reports its first tab when it appears; only a click is saved,
	// so a block without the saved tab doesn't overwrite it.
	const hasOpened = useRef(false);

	const initial = tabs.some((tab) => tab.name === saved)
		? saved
		: tabs[0].name;

	return (
		<TabPanel
			className="codexa-inspector-tabs"
			tabs={tabs}
			initialTabName={initial}
			onSelect={(name) => {
				if (!hasOpened.current) {
					hasOpened.current = true;
					return;
				}

				if (name !== saved) {
					set(SCOPE, KEY, name);
				}
			}}
		>
			{(tab) => tab.panels}
		</TabPanel>
	);
}

/**
 * @param {Object}  [props]          Component props.
 * @param {Element} [props.layout]   Panels for the Settings tab.
 * @param {Element} [props.style]    Panels for the Styles tab.
 * @param {Element} [props.advanced] Panels for the Advanced tab.
 * @return {Element} The tabs, in the block's sidebar.
 */
export function InspectorTabs({ layout, style, advanced }) {
	const tabs = [
		{
			name: "layout",
			title: (
				<TabTitle
					icon={layoutIcon}
					name={__("Settings", "codexa-blocks")}
				/>
			),
			panels: layout,
		},
		{
			name: "style",
			title: (
				<TabTitle icon={brush} name={__("Styles", "codexa-blocks")} />
			),
			panels: style,
		},
		{
			name: "advanced",
			className: "codexa-inspector-tabs__advanced",
			title: (
				<TabTitle icon={cog} name={__("Advanced", "codexa-blocks")} />
			),
			panels: advanced,
		},
	].filter((tab) => tab.panels);

	return tabs.length ? (
		<InspectorControls>
			<Tabs tabs={tabs} />
		</InspectorControls>
	) : null;
}
