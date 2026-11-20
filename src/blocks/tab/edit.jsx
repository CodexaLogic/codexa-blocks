/**
 * Tab editor, the tab's content. Labels are typed in the Tabs bar, so this
 * shows only the content of the active tab ("codexa-blocks/activeTab"
 * context). Others are hidden, not removed, so they stay in List View.
 */
import { useBlockProps, useInnerBlocksProps } from "@wordpress/block-editor";

/**
 * @param {Object} props          Block edit props.
 * @param {string} props.clientId This block's editor ID.
 * @param {Object} props.context  Context from the Tabs block.
 * @return {Element} The editor view.
 */
export function Edit({ clientId, context }) {
	const isActive = context["codexa-blocks/activeTab"] === clientId;

	const blockProps = useBlockProps({
		className: isActive ? undefined : "is-inactive",
	});
	const innerBlocksProps = useInnerBlocksProps(
		{ className: "wp-block-codexa-blocks-tab__panel" },
		{ template: [["core/paragraph"]] }
	);

	return (
		<div {...blockProps}>
			<div {...innerBlocksProps} />
		</div>
	);
}
