/**
 * The admin bundle, the Colors app (Codexa Blocks > Colors) and the
 * admin page styles. Built by wp-scripts into build/admin and loaded by
 * CodexaBlocks\Admin\AdminPage.
 */
import domReady from "@wordpress/dom-ready";
import { createRoot } from "@wordpress/element";

import { ColorsApp } from "./ColorsApp.jsx";
import { resolvePalette } from "./theme-palette.js";
import "./admin.scss";

domReady(() => {
	const root = document.getElementById("codexa-colors-app");

	if (!root || !window.codexaBlocksColors) {
		return;
	}

	const { themeStyles, ...settings } = window.codexaBlocksColors;
	const palette = resolvePalette(settings.palette, themeStyles);
	const preview = document.getElementById("codexa-colors-preview");

	// The preview also needs the theme's background and any palette color a
	// block uses, which the admin can't resolve on its own.
	palette.forEach(({ slug, color }) => {
		preview?.style.setProperty(`--wp--preset--color--${slug}`, color);
	});

	createRoot(root).render(
		<ColorsApp
			{...settings}
			palette={palette}
			preview={preview}
			toolbar={document.getElementById("codexa-colors-toolbar")}
		/>
	);
});
