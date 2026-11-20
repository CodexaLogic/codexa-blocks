/**
 * Stylelint config for Codexa Blocks.
 *
 * Extends the WordPress SCSS rules without their stylistic layer
 * (`@wordpress/stylelint-config/scss`, not `scss-stylistic`). Prettier owns
 * formatting (npm run format), the same split as in eslint.config.js, so
 * stylelint only checks correctness, such as unknown properties, named colors,
 * invalid SCSS and so on.
 *
 * Run npm run lint:css
 */
export default {
	extends: ["@wordpress/stylelint-config/scss"],
	rules: {
		// Block classes use BEM (block__element--modifier),
		// which the WordPress kebab-case pattern does not allow.
		"selector-class-pattern": null,

		// Blank-line rules are formatting, and Prettier removes some of the
		// blank lines these require, so the two tools would fight forever.
		"at-rule-empty-line-before": null,
		"comment-empty-line-before": null,
		"rule-empty-line-before": null,
	},
};
