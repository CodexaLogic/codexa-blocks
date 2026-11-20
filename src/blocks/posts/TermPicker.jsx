/**
 * A field for picking terms of one taxonomy, e.g. categories.
 *
 * Suggestions come from the REST API as the user types, 20 at a time, the
 * most used first, and the chosen terms are fetched by ID, so the field
 * stays quick on sites with thousands of terms. The block saves term IDs,
 * so renaming a term doesn't break the filter.
 */
import { FormTokenField } from "@wordpress/components";
import { useDebounce } from "@wordpress/compose";
import { store as coreStore } from "@wordpress/core-data";
import { useSelect } from "@wordpress/data";
import { useState } from "@wordpress/element";
import { decodeEntities } from "@wordpress/html-entities";

import { useRecordsById } from "@codexa-blocks/editor";

/** Most suggestions shown. */
const SUGGESTIONS = 20;

/** The fields each term needs. */
const FIELDS = "id,name";

/** One empty list, so the selector returns the same value while nothing loads. */
const EMPTY = Object.freeze([]);

/**
 * @param {Object}                  props          Component props.
 * @param {string}                  props.label    Field label, e.g. "Categories".
 * @param {string}                  props.taxonomy Taxonomy slug.
 * @param {number[]}                props.value    Chosen term IDs.
 * @param {(ids: number[]) => void} props.onChange Receives the new term IDs.
 * @return {Element} The field.
 */
export function TermPicker({ label, taxonomy, value, onChange }) {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(setSearch, 250);

	// Fetched in groups of 100, the REST API's most, however many are chosen.
	const chosen =
		useRecordsById("taxonomy", taxonomy, value, {
			_fields: FIELDS,
			context: "view",
		}) ?? EMPTY;

	const suggestions = useSelect(
		(select) =>
			select(coreStore).getEntityRecords("taxonomy", taxonomy, {
				search,
				per_page: SUGGESTIONS,
				orderby: "count",
				order: "desc",
				_fields: FIELDS,
				context: "view",
			}) ?? EMPTY,
		[taxonomy, search]
	);

	const nameOf = (term) => decodeEntities(term.name);
	const known = [...chosen, ...suggestions];

	/**
	 * Turns the field's names back into IDs. A typed name that isn't a term is
	 * dropped, since the filter only uses terms that exist.
	 *
	 * @param {Array<string|{value: string}>} tokens The field's tokens.
	 */
	const change = (tokens) => {
		const ids = tokens
			.map((token) => {
				const name = typeof token === "string" ? token : token.value;

				return known.find((term) => nameOf(term) === name)?.id;
			})
			.filter(Boolean);

		onChange([...new Set(ids)]);
	};

	return (
		<FormTokenField
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={label}
			value={chosen.map(nameOf)}
			suggestions={suggestions.map(nameOf)}
			onInputChange={debouncedSearch}
			onChange={change}
		/>
	);
}
