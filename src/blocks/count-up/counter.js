/**
 * Number formatting and the count animation, shared by the editor preview
 * (edit.jsx) and the front end (view.js) so both count the same way.
 *
 * The server prints the final value (CodexaBlocks\Blocks\Render\CountUp),
 * formatted by the same rules as formatNumber() below.
 */

/**
 * Longest animation allowed. Motion that starts by itself must stop
 * within 5 seconds or offer a pause control (WCAG 2.2.2).
 * Must match CountUp::MAX_DURATION in PHP.
 */
export const MAX_DURATION = 5;

/** Most decimal places offered. Must match CountUp::MAX_DECIMALS in PHP. */
export const MAX_DECIMALS = 5;

/**
 * Formats a number with fixed decimals and the chosen separators.
 *
 * Mirrors PHP's number_format(), which the server uses for the final value.
 *
 * @param {number} value              The number.
 * @param {number} decimals           Decimal places, 0 to MAX_DECIMALS.
 * @param {string} decimalSeparator   "." or ",".
 * @param {string} thousandsSeparator ",", ".", " " or "".
 * @return {string} Formatted number.
 */
export function formatNumber(
	value,
	decimals,
	decimalSeparator,
	thousandsSeparator
) {
	const fixed = Math.abs(value).toFixed(decimals);
	const [whole, fraction] = fixed.split(".");
	const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
	const sign = value < 0 && Number(fixed) !== 0 ? "-" : "";

	return sign + grouped + (fraction ? decimalSeparator + fraction : "");
}

/**
 * Ease-out, fast at first and slowing into the final number.
 *
 * @param {number} progress 0 to 1.
 * @return {number} Eased progress, 0 to 1.
 */
const easeOutCubic = (progress) => 1 - (1 - progress) ** 3;

/**
 * Animates an element's text from one number to another.
 *
 * Ends on `finalText` exactly, so the last frame always matches the
 * server-rendered value, whatever floating-point rounding happened on the way.
 *
 * @param {HTMLElement} element                    Element whose text is the number.
 * @param {Object}      options                    Animation options.
 * @param {number}      options.start              First value.
 * @param {number}      options.end                Last value.
 * @param {number}      options.decimals           Decimal places.
 * @param {string}      options.decimalSeparator   Decimal separator.
 * @param {string}      options.thousandsSeparator Thousands separator.
 * @param {number}      options.duration           Seconds, capped at MAX_DURATION.
 * @param {string}      options.finalText          Text to end on.
 * @return {() => void} Cancels the animation and shows the final text.
 */
export function animateCount(element, options) {
	const { start, end, decimals, decimalSeparator, thousandsSeparator } =
		options;
	const duration =
		Math.min(Math.max(options.duration, 0), MAX_DURATION) * 1000;
	const view = element.ownerDocument.defaultView;
	let frame = 0;
	let startedAt = 0;

	const finish = () => {
		view.cancelAnimationFrame(frame);
		element.textContent = options.finalText;
	};

	if (duration === 0 || start === end) {
		finish();
		return finish;
	}

	const tick = (now) => {
		startedAt ||= now;
		const progress = Math.min((now - startedAt) / duration, 1);

		if (progress >= 1) {
			finish();
			return;
		}

		element.textContent = formatNumber(
			start + (end - start) * easeOutCubic(progress),
			decimals,
			decimalSeparator,
			thousandsSeparator
		);
		frame = view.requestAnimationFrame(tick);
	};

	element.textContent = formatNumber(
		start,
		decimals,
		decimalSeparator,
		thousandsSeparator
	);
	frame = view.requestAnimationFrame(tick);

	return finish;
}

/**
 * Whether the visitor asked the system for reduced motion.
 *
 * @param {Window} view The window to check (the editor canvas is an iframe).
 * @return {boolean} True to skip the animation.
 */
export const prefersReducedMotion = (view) =>
	view.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
