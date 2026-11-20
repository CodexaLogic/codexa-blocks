/**
 * One field for a link. Type an address (URL, email, phone, /path or
 * #section), or a title to search the site's posts.
 *
 * An address saves on Enter, blur or Ctrl+S (⌘S). No list opens while an
 * address is typed, even part way (isTypingAddress()). A search lists
 * published posts of every public post type with their type, so posts that
 * share a title can be told apart. It runs on the server (/wp/v2/search) a
 * quarter second after typing stops.
 *
 * Search text not chosen from the list is never saved. Leaving the field or
 * Escape restores the saved link, and emptying the field removes it.
 *
 * The input is an ARIA combobox. Up and Down move through results, Enter
 * picks one (the first is ready), Escape closes the list, and a second
 * Escape undoes the typing.
 */
import { speak } from "@wordpress/a11y";
import apiFetch from "@wordpress/api-fetch";
import { TextControl } from "@wordpress/components";
import { useDebounce, useInstanceId } from "@wordpress/compose";
import { store as coreStore } from "@wordpress/core-data";
import { useSelect } from "@wordpress/data";
import { useCallback, useMemo, useRef, useState } from "@wordpress/element";
import { decodeEntities } from "@wordpress/html-entities";
import { __, _n, sprintf } from "@wordpress/i18n";
import { isKeyboardEvent } from "@wordpress/keycodes";
import { addQueryArgs } from "@wordpress/url";

import {
	describeUrl,
	displayUrl,
	isTypingAddress,
	parseLinkInput,
} from "../utilities/link.js";

/** Most search results shown. */
const PER_PAGE = 20;

/** Shortest text that starts a search. */
const MIN_SEARCH = 2;

/**
 * A post's title as text, or a stand-in when it has none.
 *
 * @param {string} title The post's title, as HTML.
 * @return {string} The title.
 */
const titleText = (title) =>
	decodeEntities(title) || __("(no title)", "codexa-blocks");

/**
 * @param {Object}                  props          Component props.
 * @param {string}                  props.label    Field label.
 * @param {Object}                  props.value    The link, { postId, postType } for a post, { url } for an address, {} for none.
 * @param {(value: Object) => void} props.onChange Receives the new link in the same shape.
 * @return {Element} The field.
 */
