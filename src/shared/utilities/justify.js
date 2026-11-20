/**
 * WordPress's justification toolbar (JustifyContentControl) calls two of
 * its values left and right. This plugin saves the CSS values, start and
 * end, which also follow right-to-left languages. These translate between
 * the two; center, space-between and stretch are the same in both.
 */

const TO_TOOLBAR = Object.freeze({ start: "left", end: "right" });
const FROM_TOOLBAR = Object.freeze({ left: "start", right: "end" });

/**
 * Saved alignment => the toolbar's value.
 *
 * @param {string|undefined} value Saved value, e.g. "start".
 * @return {string|undefined} The toolbar's value, e.g. "left".
 */
export const toJustifyToolbar = (value) => TO_TOOLBAR[value] ?? value;

/**
 * The toolbar's value => saved alignment.
 *
 * @param {string|undefined} value The toolbar's value, e.g. "left", or undefined when cleared.
 * @return {string|undefined} The value to save, e.g. "start".
 */
export const fromJustifyToolbar = (value) => FROM_TOOLBAR[value] ?? value;
