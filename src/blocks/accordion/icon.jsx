/**
 * The Accordion icon, an open item (header with an up chevron over one
 * line of content) above a closed one (header with a down chevron). 24 by
 * 24, drawn for this plugin.
 */
import { Path, SVG } from "@wordpress/primitives";

export const accordionIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			d="M2.5 3h19A1.5 1.5 0 0 1 23 4.5v8a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 1 12.5v-8A1.5 1.5 0 0 1 2.5 3ZM2.5 8.5h19v4h-19ZM4.5 9.75h10v1.5h-10ZM3.5 5h8v1.5h-8ZM17.6 6.9L19.5 5L21.4 6.9L20.5 7.8L19.5 6.8L18.5 7.8ZM2.5 15.5h19A1.5 1.5 0 0 1 23 17v2.5a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 1 19.5V17a1.5 1.5 0 0 1 1.5-1.5ZM3.5 17.5h8V19h-8ZM17.6 17.6L18.5 16.7L19.5 17.7L20.5 16.7L21.4 17.6L19.5 19.5Z"
		/>
	</SVG>
);
