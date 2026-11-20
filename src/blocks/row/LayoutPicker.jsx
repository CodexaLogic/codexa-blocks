/**
 * A new Row's first view, a choice of column layouts drawn as diagrams
 * (LayoutDiagram.jsx). Picking one creates the columns.
 */
import { Button, Placeholder } from "@wordpress/components";
import { __, _n, sprintf } from "@wordpress/i18n";

import { rowIcon } from "./icon.jsx";
import { LayoutDiagram } from "./LayoutDiagram.jsx";
import { STARTER_LAYOUTS, describe, equalLayout } from "./layouts.js";

/**
 * @param {Object}                     props          Component props.
 * @param {(template: string) => void} props.onSelect Receives the chosen grid template.
 * @return {Element} The picker.
 */
export function LayoutPicker({ onSelect }) {
	return (
		<Placeholder
			icon={rowIcon}
			label={__("Row", "codexa-blocks")}
			instructions={__(
				"Choose a column layout. You can change it any time in the block settings.",
				"codexa-blocks"
			)}
			className="wp-block-codexa-blocks-row__picker"
		>
			<ul className="wp-block-codexa-blocks-row__layouts">
				{STARTER_LAYOUTS.map((template) => {
					const count = template.split(" ").length;
					const widths = describe(template);
					// Equal widths read better as a count, "3 columns" not "33% / 33% / 33%".
					const name =
						template === equalLayout(count)
							? sprintf(
									/* translators: %d: Number of columns. */
									_n(
										"%d column",
										"%d columns",
										count,
										"codexa-blocks"
									),
									count
								)
							: widths;

					return (
						<li key={template}>
							<Button
								className="wp-block-codexa-blocks-row__layout"
								onClick={() => onSelect(template)}
								label={sprintf(
									/* translators: 1: Number of columns. 2: Column widths, e.g. "67% / 33%". */
									_n(
										"%1$d column: %2$s",
										"%1$d columns: %2$s",
										count,
										"codexa-blocks"
									),
									count,
									widths
								)}
								showTooltip
							>
								<LayoutDiagram template={template} />
								<span aria-hidden="true">{name}</span>
							</Button>
						</li>
					);
				})}
			</ul>
		</Placeholder>
	);
}
