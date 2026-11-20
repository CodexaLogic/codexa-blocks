/**
 * Rising bars under an arrow that curves gently upward. The arrow's shaft
 * is a stroke along one curve, which a fill would need many points to
 * draw; the bars, base and arrowhead are filled.
 */
import { Path, SVG } from "@wordpress/primitives";

export const countUpIcon = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M1 20h22v1.5H1ZM2.5 17.5h4V13.5h-4ZM10 17.5h4V11h-4ZM17.5 17.5h4V8.5h-4ZM21.68 2.26L19.42 6.47L16.91 2.62Z" />
		<Path
			d="M2.5 10.5C8 8.6 15 6.6 19 4"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</SVG>
);
