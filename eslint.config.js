/**
 * ESLint flat config for Codexa Blocks.
 *
 * Prettier owns formatting (npm run format), so formatting rules are left
 * out rather than set to values that could contradict it.
 *
 * Run:
 *   npm run lint:js, check for errors
 *   npm run lint:fix, auto-fix where possible
 */

import js from "@eslint/js";
import wpConfig from "@wordpress/scripts/config/eslint.config.cjs";
import globals from "globals";

export default [
	// ─────────────────────────────────────────────────────────────────────────
	// Files to ignore
	// ─────────────────────────────────────────────────────────────────────────
	{
		ignores: [
			"build/**",
			"node_modules/**",
			"packaged/**",
			"vendor/**",
			"*.min.js",
		],
	},

	// ─────────────────────────────────────────────────────────────────────────
	// WordPress preset (JSX, React, a11y, JSDoc, i18n)
	// ─────────────────────────────────────────────────────────────────────────
	...wpConfig,

	// ─────────────────────────────────────────────────────────────────────────
	// Project rules, applied to all JS files
	// ─────────────────────────────────────────────────────────────────────────
	{
		rules: {
			// ESLint's recommended correctness rules. Spread inside `rules`,
			// not on the config object, so they are not replaced wholesale.
			...js.configs.recommended.rules,

			// Prettier owns formatting. The WordPress preset runs Prettier with
			// WordPress's own style, which would fight the project .prettierrc.
			"prettier/prettier": "off",

			// @wordpress/* packages are supplied by WordPress at runtime (the
			// wp.* globals) and @codexa-blocks/editor by the editor bundle
			// (window.codexaBlocks), so neither is installed or flagged.
			"import/no-unresolved": [
				"error",
				{ ignore: ["^@wordpress/", "^@codexa-blocks/"] },
			],
			"import/no-extraneous-dependencies": "off",

			// Relative imports name their file extension ("./edit.jsx").
			"import/extensions": ["error", "always", { ignorePackages: true }],

			"@wordpress/i18n-text-domain": [
				"error",
				{ allowedTextDomain: "codexa-blocks" },
			],

			"no-await-in-loop": "error",
			"no-template-curly-in-string": "error",
			"no-prototype-builtins": "error",

			"array-callback-return": "error",
			"consistent-return": "error",
			curly: "error",
			"default-case": "error",
			"dot-notation": "error",
			eqeqeq: ["error", "always"],
			"no-caller": "error",
			"no-eval": "error",
			"no-extend-native": "error",
			"no-extra-bind": "error",
			"no-implicit-coercion": "error",
			"no-implied-eval": "error",
			"no-loop-func": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-return-assign": "error",
			"no-self-compare": "error",
			"no-sequences": "error",
			"no-throw-literal": "error",
			"no-unused-expressions": "error",
			"no-useless-call": "error",
			"no-useless-concat": "error",
			"no-useless-return": "error",
			radix: "error",
			"require-await": "error",
			yoda: "error",

			// Variables, naming and clarity
			"no-shadow-restricted-names": "error",
			"no-undef-init": "error",
			camelcase: "error",
			"no-lonely-if": "error",
			"no-multi-assign": "error",
			"no-unneeded-ternary": "error",
			"one-var": ["error", "never"],

			// ES6+
			"no-var": "error",
			"prefer-const": "error",
			"prefer-template": "error",
			"prefer-rest-params": "error",
			"prefer-spread": "error",
			"no-duplicate-imports": "error",
			"no-useless-constructor": "error",
			"no-useless-rename": "error",
			"no-useless-computed-key": "error",
			"object-shorthand": "error",
			"prefer-arrow-callback": "error",
			"sort-imports": [
				"error",
				{ ignoreDeclarationSort: true, ignoreMemberSort: false },
			],
		},
	},

	// ─────────────────────────────────────────────────────────────────────────
	// Node.js files, the config files (*.config.js) and build scripts
	// ─────────────────────────────────────────────────────────────────────────
	{
		files: ["*.config.js", "scripts/**/*.mjs", "scripts/**/*.js"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			// CLI scripts report through the console.
			"no-console": "off",
		},
	},
];
