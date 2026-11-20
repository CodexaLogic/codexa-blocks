/**
 * Front-end behavior for the Tabs block.
 *
 * The server prints the tabs in their starting state (Tabs::link()), so the
 * page doesn't move when this runs. This adds the behavior, following the
 * WAI-ARIA tabs pattern. One panel shows at a time, arrow keys move between
 * tabs (left/right across the top, up/down down the side), Home and End jump
 * to the first and last, and a tab shows its panel as soon as it is focused.
 * The tabs stay tabs on every screen; on a narrow one they wrap.
 *
 * Closed panels are hidden with hidden="until-found", so the browser's
 * find-in-page still finds their text, and opens the tab that holds it
 * ("beforematch"). A link to a tab (its HTML anchor), or to an element
 * inside one, opens that tab too.
 *
 * Loaded by block.json "viewScript", only on pages that contain the block.
 */
const ROOT = ".wp-block-codexa-blocks-tabs";
const LIST = ":scope > .wp-block-codexa-blocks-tabs__list";
const TABS = ":scope > [role='tab']";
const ITEMS =
	":scope > .wp-block-codexa-blocks-tabs__panels > .wp-block-codexa-blocks-tab";
const PANEL = ":scope > .wp-block-codexa-blocks-tab__panel";

/**
 * Sets up one Tabs block.
 *
 * @param {HTMLElement} root The block's wrapper.
 * @return {((target: Element) => Element|null)|undefined} Opens the tab holding an element (see the end of this function), or undefined when the markup is incomplete.
 */
function setUp(root) {
	const list = root.querySelector(LIST);
	const tabs = list ? [...list.querySelectorAll(TABS)] : [];
	const items = [...root.querySelectorAll(ITEMS)];
	const panels = items.map((item) => item.querySelector(PANEL));

	if (!tabs.length || tabs.length !== items.length || panels.includes(null)) {
		return undefined;
	}

	const vertical = list.getAttribute("aria-orientation") === "vertical";

	/**
	 * Opens a tab, showing its panel and hiding the others. The server prints
	 * the panels' roles and labels; this only changes which one is open.
	 *
	 * @param {number}  index Tab position.
	 * @param {boolean} focus Move keyboard focus to the tab.
	 */
	const select = (index, focus = false) => {
		panels.forEach((panel, position) => {
			const open = position === index;

			tabs[position].setAttribute("aria-selected", String(open));
			tabs[position].tabIndex = open ? 0 : -1;

			if (open) {
				panel.removeAttribute("hidden");
			} else {
				panel.setAttribute("hidden", "until-found");
			}
		});

		if (focus) {
			tabs[index].focus();
		}
	};

	list.addEventListener("click", (event) => {
		const index = tabs.indexOf(event.target.closest("[role='tab']"));

		if (index >= 0) {
			select(index);
		}
	});

	list.addEventListener("keydown", (event) => {
		const index = tabs.indexOf(event.target.closest("[role='tab']"));

		if (index < 0) {
			return;
		}

		// Left and right swap places in right-to-left languages.
		const rtl = window.getComputedStyle(list).direction === "rtl";
		const keys = vertical
			? { ArrowUp: -1, ArrowDown: 1 }
			: { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 };
		let next;

		if (event.key in keys) {
			next = (index + keys[event.key] + tabs.length) % tabs.length;
		} else if (event.key === "Home") {
			next = 0;
		} else if (event.key === "End") {
			next = tabs.length - 1;
		} else {
			return;
		}

		event.preventDefault();
		select(next, true);
	});

	panels.forEach((panel, index) =>
		panel.addEventListener("beforematch", () => select(index))
	);

	/**
	 * Opens the tab holding an element, if this block holds it.
	 *
	 * @param {Element} target The element a link points to.
	 * @return {Element|null} The target's tab in the bar to scroll to, when the
	 *                        target is one of this block's tabs, otherwise null.
	 */
	return (target) => {
		const index = items.findIndex((item) => item.contains(target));

		if (index < 0) {
			return null;
		}

		select(index);

		if (items[index] !== target) {
			return null;
		}

		return tabs[index];
	};
}

/**
 * Opens the tabs that hold the element the URL's #fragment points to.
 *
 * @param {Array<(target: Element) => Element|null>} openers One per Tabs block.
 */
function openHashTarget(openers) {
	let id;

	try {
		id = decodeURIComponent(window.location.hash.slice(1));
	} catch {
		return; // A malformed fragment, such as "#%E0".
	}

	const target = id ? document.getElementById(id) : null;

	if (!target) {
		return;
	}

	// Outer Tabs first, so a nested one opens inside an open tab. A link to
	// a tab itself scrolls to its label, so the tab bar is in view.
	let scrollTarget = target;

	openers.forEach((open) => {
		scrollTarget = open(target) ?? scrollTarget;
	});

	scrollTarget.scrollIntoView();
}

/**
 * Sets up every Tabs block on the page.
 */
function init() {
	const openers = [...document.querySelectorAll(ROOT)]
		.map((root) => setUp(root))
		.filter(Boolean);

	if (!openers.length) {
		return;
	}

	openHashTarget(openers);
	window.addEventListener("hashchange", () => openHashTarget(openers));
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}
