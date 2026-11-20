/**
 * Records fetched by ID, however many there are.
 *
 * The REST API returns at most 100 records per request, so a list of more
 * IDs is asked for in groups of 100 and the answers joined.
 */
import { store as coreStore } from "@wordpress/core-data";
import { useSelect } from "@wordpress/data";
import { useMemo } from "@wordpress/element";

/** The REST API's most records per request. */
const PER_REQUEST = 100;

/**
 * The IDs in groups the REST API accepts.
 *
 * @param {number[]} ids Record IDs.
 * @return {number[][]} Groups of at most PER_REQUEST IDs, in order.
 */
function groups(ids) {
	const result = [];

	for (let start = 0; start < ids.length; start += PER_REQUEST) {
		result.push(ids.slice(start, start + PER_REQUEST));
	}

	return result;
}

/**
 * Fetches records by ID in groups of 100, the REST API's most per request,
 * and joins them.
 *
 * @param {string}   kind  Entity kind, e.g. "postType" or "taxonomy".
 * @param {string}   name  Entity name, e.g. "attachment" or "category".
 * @param {number[]} ids   IDs of the records to fetch.
 * @param {Object}   query Other query arguments, e.g. { context: "view" }.
 * @return {Object[]|null} The records found, in no set order, or null while any group is still loading. An empty list when ids is empty.
 */
export function useRecordsById(kind, name, ids, query = {}) {
	// Each ID once and in number order, so reordering or repeating an item
	// asks for nothing new. As strings, so a new array or object with the
	// same contents doesn't refetch either.
	const idsKey = [...new Set(ids)].sort((a, b) => a - b).join(",");
	const queryKey = JSON.stringify(query);

	// Each group's answer comes from the store's cache, so the array holds
	// the same lists until one changes and useSelect returns it unchanged.
	const pages = useSelect(
		(select) =>
			groups(idsKey ? idsKey.split(",").map(Number) : []).map((group) =>
				select(coreStore).getEntityRecords(kind, name, {
					...query,
					include: group,
					per_page: group.length,
				})
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[kind, name, idsKey, queryKey]
	);

	return useMemo(
		() => (pages.some((page) => !page) ? null : pages.flat()),
		[pages]
	);
}
