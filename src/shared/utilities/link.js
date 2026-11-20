/**
 * Reading and describing links typed into a link field.
 *
 * A link is saved in one of two ways.
 * - To a post, { postId: 12, postType: "page" }, so it follows the post's
 *   address. PHP looks it up when the page is built (Utilities\Link).
 * - To an address, { url: "https://…" }, "mailto:…", "tel:…", "/path" or
 *   "#section". A "fax:" number is saved as "tel:", since no browser opens
 *   "fax:" links.
 */
import { __, _x, sprintf } from "@wordpress/i18n";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A phone number, an optional + then digits, spaces, dots, dashes and brackets, with 7 to 15 digits. */
const PHONE = /^\+?[\d\s().-]+$/;

/** A web address someone typed without https://, such as "example.com/page". */
const BARE_DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]\S*)?$/i;

/** Starts of addresses, which someone may be part way through typing. */
const ADDRESS_STARTS = [
	"https://",
	"http://",
	"mailto:",
	"tel:",
	"fax:",
	"www.",
];

/** A scheme and what follows it, with no space yet, e.g. "sms:" or "ftp://ex". */
const SCHEME = /^[a-z][a-z\d+.-]*:\S*$/i;

/** A phone number being typed, digits, spaces, dots, dashes and brackets, maybe after a +. */
const PHONE_START = /^\+?[\s(]*(?:\d[\d\s().-]*)?$/;

/**
 * Reads what someone typed into the link field as an address.
 *
 * @param {string} text What was typed.
 * @return {{url: string, kind: string}|null} The address to save and its kind ("url", "email", "phone", "anchor"), or null when the text isn't an address (it's a search).
 */
export function parseLinkInput(text) {
	const value = text.trim();

	if (/^mailto:\S+$/i.test(value)) {
		return { url: value, kind: "email" };
	}

	if (/^tel:\S+$/i.test(value)) {
		return { url: value, kind: "phone" };
	}

	if (/^fax:\S+$/i.test(value)) {
		return { url: `tel:${value.slice(4)}`, kind: "phone" };
	}

	if (EMAIL.test(value)) {
		return { url: `mailto:${value}`, kind: "email" };
	}

	if (PHONE.test(value)) {
		const digits = value.replace(/\D/g, "");

		return digits.length >= 7 && digits.length <= 15
			? {
					url: `tel:${value.startsWith("+") ? "+" : ""}${digits}`,
					kind: "phone",
				}
			: null;
	}

	if (/^https?:\/\/\S+$/i.test(value) || /^\/(?!\/)\S*$/.test(value)) {
		return { url: value, kind: "url" };
	}

	if (/^#[\w:.-]+$/.test(value)) {
		return { url: value, kind: "anchor" };
	}

	if (BARE_DOMAIN.test(value)) {
		return { url: `https://${value}`, kind: "url" };
	}

	return null;
}

/**
 * Whether what's typed so far starts an address rather than a search, so no
 * search list opens for it.
 *
 * @param {string} text What was typed.
 * @return {boolean} Whether it looks like an address being typed.
 */
export function isTypingAddress(text) {
	const value = text.trim().toLowerCase();

	if (value === "") {
		return false;
	}

	return (
		ADDRESS_STARTS.some(
			(start) => start.startsWith(value) || value.startsWith(start)
		) ||
		SCHEME.test(value) ||
		/^\S*@\S*$/.test(value) ||
		PHONE_START.test(value) ||
		/^[/#]/.test(value)
	);
}

const KIND_LABELS = {
	url: __("URL", "codexa-blocks"),
	email: __("Email", "codexa-blocks"),
	phone: __("Phone", "codexa-blocks"),
	anchor: __("Section on this page", "codexa-blocks"),
};

/**
 * An address as the link field shows it, without mailto: or tel:, as it
 * was most likely typed. parseLinkInput() reads it back the same.
 *
 * @param {string} url The address, e.g. "mailto:name@example.com".
 * @return {string} e.g. "name@example.com".
 */
export const displayUrl = (url) => url.replace(/^(?:mailto|tel):/i, "");

/**
 * Describes an address for the link field, e.g. "name@example.com (Email)".
 *
 * @param {string} url    The address.
 * @param {string} [text] What to show for it (displayUrl() by default), so
 *                        "916-555-5555" isn't shown as "9165555555".
 * @return {string} The address and its kind.
 */
export function describeUrl(url, text = displayUrl(url)) {
	let kind = "url";

	if (/^mailto:/i.test(url)) {
		kind = "email";
	} else if (/^tel:/i.test(url)) {
		kind = "phone";
	} else if (url.startsWith("#")) {
		kind = "anchor";
	}

	return sprintf(
		/* translators: 1: A link address. 2: Its kind, e.g. "Email". */
		_x("%1$s (%2$s)", "link address (link kind)", "codexa-blocks"),
		text,
		KIND_LABELS[kind]
	);
}

/**
 * Cleans a section ID like core's HTML anchor field, removing #, turning
 * spaces into dashes and keeping only letters, digits and _ : . -
 * (the same set as Link::anchor() in PHP).
 *
 * @param {string} text What was typed.
 * @return {string} The ID, e.g. "our-team".
 */
export const cleanAnchor = (text) =>
	text
		.replace(/^#/, "")
		.replace(/\s+/g, "-")
		.replace(/[^\w:.-]/g, "");
