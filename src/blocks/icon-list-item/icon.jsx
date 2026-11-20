/**
 * The Icon List Item block's icon, one row of the Icon List's icon, a
 * small solid circle with a line of text beside it. 24 by 24, like
 * WordPress's icons.
 */
import { Path, SVG } from "@wordpress/primitives";

export const iconListItemIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M5 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm5.25 1.75h10a.75.75 0 0 1 0 1.5h-10a.75.75 0 0 1 0-1.5Z" />
	</SVG>
);
