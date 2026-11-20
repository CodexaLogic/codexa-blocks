/**
 * Writes the translation template, languages/codexa-blocks.pot, with
 * WP-CLI's make-pot. npm run bundle runs it after the build, so the
 * template in the zip always matches the zip's code.
 *
 * It reads the PHP, every block.json and the built JavaScript in build/
 * (the files that ship), not src/. The creation date is left empty, so the
 * file only changes, and only shows up in Git, when a string changes.
 *
 * Uses the project's own WP-CLI (vendor/bin/wp, from
 * `composer require --dev wp-cli/i18n-command`), or a `wp` on the PATH.
 * make-pot downloads WordPress's list of translatable block.json fields,
 * so it needs an internet connection.
 *
 * Run it with npm run pot.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/** The plugin's slug and text domain. */
const SLUG = "codexa-blocks";

/** Folders make-pot skips, such as sources, tools and anything not shipped. */
const EXCLUDE = [
	"src",
	"node_modules",
	"vendor",
	"packaged",
	"scripts",
	"tests",
];

/** WP-CLI, the project's own copy first, then one on the PATH. */
const WP = existsSync("vendor/bin/wp") ? "vendor/bin/wp" : "wp";

try {
	execFileSync(
		WP,
		[
			"i18n",
			"make-pot",
			".",
			`languages/${SLUG}.pot`,
			`--slug=${SLUG}`,
			`--domain=${SLUG}`,
			`--exclude=${EXCLUDE.join(",")}`,
			'--headers={"POT-Creation-Date":""}',
		],
		{ stdio: "inherit" }
	);
} catch (error) {
	const hint =
		error.code === "ENOENT"
			? "WP-CLI wasn't found. Run: composer require --dev wp-cli/i18n-command"
			: "make-pot failed; see the message above. It needs an internet connection.";

	process.stderr.write(`\n✖ ${hint}\n\n`);
	process.exit(1);
}
