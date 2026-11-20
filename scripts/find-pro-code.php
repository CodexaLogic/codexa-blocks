<?php
/**
 * Finds Codexa Blocks Pro code in PHP files, for scripts/bundle.mjs.
 *
 * Run it with php scripts/find-pro-code.php < file-list, one path per line.
 * Prints one line per finding (path, line and what) and nothing when there
 * is none.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Scripts;

/**
 * Reads PHP's tokens, so comments and docblocks never count, since free may
 * mention Pro there. Pro's code is any of
 *
 * - its namespace, declared or used (namespace CodexaBlocksPro\…,
 *   use CodexaBlocksPro\…, \CodexaBlocksPro\…::…);
 * - a string that names a Pro class ('CodexaBlocksPro\…');
 * - its text domain as a string ('codexa-blocks-pro').
 */
final class ProCodeFinder {

	/**
	 * Pro's root namespace.
	 *
	 * @var string
	 */
	private const PRO_NAMESPACE = 'CodexaBlocksPro';

	/**
	 * Pro's text domain.
	 *
	 * @var string
	 */
	private const PRO_TEXT_DOMAIN = 'codexa-blocks-pro';

	/**
	 * Reads the paths from standard input and prints every finding.
	 *
	 * @return void
	 */
	public static function run(): void {
		$paths = array_filter(array_map('trim', explode("\n", (string) stream_get_contents(STDIN))));

		// This is a build script, so WordPress, and with it WP_Filesystem, isn't loaded.
		foreach ($paths as $file) {
			foreach (self::find($file) as $finding) {
				fwrite(STDOUT, $finding . "\n"); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
			}
		}
	}

	/**
	 * The Pro code in one file.
	 *
	 * @param  string   $file The file.
	 * @return string[] One "path:line: what" per finding.
	 */
	public static function find(string $file): array {
		// A local file read by a build script, not a remote URL.
		$code = file_get_contents($file); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		if ($code === false) {
			return ["$file: couldn't be read"];
		}

		$found = [];

		foreach (token_get_all($code) as $token) {
			if (!is_array($token)) {
				continue;
			}

			[$type, $text, $line] = $token;
			$what                 = self::describe($type, $text);

			if ($what !== '') {
				$found[] = "$file:$line: $what";
			}
		}

		return $found;
	}

	/**
	 * What a token says about Pro, if anything.
	 *
	 * @param  int    $type The token's type.
	 * @param  string $text The token's text.
	 * @return string What it is, or '' when it isn't Pro's.
	 */
	private static function describe(int $type, string $text): string {
		if (in_array($type, [T_STRING, T_NAME_QUALIFIED, T_NAME_FULLY_QUALIFIED], true)) {
			return self::isProName($text) ? "uses Pro's namespace ($text)" : '';
		}

		if ($type !== T_CONSTANT_ENCAPSED_STRING) {
			return '';
		}

		// The string's value, without its quotes and with \\ read as one \.
		$value = str_replace('\\\\', '\\', substr($text, 1, -1));

		if ($value === self::PRO_TEXT_DOMAIN) {
			return "uses Pro's text domain ($text)";
		}

		return self::isProName($value) ? "names a Pro class ($text)" : '';
	}

	/**
	 * Whether a name is Pro's namespace or inside it.
	 *
	 * @param  string $name A name as written, e.g. "\CodexaBlocksPro\Icons\SvgIcon".
	 * @return bool
	 */
	private static function isProName(string $name): bool {
		$name = ltrim($name, '\\');

		return $name === self::PRO_NAMESPACE || str_starts_with($name, self::PRO_NAMESPACE . '\\');
	}
}

ProCodeFinder::run();
