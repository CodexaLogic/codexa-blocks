/**
 * Front-end behavior for the Count Up block.
 *
 * The server prints the final number, so without this script (or with
 * reduced motion) visitors, search engines and screen readers simply get
 * the real value. With it, each counter starts its count when a quarter of
 * it scrolls into view, once.
 *
 * For screen readers the animated digits are hidden and a stable copy of
 * the final text is read instead, so nobody hears "1,0 4 7..." mid-count.
 *
 * Loaded by block.json "viewScript", only on pages that contain the block.
 */
import { animateCount, formatNumber, prefersReducedMotion } from "./counter.js";

const NUMBER = ".wp-block-codexa-blocks-count-up__number";
const VALUE = ".wp-block-codexa-blocks-count-up__value";

/**
 * Reads one counter's settings from its data attributes.
 *
 * @param {HTMLElement} number The number element.
 * @return {Object} Options for animateCount().
 */
function readOptions(number) {
	const {
		start,
		end,
		decimals,
		duration,
		decimalSeparator,
		thousandsSeparator,
	} = number.dataset;

	return {
		start: Number(start) || 0,
		end: Number(end) || 0,
		decimals: Number(decimals) || 0,
		duration: Number(duration) || 0,
		decimalSeparator: decimalSeparator ?? ".",
		thousandsSeparator: thousandsSeparator ?? "",
	};
}

/**
 * Hides the moving digits from screen readers and adds the final text.
 *
 * @param {HTMLElement} number The number element.
 */
function addAccessibleCopy(number) {
	const copy = number.ownerDocument.createElement("span");

	copy.className = "wp-block-codexa-blocks-count-up__label";
	copy.textContent = number.textContent.trim();
	number.setAttribute("aria-hidden", "true");
	number.after(copy);
}

/**
 * Sets up every counter on the page.
 */
function init() {
	const numbers = [...document.querySelectorAll(NUMBER)];

	if (!numbers.length || prefersReducedMotion(window)) {
		return;
	}

	const observer = new window.IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) {
					continue;
				}

				observer.unobserve(entry.target);

				const value = entry.target.querySelector(VALUE);

				animateCount(value, {
					...readOptions(entry.target),
					finalText: value.dataset.finalText,
				});
			}
		},
		{ threshold: 0.25 }
	);

	for (const number of numbers) {
		const value = number.querySelector(VALUE);

		if (!value) {
			continue;
		}

		const options = readOptions(number);

		addAccessibleCopy(number);
		value.dataset.finalText = value.textContent;
		// Show the start value until the counter scrolls into view.
		value.textContent = formatNumber(
			options.start,
			options.decimals,
			options.decimalSeparator,
			options.thousandsSeparator
		);
		observer.observe(number);
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}
