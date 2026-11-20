<?php
/**
 * Finds PHP files that run code without a direct-access check, for
 * scripts/bundle.mjs.
 *
 * Run it with php scripts/find-unguarded-php.php < file-list, one path per
 * line. Prints one line per file without the check and nothing when every
 * file has it.
 *
 * @package CodexaBlocks
 */

namespace CodexaBlocks\Scripts;

/**
 * Reads PHP's tokens, so comments never count. A file passes when it has
 * no code at all (such as an index.php placeholder), or when its first
 * statement after any namespace, declare or use lines is
 * if (!defined('ABSPATH')) or, for uninstall.php,
 * if (!defined('WP_UNINSTALL_PLUGIN')).
 */
final class UnguardedFinder {

	/**
	 * Constants a check may test.
	 *
	 * @var string[]
	 */
	private const CONSTANTS = ['ABSPATH', 'WP_UNINSTALL_PLUGIN'];

	/**
	 * Statements allowed before the check.
	 *
	 * @var int[]
	 */
	private const PREAMBLE = [T_NAMESPACE, T_DECLARE, T_USE];

	/**
	 * Tokens that aren't code.
	 *
	 * @var int[]
	 */
	private const IGNORED = [T_OPEN_TAG, T_WHITESPACE, T_COMMENT, T_DOC_COMMENT];

	/**
	 * Reads the paths from standard input and prints every file without the check.
	 *
	 * @return void
	 */
	public static function run(): void {
		$paths = array_filter(array_map('trim', explode("\n", (string) stream_get_contents(STDIN))));

		// This is a build script, so WordPress, and with it WP_Filesystem, isn't loaded.
		foreach ($paths as $file) {
			if (!self::isGuarded($file)) {
				fwrite(STDOUT, "$file\n"); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
			}
		}
	}

	/**
	 * Whether a file has no code or starts its code with the check.
	 *
	 * @param  string $file The file.
	 * @return bool
	 */
	public static function isGuarded(string $file): bool {
		// A local file read by a build script, not a remote URL.
		$code = file_get_contents($file); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		if ($code === false) {
			return false;
		}

		$tokens = array_values(array_filter(
			token_get_all($code),
			static fn($token): bool => !is_array($token) || !in_array($token[0], self::IGNORED, true)
		));

		// Skips the namespace, declare and use statements.
		while ($tokens && is_array($tokens[0]) && in_array($tokens[0][0], self::PREAMBLE, true)) {
			$end    = self::find($tokens, ';');
			$tokens = $end === null ? [] : array_slice($tokens, $end + 1);
		}

		if (!$tokens) {
			return true;
		}

		$start = array_map(
			static fn($token): string => is_array($token) ? $token[1] : $token,
			array_slice($tokens, 0, 6)
		);

		return count($start) === 6
			&& strtolower($start[0]) === 'if'
			&& $start[1] === '('
			&& $start[2] === '!'
			&& strtolower($start[3]) === 'defined'
			&& $start[4] === '('
			&& in_array(trim($start[5], '\'"'), self::CONSTANTS, true);
	}

	/**
	 * The position of the first token with this text.
	 *
	 * @param  array  $tokens The tokens.
	 * @param  string $text   The text to find.
	 * @return ?int   Its position, or null when it isn't there.
	 */
	private static function find(array $tokens, string $text): ?int {
		foreach ($tokens as $index => $token) {
			if ((is_array($token) ? $token[1] : $token) === $text) {
				return $index;
			}
		}

		return null;
	}
}

UnguardedFinder::run();
