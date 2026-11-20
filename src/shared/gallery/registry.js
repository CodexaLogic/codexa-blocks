/**
 * Gallery types, the ways the Gallery block arranges its images.
 *
 * The Gallery block registers Grid, Masonry and Carousel. Another plugin
 * adds a type the same way from an editor script that depends on
 * "codexa-blocks-editor".
 *
 *     import { registerGalleryType } from "@codexa-blocks/editor";
 *
 *     registerGalleryType({
 *         name: "stacked",
 *         title: __("Stacked", "my-plugin"),
 *         picture: <SVG>…</SVG>,
 *         Preview: StackedPreview,
 *         Settings: StackedSettings,
 *         defaults: { gap: "1rem" },
 *     });
 *
 * The page needs the same type in PHP under the same name
 * (Blocks\Gallery\GalleryTypes), since the editor only previews it. Types
 * can register at any time, because the Gallery re-renders when one is added.
 */

/** A type's name in lowercase letters, digits and hyphens, as saved in the block. */
const NAME = /^[a-z][a-z0-9-]*$/;

/** Registered types, in the order they were added. */
const types = new Map();

/** Components re-rendered when a type is added (useGalleryTypes()). */
const listeners = new Set();

/** The current list, kept as one array so React sees a new value only on change. */
let snapshot = Object.freeze([]);

/**
 * Draws a type's images in the editor.
 *
 * @callback GalleryPreview
 * @param {Object}   props            Component props.
 * @param {Object[]} props.items      The images, in order, each with a key and its finished figure.
 * @param {Object}   props.attributes The Gallery block's attributes.
 * @param {Object}   props.settings   The type's own settings, its defaults with what the gallery saved.
 * @return {Element} The arranged images.
 */

/**
 * A type's own sidebar controls.
 *
 * @callback GallerySettings
 * @param {Object}                 props             Component props.
 * @param {Object}                 props.settings    The type's own settings, its defaults with what the gallery saved.
 * @param {(next: Object) => void} props.setSettings Saves changed settings, merged into the saved ones.
 * @param {Object}                 props.attributes  The Gallery block's attributes.
 * @return {Element} The controls.
 */

/**
 * Adds a gallery type.
 *
 * @param {Object}          type                       The type.
 * @param {string}          type.name                  Saved in the block's "type" attribute, e.g. "grid".
 * @param {string}          type.title                 Shown under its picture in the type picker.
 * @param {Element}         type.picture               A 48 by 32 SVG of the arrangement, drawn in currentColor.
 * @param {GalleryPreview}  type.Preview               Draws the images in the editor.
 * @param {GallerySettings} [type.Settings]            Its own sidebar controls.
 * @param {Object}          [type.defaults]            Starting values of its own settings.
 * @param {string}          [type.columnsLabel]        The Columns setting's name for this type, e.g. "Images in view".
 * @param {boolean}         [type.usesImageShape=true] Whether the gallery's Image shape crops the images. False keeps each image's own shape and hides the setting. Must match usesImageShape() of the type in PHP.
 * @return {boolean} False when the type is invalid or its name is taken.
 */
export function registerGalleryType(type) {
	if (
		!NAME.test(type?.name ?? "") ||
		typeof type.title !== "string" ||
		typeof type.Preview !== "function"
	) {
		// eslint-disable-next-line no-console -- Tells the developer of the type what is wrong.
		console.error(
			"Codexa Blocks: a gallery type needs a name (lowercase letters, digits and hyphens), a title and a Preview component.",
			type
		);
		return false;
	}

	if (types.has(type.name)) {
		// eslint-disable-next-line no-console -- Tells the developer of the type what is wrong.
		console.error(
			`Codexa Blocks: the gallery type "${type.name}" is already registered.`
		);
		return false;
	}

	types.set(
		type.name,
		Object.freeze({ defaults: {}, usesImageShape: true, ...type })
	);
	snapshot = Object.freeze([...types.values()]);
	listeners.forEach((listener) => listener());

	return true;
}

/**
 * @param {string} name A type's name.
 * @return {Object|undefined} The type, or undefined when none has that name.
 */
export const getGalleryType = (name) => types.get(name);

/** @return {readonly Object[]} Every registered type, in the order they were added. */
export const getGalleryTypes = () => snapshot;

/**
 * Calls a function whenever a type is added.
 *
 * @param {() => void} listener Called after each registration.
 * @return {() => void} Stops calling it.
 */
export function subscribeToGalleryTypes(listener) {
	listeners.add(listener);

	return () => listeners.delete(listener);
}
