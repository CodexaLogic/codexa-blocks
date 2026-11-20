/**
 * The Accordion Item icon, one open item with a solid header (title and up
 * chevron) over two lines of content. 24 by 24, drawn for this plugin.
 */
import { Path, SVG } from "@wordpress/primitives";

export const accordionItemIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			d="M2.5 3.5h19A1.5 1.5 0 0 1 23 5v14a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 1 19V5a1.5 1.5 0 0 1 1.5-1.5ZM2.5 9.5h19V19h-19ZM3.5 5.75h8v1.5h-8ZM17.6 7.4L19.5 5.5L21.4 7.4L20.5 8.3L19.5 7.3L18.5 8.3ZM4.5 11.75h13v1.5h-13ZM4.5 14.75h9v1.5h-9Z"
		/>
	</SVG>
);
