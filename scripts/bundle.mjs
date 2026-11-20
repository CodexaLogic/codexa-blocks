/**
 * Builds the plugin and packs it into the zip that goes to WordPress.org.
 *
 * 1. Checks that every version number matches (the plugin header, the
 *    CODEXA_BLOCKS_VERSION constant, readme.txt's Stable tag,
 *    package.json and every block.json) and that readme.txt and LICENSE
 *    exist. Anything wrong stops it before the build.
 * 2. Runs npm run build, then npm run pot to write the translation
 *    template from the build, then checks the build's main files and the
 *    template exist.
 * 3. Checks that no file going into the zip has Codexa Blocks Pro's
 *    code (see findProCode()), because premium code can't ship in a
 *    WordPress.org plugin, and that every PHP file going into it checks
 *    for direct access (see findUnguardedPhp()), because WordPress.org
 *    requires it.
 * 4. Zips every file .distignore doesn't exclude into
 *    packaged/codexa-blocks-X.Y.Z.zip, inside a codexa-blocks/ folder,
 *    so it installs as wp-content/plugins/codexa-blocks/.
 *
 * Run it with npm run bundle.
 */

import { execSync } from "node:child_process";
import {
	createWriteStream,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
} from "node:fs";
import { ZipArchive } from "archiver";

/** The plugin's slug, its folder in the zip and the start of the zip's name. */
const SLUG = "codexa-blocks";

/** WordPress.org refuses a larger upload. */
const MAX_ZIP_BYTES = 10 * 1024 * 1024;

/** Files WordPress.org requires in the zip, checked before the build. */
const REQUIRED_SOURCE = [`${SLUG}.php`, "readme.txt", "LICENSE", ".distignore"];

/**
 * Files the build and npm run pot must write. Without them the blocks
 * won't load and the plugin can't be translated.
 */
const REQUIRED_BUILD = [
	"build/blocks/blocks-manifest.php",
	"build/editor/index.js",
	"build/editor/index.asset.php",
	"build/assets/common/css/common.css",
	`languages/${SLUG}.pot`,
];

/**
 * Pro's text domain as a quoted string, as it would appear in built
 * JavaScript, block.json or CSS. Free only mentions Pro in comments and
 * in addresses (PRO_URL), never as this exact string.
 */
const PRO_TEXT_DOMAIN = /(["'])codexa-blocks-pro\1/;

/**
 * Folders never zipped, whatever .distignore says, since shipping one would
 * make the zip huge or publish the Git history.
 */
const NEVER = ["node_modules", ".git", "packaged"];

/**
 * Stops with a message.
 *
 * @param {string} message What is wrong and how to fix it.
 */
function fail(message) {
	process.stderr.write(`\n✖ ${message}\n\n`);
	process.exit(1);
}

/**
 * Reads a text file.
 *
 * @param {string} file Path from the plugin folder.
 * @return {string} The file's contents.
 */
function read(file) {
	return readFileSync(file, "utf8");
}

/**
 * Finds a value in a file's text.
 *
 * @param {string} text    The text.
 * @param {RegExp} pattern A pattern whose first group is the value.
 * @param {string} label   What the value is, for the error message.
 * @return {string} The value.
 */
function find(text, pattern, label) {
	const found = text.match(pattern);

	if (!found) {
		fail(`Couldn't find ${label}.`);
	}

	return found[1].trim();
}

/**
 * Reads every place the version is written.
 *
 * @return {Object<string, string>} Where => version.
 */
function readVersions() {
	const plugin = read(`${SLUG}.php`);
	const versions = {
		"codexa-blocks.php header": find(
			plugin,
			/^\s*\*\s*Version:\s*(.+)$/m,
			"Version: in the codexa-blocks.php header"
		),
		CODEXA_BLOCKS_VERSION: find(
			plugin,
			/define\(\s*'CODEXA_BLOCKS_VERSION',\s*'([^']+)'\s*\)/,
			"define('CODEXA_BLOCKS_VERSION', …) in codexa-blocks.php"
		),
		"readme.txt Stable tag": find(
			read("readme.txt"),
			/^Stable tag:\s*(.+)$/im,
			"Stable tag: in readme.txt"
		),
		"package.json": JSON.parse(read("package.json")).version,
	};

	for (const block of readdirSync("src/blocks")) {
		const file = `src/blocks/${block}/block.json`;

		if (existsSync(file)) {
			versions[file] = JSON.parse(read(file)).version;
		}
	}

	return versions;
}

/**
 * Checks that every version matches and is MAJOR.MINOR.PATCH.
 *
 * @return {string} The version.
 */
function checkVersions() {
	const versions = readVersions();
	const version = versions["codexa-blocks.php header"];
	const wrong = Object.entries(versions).filter(
		([, value]) => value !== version
	);

	if (!/^\d+\.\d+\.\d+$/.test(version)) {
		fail(`The version "${version}" isn't in the form 1.2.3.`);
	}

	if (wrong.length) {
		const list = wrong
			.map(([where, value]) => `  ${where}: ${value ?? "missing"}`)
			.join("\n");

		fail(
			`These don't match the plugin header's version (${version}):\n${list}`
		);
	}

	return version;
}

/**
 * Turns one .distignore line into a test for a path, with a small part of
 * .gitignore's rules (a leading /, * and a trailing /).
 *
 * @param {string} pattern One .distignore line.
 * @return {RegExp} A test for a path relative to the plugin folder, with / separators.
 */
function toRule(pattern) {
	const anchored = pattern.startsWith("/");
	const body = pattern
		.replace(/^\/|\/$/g, "")
		.split("*")
		.map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
		.join("[^/]*");

	return new RegExp(`${anchored ? "^" : "(?:^|/)"}${body}(?:/|$)`);
}

/**
 * Reads .distignore, one pattern per line, skipping blank lines and lines
 * starting with #.
 *
 * @return {RegExp[]} The rules, with the NEVER folders first.
 */
function readRules() {
	const patterns = read(".distignore")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line !== "" && !line.startsWith("#"));

	return [...NEVER.map((folder) => `/${folder}`), ...patterns].map(toRule);
}

