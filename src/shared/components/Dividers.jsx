/**
 * A block's dividers, drawn as on the page (Dividers::markup() in PHP),
 * from what dividerStyles() worked out.
 */
import { DIVIDER_VIEW_BOX } from "../utilities/dividers.js";

/**
 * @param {Object}        props          Component props.
 * @param {Array<Object>} props.dividers From dividerStyles().
 * @return {Element} The dividers.
 */
export function Dividers({ dividers }) {
	return dividers.map(({ edge, className, style, path }) => (
		<div key={edge} className={className} style={style} aria-hidden="true">
			<svg
				className="codexa-divider__shape"
				viewBox={DIVIDER_VIEW_BOX}
				preserveAspectRatio="none"
				focusable="false"
			>
				<path d={path} />
			</svg>
		</div>
	));
}
