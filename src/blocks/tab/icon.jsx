/**
 * The Tab icon, one open tab joined to a panel with two lines of text. 24
 * by 24, drawn for this plugin.
 */
import { Path, SVG } from "@wordpress/primitives";

export const tabIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			d="M2.5 4H7.5A1.5 1.5 0 0 1 9 5.5V6.5H21.5A1.5 1.5 0 0 1 23 8V18.5A1.5 1.5 0 0 1 21.5 20H2.5A1.5 1.5 0 0 1 1 18.5V5.5A1.5 1.5 0 0 1 2.5 4ZM3 5.5H7.5V8H21a.5.5 0 0 1 .5.5V18a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5ZM4.5 11.5h15V13h-15ZM4.5 14.5h10V16h-10Z"
		/>
	</SVG>
);