/**
 * Lists the files to zip, skipping whatever a rule excludes.
 *
 * @param {RegExp[]} rules  From readRules().
 * @param {string}   [from] Folder to list, relative to the plugin folder.
 * @return {string[]} Paths relative to the plugin folder, sorted.
 */
function listFiles(rules, from = "") {
	const files = [];

	for (const entry of readdirSync(from || ".", { withFileTypes: true })) {
		const path = from ? `${from}/${entry.name}` : entry.name;

		if (rules.some((rule) => rule.test(path))) {
			continue;
		}

		if (entry.isDirectory()) {
			files.push(...listFiles(rules, path));
		} else if (entry.isFile()) {
			files.push(path);
		}
	}

	return files.sort();
}

/**
 * Writes the zip.
 *
 * @param {string[]} files  Paths relative to the plugin folder.
 * @param {string}   target The zip's path.
 * @return {Promise<number>} The zip's size in bytes.
 */
async function writeZip(files, target) {
	mkdirSync("packaged", { recursive: true });

	const output = createWriteStream(target);
	const archive = new ZipArchive({ zlib: { level: 9 } });
	const closed = new Promise((resolve, reject) => {
		output.on("close", resolve);
		output.on("error", reject);
		archive.on("error", reject);
		archive.on("warning", reject);
	});

	archive.pipe(output);

	for (const file of files) {
		archive.file(file, { name: `${SLUG}/${file}` });
	}

	await archive.finalize();
	await closed;

	return archive.pointer();
}

/**
 * Finds Codexa Blocks Pro code in the files going into the zip, PHP by its
 * tokens (scripts/find-pro-code.php) and built files by Pro's text domain.
 *
 * @param {string[]} files Paths relative to the plugin folder.
 * @return {string[]} One "path:line: what" per finding.
 */
function findProCode(files) {
	const php = files.filter((file) => file.endsWith(".php"));
	let found = [];

	try {
		found = execSync("php scripts/find-pro-code.php", {
			input: php.join("\n"),
			encoding: "utf8",
		})
			.split("\n")
			.filter(Boolean);
	} catch {
		fail(
			"Couldn't check the PHP files for Pro code, because php scripts/find-pro-code.php failed. Is PHP installed?"
		);
	}

	for (const file of files.filter((path) => /\.(js|json|css)$/.test(path))) {
		read(file)
			.split("\n")
			.forEach((line, index) => {
				if (PRO_TEXT_DOMAIN.test(line)) {
					found.push(`${file}:${index + 1}: uses Pro's text domain`);
				}
			});
	}

	return found;
}

/**
 * Finds PHP files going into the zip that run code without a
 * direct-access check, with scripts/find-unguarded-php.php. The build's
 * own files get theirs from scripts/guard-build-php.mjs.
 *
 * @param {string[]} files Paths relative to the plugin folder.
 * @return {string[]} The files without the check.
 */
function findUnguardedPhp(files) {
	try {
		return execSync("php scripts/find-unguarded-php.php", {
			input: files.filter((file) => file.endsWith(".php")).join("\n"),
			encoding: "utf8",
		})
			.split("\n")
			.filter(Boolean);
	} catch {
		fail(
			"Couldn't check the PHP files for a direct-access check, because php scripts/find-unguarded-php.php failed. Is PHP installed?"
		);
	}

	return [];
}

const missing = REQUIRED_SOURCE.filter((file) => !existsSync(file));

if (missing.length) {
	fail(`Missing: ${missing.join(", ")}`);
}

const version = checkVersions();

process.stdout.write(`Building Codexa Blocks ${version}…\n`);

try {
	execSync("npm run build", { stdio: "inherit" });
} catch {
	fail("npm run build failed; see the errors above.");
}

try {
	execSync("npm run pot", { stdio: "inherit" });
} catch {
	fail("npm run pot failed; see the errors above.");
}

const notBuilt = REQUIRED_BUILD.filter((file) => !existsSync(file));

if (notBuilt.length) {
	fail(`The build didn't write: ${notBuilt.join(", ")}`);
}

const files = listFiles(readRules());
const proCode = findProCode(files);

if (proCode.length) {
	fail(
		`Codexa Blocks Pro code is in the free plugin. WordPress.org doesn't allow premium code in a free plugin, so move it to codexa-blocks-pro:\n${proCode.map((finding) => `  ${finding}`).join("\n")}`
	);
}

const unguarded = findUnguardedPhp(files);

if (unguarded.length) {
	fail(
		`These PHP files run code without checking for direct access, which WordPress.org doesn't allow. Add if (!defined('ABSPATH')) { exit; } after the opening tag and any namespace line:\n${unguarded.map((file) => `  ${file}`).join("\n")}`
	);
}

const target = `packaged/${SLUG}-${version}.zip`;
const bytes = await writeZip(files, target);

if (bytes > MAX_ZIP_BYTES) {
	rmSync(target);
	fail(
		`The zip is ${(bytes / 1024 / 1024).toFixed(1)} MB; WordPress.org's limit is 10 MB. Check .distignore.`
	);
}

process.stdout.write(
	`\n✔ ${target}: ${files.length} files, ${(bytes / 1024).toFixed(0)} KB\n\n`
);
