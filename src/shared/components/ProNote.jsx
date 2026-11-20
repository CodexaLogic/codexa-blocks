/**
 * A note that a feature is in Codexa Blocks Pro. A "Pro" badge and a
 * short title come first, then an optional description and a Learn more
 * link.
 *
 * Show it only while Pro hasn't filled the feature's slot, so it never
 * shows to someone who has Pro.
 */
import { Icon, lock } from "@wordpress/icons";
import { __ } from "@wordpress/i18n";

/**
 * @param {Object} props               Component props.
 * @param {string} [props.title]       Short phrase next to the badge.
 * @param {string} [props.description] What the feature does, above the badge.
 * @return {Element} The note.
 */
export function ProNote({
	title = __("Available in Pro", "codexa-blocks"),
	description = "",
}) {
	// Printed by CodexaBlocks\Blocks\EditorAssets::enqueue().
	const url = window.codexaBlocksProUrl ?? "";

	return (
		<div className="codexa-pro-note">
			<div className="codexa-pro-note__line">
				<span className="codexa-pro-note__badge">
					<Icon icon={lock} size={14} />
					{__("Pro", "codexa-blocks")}
				</span>
				<span>{title}</span>
			</div>
			{description && (
				<p className="codexa-pro-note__description">{description}</p>
			)}
			{url && (
				<a
					className="codexa-pro-note__link"
					href={url}
					target="_blank"
					rel="noopener noreferrer"
				>
					{__("Learn more", "codexa-blocks")}
					<span className="screen-reader-text">
						{" "}
						{__("(opens in a new tab)", "codexa-blocks")}
					</span>
					<span aria-hidden="true">&rarr;</span>
				</a>
			)}
		</div>
	);
}
