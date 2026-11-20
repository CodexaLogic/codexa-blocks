/**
 * The Gallery icon, one large picture (a mountain and the sun) beside two
 * smaller ones stacked. 24 by 24, drawn for this plugin.
 */
import { Path, SVG } from "@wordpress/primitives";

export const galleryIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			d="M2.5 4h10A1.5 1.5 0 0 1 14 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 1 18.5v-13A1.5 1.5 0 0 1 2.5 4ZM3 17.5L6.75 11.5L9.5 15.5L10.75 13.75L12 17.5ZM9.25 8.25a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0ZM17 4h4.5A1.5 1.5 0 0 1 23 5.5v5a1.5 1.5 0 0 1-1.5 1.5H17a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 17 4ZM17 13h4.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H17a1.5 1.5 0 0 1-1.5-1.5v-4a1.5 1.5 0 0 1 1.5-1.5Z"
		/>
	</SVG>
);
