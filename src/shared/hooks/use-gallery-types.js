/**
 * The registered gallery types, kept current, so a component re-renders
 * when a plugin registers a type later.
 */
import { useSyncExternalStore } from "@wordpress/element";

import {
	getGalleryTypes,
	subscribeToGalleryTypes,
} from "../gallery/registry.js";

/** @return {readonly Object[]} Every registered gallery type, in the order they were added. */
export const useGalleryTypes = () =>
	useSyncExternalStore(subscribeToGalleryTypes, getGalleryTypes);