export function LinkSearchControl({ label, value, onChange }) {
	const { postId, postType, url } = value;
	const listId = `codexa-link-search-${useInstanceId(LinkSearchControl)}`;

	// What's being typed, or null while the field shows the saved link.
	const [draft, setDraft] = useState(null);
	const [results, setResults] = useState([]);
	const [active, setActive] = useState(-1);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const latest = useRef(0);

	// Store values only. A list built here would be new on every call and
	// re-render the field on any store change, so typeNames is built below.
	const { postTypes, linkedPost } = useSelect(
		(select) => {
			const { getPostTypes, getEntityRecord } = select(coreStore);

			return {
				postTypes: getPostTypes({ per_page: -1 }),
				// Read as anyone who can see it may ("view"), so Authors and
				// Contributors see posts they can't edit.
				linkedPost:
					postId && postType
						? getEntityRecord("postType", postType, postId, {
								context: "view",
							})
						: null,
			};
		},
		[postId, postType]
	);

	const typeNames = useMemo(
		() =>
			Object.fromEntries(
				(postTypes ?? []).map((type) => [
					type.slug,
					type.labels?.singular_name ?? type.name,
				])
			),
		[postTypes]
	);

	const typeName = (slug) => typeNames[slug] ?? slug;

	/**
	 * Searches published posts of every public post type. Uses only state
	 * setters and a ref, so it never changes, and neither does the
	 * debounced version below (useDebounce() cancels it on unmount).
	 *
	 * @param {string} term What was typed.
	 */
	const search = useCallback(async (term) => {
		const request = ++latest.current;

		try {
			const found = await apiFetch({
				path: addQueryArgs("/wp/v2/search", {
					search: term,
					type: "post",
					per_page: PER_PAGE,
					_fields: "id,title,subtype",
				}),
			});

			// Only the newest search counts; an older one can finish later.
			if (request !== latest.current) {
				return;
			}

			setResults(found);
			setActive(found.length ? 0 : -1);
			setIsOpen(true);
			speak(
				found.length
					? sprintf(
							/* translators: %d: Number of search results. */
							_n(
								"%d result found, use up and down arrow keys to navigate.",
								"%d results found, use up and down arrow keys to navigate.",
								found.length,
								"codexa-blocks"
							),
							found.length
						)
					: __("No results.", "codexa-blocks")
			);
		} catch {
			if (request === latest.current) {
				setResults([]);
				setActive(-1);
			}
		} finally {
			if (request === latest.current) {
				setIsLoading(false);
			}
		}
	}, []);

	const debouncedSearch = useDebounce(search, 250);

	/** Drops what was typed and any search, showing the saved link again. */
	const reset = () => {
		debouncedSearch.cancel();
		latest.current++;
		setDraft(null);
		setResults([]);
		setActive(-1);
		setIsOpen(false);
		setIsLoading(false);
	};

	const address = draft === null ? null : parseLinkInput(draft);
	const isPartAddress = draft !== null && !address && isTypingAddress(draft);
	const isSearch =
		draft !== null && !address && !isPartAddress && draft.trim() !== "";
	const showList = isSearch && isOpen && results.length > 0;

	const onType = (text) => {
		setDraft(text);
		setIsOpen(false);
		debouncedSearch.cancel();
		latest.current++;

		// An address, the start of one, or a short text doesn't search.
		const term = text.trim();

		if (
			parseLinkInput(text) ||
			isTypingAddress(text) ||
			term.length < MIN_SEARCH
		) {
			setResults([]);
			setActive(-1);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		debouncedSearch(term);
	};

	/**
	 * Links to a search result.
	 *
	 * @param {Object} result A /wp/v2/search result.
	 */
	const choose = (result) => {
		onChange({ postId: result.id, postType: result.subtype });
		reset();
	};

	/**
	 * Saves what was typed when it's an address, or removes the link when
	 * the field was emptied. Search text that wasn't chosen is dropped.
	 */
	const commit = () => {
		if (draft === null) {
			return;
		}

		if (draft.trim() === "") {
			if (postId || url) {
				onChange({});
			}
		} else if (address && (address.url !== url || postId)) {
			onChange({ url: address.url });
		}

		reset();
	};

	const onKeyDown = (event) => {
		// Saving the post doesn't move focus, so the field saves first. The
		// editor's own shortcut handler runs after this one.
		if (isKeyboardEvent.primary(event, "s")) {
			commit();
			return;
		}

		switch (event.key) {
			case "ArrowDown":
			case "ArrowUp":
				if (showList) {
					event.preventDefault();
					const step = event.key === "ArrowDown" ? 1 : -1;
					setActive(
						(active + step + results.length) % results.length
					);
				}
				break;
			case "Enter":
				if (showList && active >= 0) {
					event.preventDefault();
					choose(results[active]);
				} else if (draft !== null) {
					event.preventDefault();
					commit();
				}
				break;
			case "Escape":
				// Handled here, so a popover around the field stays open.
				if (showList) {
					event.preventDefault();
					event.stopPropagation();
					setIsOpen(false);
				} else if (draft !== null) {
					event.preventDefault();
					event.stopPropagation();
					reset();
				}
				break;
			default:
				break;
		}
	};

	// What the field shows while nothing is being typed.
	let saved = "";

	if (postId) {
		saved = linkedPost
			? titleText(linkedPost.title?.rendered ?? "")
			: sprintf(
					/* translators: %d: Post ID. */
					__("Post %d", "codexa-blocks"),
					postId
				);
	} else if (url) {
		saved = displayUrl(url);
	}

	// One line under the field, saying what it holds or what Enter does.
	let help = __(
		"Paste a URL, email address or phone number, or type a title to search this site.",
		"codexa-blocks"
	);

	if (address) {
		help = sprintf(
			/* translators: %s: The typed address and its kind, e.g. "name@example.com (Email)". */
			__(
				"%s: saved when you press Enter or leave the field.",
				"codexa-blocks"
			),
			describeUrl(address.url, draft.trim())
		);
	} else if (isPartAddress) {
		help = __(
			"Keep typing: this isn't a whole address yet, so it isn't saved.",
			"codexa-blocks"
		);
	} else if (isSearch && isLoading) {
		help = __("Searching…", "codexa-blocks");
	} else if (isSearch && isOpen && !results.length) {
		help = __(
			"No published posts match. To link to another site, type the whole address.",
			"codexa-blocks"
		);
	} else if (showList) {
		help = __(
			"Choose a result to link to it. Text typed here isn't saved on its own.",
			"codexa-blocks"
		);
	} else if (draft === null && postId) {
		help = sprintf(
			/* translators: %s: Post type name, e.g. "Page". */
			__(
				"Linked to this %s. The link updates if its address changes.",
				"codexa-blocks"
			),
			typeName(postType)
		);
	} else if (draft === null && url) {
		help = sprintf(
			/* translators: %s: The address and its kind, e.g. "name@example.com (Email)". */
			__("Linked to %s.", "codexa-blocks"),
			describeUrl(url)
		);
	}

	return (
		<div className="codexa-link-search">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={label}
				help={help}
				value={draft ?? saved}
				onChange={onType}
				onKeyDown={onKeyDown}
				onBlur={commit}
				autoComplete="off"
				spellCheck={false}
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={showList}
				aria-controls={listId}
				aria-activedescendant={
					showList && active >= 0 ? `${listId}-${active}` : undefined
				}
			/>
			{showList && (
				<ul
					id={listId}
					role="listbox"
					aria-label={label}
					className="codexa-link-search__results"
					// Keeps focus in the field, so picking a result doesn't
					// blur it first.
					onMouseDown={(event) => event.preventDefault()}
				>
					{results.map((result, index) => (
						// The input handles the keyboard (aria-activedescendant),
						// so the options take clicks only.
						// eslint-disable-next-line jsx-a11y/click-events-have-key-events
						<li
							key={`${result.subtype}:${result.id}`}
							id={`${listId}-${index}`}
							role="option"
							aria-selected={index === active}
							className="codexa-link-search__result"
							onMouseEnter={() => setActive(index)}
							onClick={() => choose(result)}
						>
							<span className="codexa-link-search__title">
								{titleText(result.title)}
							</span>
							<span className="codexa-link-search__type">
								{typeName(result.subtype)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
