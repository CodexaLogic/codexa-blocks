/**
 * The image shapes a block can crop to, for the Gallery and the Posts.
 * Must match ResponsiveImages::SHAPES in PHP, $image-shapes in
 * _mixins.scss and the enum in each block.json that uses them.
 */
import { __ } from "@wordpress/i18n";

/** Image shapes, in the order the setting lists them. */
export const IMAGE_SHAPES = Object.freeze([
	"original",
	"1-1",
	"3-2",
	"4-3",
	"16-9",
	"2-3",
	"3-4",
]);

const LABELS = {
	original: __("Original", "codexa-blocks"),
	"1-1": __("Square (1:1)", "codexa-blocks"),
	"3-2": __("Landscape (3:2)", "codexa-blocks"),
	"4-3": __("Landscape (4:3)", "codexa-blocks"),
	"16-9": __("Wide (16:9)", "codexa-blocks"),
	"2-3": __("Portrait (2:3)", "codexa-blocks"),
	"3-4": __("Portrait (3:4)", "codexa-blocks"),
};

/** The shapes as SelectControl options. */
export const IMAGE_SHAPE_OPTIONS = Object.freeze(
	IMAGE_SHAPES.map((value) => ({ label: LABELS[value], value }))
);

/**
 * A saved image shape, or the fallback when it isn't one. Mirrors
 * ResponsiveImages::shape() in PHP.
 *
 * @param {string|undefined} value    Saved value.
 * @param {string}           fallback Shape to use otherwise.
 * @return {string} e.g. "3-2".
 */
export const imageShape = (value, fallback = "3-2") =>
	IMAGE_SHAPES.includes(value) ? value : fallback;
