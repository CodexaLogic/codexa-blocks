/**
 * Adds a direct-access check to the PHP files the build writes.
 *
 * wp-scripts writes build/blocks/blocks-manifest.php and an .asset.php file
 * for each script, and none of them check ABSPATH. WordPress.org requires
 * that check in every PHP file that runs code, and these are rewritten on
 * every build, so this adds it after each build instead of by hand.
 *
 * A file that already has the check is left as it is, so running it twice
 * changes nothing. npm run build runs it last, and scripts/bundle.mjs
 * checks the zip has no PHP file without it.
 *
 * Run it with node scripts/guard-build-php.mjs.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Where the build writes. */
const BUILD = "build";

/** The check, placed right after the opening tag. */
const GUARD = "if (!defined('ABSPATH')) {\n\texit;\n}\n\n";

/** A file that already checks ABSPATH. */
const GUARDED = /defined\(\s*['"]ABSPATH['"]\s*\)/;

/** The opening tag and the space after it. */
const OPEN_TAG = /^<\?php\s*/;

/**
 * Every PHP file in a folder and its subfolders.
 *
 * @param {string} folder The folder.
 * @return {string[]} The files' paths.
 */
function phpFiles(folder) {
	return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
		const path = join(folder, entry.name);

		if (entry.isDirectory()) {
			return phpFiles(path);
		}

		return entry.name.endsWith(".php") ? [path] : [];
	});
}

let added = 0;

for (const file of phpFiles(BUILD)) {
	const code = readFileSync(file, "utf8");

	if (GUARDED.test(code) || !OPEN_TAG.test(code)) {
		continue;
	}

	writeFileSync(file, code.replace(OPEN_TAG, `<?php\n${GUARD}`));
	added++;
}

process.stdout.write(`Direct-access check added to ${added} PHP files.\n`);
