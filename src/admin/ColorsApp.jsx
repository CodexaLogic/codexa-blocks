/**
 * The Colors page sets the five brand colors every Codexa block starts
 * with, saved as one option through the REST API (/wp/v2/settings). Blocks
 * work out hover and open colors from these.
 *
 * Each color is a circle that opens the theme's palette and a picker. A
 * palette color is saved as "var(--wp--preset--color--slug, #hex)" so it
 * follows the theme, and any other color as hex. An unset color shows the
 * plugin's default.
 *
 * The preview beside the app is rendered by the blocks (AdminPage.php). The
 * app sets each color's variable on it before saving, and checks the colors
 * the blocks show together for contrast.
 *
 * The backdrops (BackdropsCard) are saved by the same button, as their own
 * option.
 */
import apiFetch from "@wordpress/api-fetch";
import { Button, Notice } from "@wordpress/components";
import { createPortal, useEffect, useMemo, useState } from "@wordpress/element";
import { __, _n, sprintf } from "@wordpress/i18n";

import { toHex } from "../shared/utilities/color.js";
import { BackdropsCard } from "./BackdropsCard.jsx";
import { ColorField } from "./ColorField.jsx";

const SAVED_PRESET = /^var\(--wp--preset--color--([a-z0-9-]+),\s*(.+)\)$/;
const PRESET = /^var\(--wp--preset--color--([a-z0-9-]+)\)$/;

// WCAG 2.2 AA for text.
const MIN_CONTRAST = 4.5;

/**
 * The contrast between two colors, from 1 (none) to 21 (black on white), as
 * WCAG defines it. A see-through color counts as solid.
 *
 * @param {string} first  "#rrggbb" or "#rrggbbaa".
 * @param {string} second "#rrggbb" or "#rrggbbaa".
 * @return {number} The ratio, e.g. 4.5 for 4.5:1.
 */
function contrast(first, second) {
	const luminance = (hex) => {
		const [r, g, b] = [1, 3, 5].map((start) => {
			const channel = parseInt(hex.slice(start, start + 2), 16) / 255;

			return channel <= 0.04045
				? channel / 12.92
				: ((channel + 0.055) / 1.055) ** 2.4;
		});

		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const [lighter, darker] = [luminance(first), luminance(second)].sort(
		(a, b) => b - a
	);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The colors the blocks show together, text over a background, each as the
 * CSS variables the preview holds.
 *
 * @return {Array<{text: string, background: string, label: string}>} The pairs.
 */
function contrastPairs() {
	return [
		{
			text: "--codexa-text",
			background: "--codexa-preview-background",
			label: __("Text on your theme's background", "codexa-blocks"),
		},
		{
			text: "--codexa-primary",
			background: "--codexa-preview-background",
			label: __(
				"Primary on your theme's background (Outline and Text link buttons)",
				"codexa-blocks"
			),
		},
		{
			text: "--codexa-on-primary",
			background: "--codexa-primary",
			label: __("Text on primary, on Primary", "codexa-blocks"),
		},
		{
			text: "--codexa-on-primary",
			background: "--codexa-primary-hover",
			label: __(
				"Text on primary, on the Fill button's hover",
				"codexa-blocks"
			),
		},
		{
			text: "--codexa-text",
			background: "--codexa-surface",
			label: __("Text on Light background", "codexa-blocks"),
		},
	];
}

/**
 * Converts between saved values and the colors the palette shows.
 *
 * @param {Array<{name: string, slug: string, color: string}>} palette The theme's colors.
 * @return {{toShown: (saved?: string) => (string|undefined), toSaved: (color?: string) => (string|undefined), fromTheme: (role: {slug?: string, color?: string}) => (string|undefined), nameOf: (saved: string) => string}} The conversions.
 */
function useColorConversions(palette) {
	return useMemo(() => {
		const presetOf = (saved) => {
			const [, slug, fallback] = saved?.match(SAVED_PRESET) ?? [];

			return {
				preset: slug
					? palette.find((entry) => entry.slug === slug)
					: undefined,
				fallback,
			};
		};

		return {
			/**
			 * @param {string|undefined} saved Saved value.
			 * @return {string|undefined} The color to show, the palette color's current value or the saved one.
			 */
			toShown: (saved) => {
				const { preset, fallback } = presetOf(saved);

				return preset?.color ?? fallback ?? saved;
			},

			/**
			 * @param {string|undefined} color Color from the palette or picker.
			 * @return {string|undefined} Value to save.
			 */
			toSaved: (color) => {
				if (!color) {
					return undefined;
				}

				const preset = palette.find(
					(entry) => entry.color.toLowerCase() === color.toLowerCase()
				);

				const hex = toHex(color);

				return preset
					? `var(--wp--preset--color--${preset.slug}, ${hex})`
					: hex;
			},

			/**
			 * @param {{slug?: string, color?: string}} role A theme color, from AdminPage::themeColors().
			 * @return {string|undefined} Value to save.
			 */
			fromTheme: (role) => {
				const preset = palette.find(
					(entry) => entry.slug === role.slug
				);

				if (preset) {
					return `var(--wp--preset--color--${preset.slug}, ${toHex(preset.color)})`;
				}

				return role.color ? toHex(role.color) : undefined;
			},

			/**
			 * @param {string} saved Saved value.
			 * @return {string} Its palette name, or the color itself.
			 */
			nameOf: (saved) => {
				const { preset, fallback } = presetOf(saved);

				return preset?.name ?? fallback ?? saved;
			},
		};
	}, [palette]);
}

/**
 * @param {Object}           props                Component props.
 * @param {Array}            props.fields         The colors, from ColorSettings::fields().
 * @param {Object}           props.saved          The saved colors, key => value.
 * @param {string}           props.option         The option's name in the settings endpoint.
 * @param {Array}            props.backdrops      The backdrops, from BackdropSettings::backdrops().
 * @param {Object}           props.savedBackdrops The saved backdrops, key => { color, opacity }.
 * @param {string}           props.backdropOption The backdrops' option name in the settings endpoint.
 * @param {Array}            props.palette        The theme's colors.
 * @param {Object}           props.theme          The theme's background and brand roles, from AdminPage::themeColors().
 * @param {HTMLElement|null} props.preview        The preview's container.
 * @param {HTMLElement|null} props.toolbar        The tab bar's place for the Save button (AdminPage::renderToolbar()).
 * @return {Element} The app.
 */
export function ColorsApp({
	fields,
	saved,
	option,
	backdrops,
	savedBackdrops,
	backdropOption,
	palette,
	theme,
	preview,
	toolbar,
}) {
	const [values, setValues] = useState(() => ({ ...saved }));
	const [savedValues, setSavedValues] = useState(() => ({ ...saved }));
	const [backdropValues, setBackdropValues] = useState(() => ({
		...savedBackdrops,
	}));
	const [savedBackdropValues, setSavedBackdropValues] = useState(() => ({
		...savedBackdrops,
	}));
	const [status, setStatus] = useState(null);
	const [isSaving, setIsSaving] = useState(false);
	// The field whose palette is open, one at a time.
	const [openField, setOpenField] = useState(null);

	// A palette closes when the page is clicked anywhere outside it.
	// Closing on focus leaving it alone isn't enough, because focus doesn't
	// always move where it's clicked (Safari, another window, the preview),
	// and then palettes stayed open.
	useEffect(() => {
		if (openField === null) {
			return undefined;
		}

		const closeOutside = (event) => {
			if (
				!event.target.closest?.(
					".components-popover, .codexa-colors__swatch"
				)
			) {
				setOpenField(null);
			}
		};

		document.addEventListener("pointerdown", closeOutside, true);

		return () =>
			document.removeEventListener("pointerdown", closeOutside, true);
	}, [openField]);
	const [hardToRead, setHardToRead] = useState([]);
	const conversions = useColorConversions(palette);
	const isDirty =
		Object.keys(values).length !== Object.keys(savedValues).length ||
		Object.keys(values).some((key) => values[key] !== savedValues[key]) ||
		backdrops.some(({ key }) =>
			["color", "opacity"].some(
				(part) =>
					backdropValues[key]?.[part] !==
					savedBackdropValues[key]?.[part]
			)
		);

	/**
	 * Opens or closes a field's palette, one at a time.
	 *
	 * @param {string}  key  The field's key.
	 * @param {boolean} next Whether it opens.
	 */
	const toggleField = (key, next) =>
		setOpenField((open) => {
			if (next) {
				return key;
			}

			// A late "close" from a palette that's no longer the open one
			// leaves that one alone.
			return open === key ? null : open;
		});

	// The preview shows each set color, or an unset color's default in place
	// of a saved value not yet cleared. The pairs the blocks show together are
	// then read back and checked.
	useEffect(() => {
		if (!preview) {
			return;
		}

		fields.forEach((field) => {
			preview.style.setProperty(
				field.variable,
				values[field.key] ?? field.default
			);
		});

		setHardToRead(
			contrastPairs()
				.map((pair) => ({
					...pair,
					ratio: contrast(
						toHex(`var(${pair.text})`, preview),
						toHex(`var(${pair.background})`, preview)
					),
				}))
				.filter((pair) => pair.ratio < MIN_CONTRAST)
		);
	}, [fields, values, preview]);

	// With unsaved changes, the browser asks before leaving the page.
	useEffect(() => {
		const warn = (event) => {
			event.preventDefault();
		};

		if (isDirty) {
			window.addEventListener("beforeunload", warn);
		}

		return () => window.removeEventListener("beforeunload", warn);
	}, [isDirty]);

	/**
	 * Sets or unsets one color.
	 *
	 * @param {string}           key  The field's key.
	 * @param {string|undefined} next The value to save, or undefined.
	 */
	const setValue = (key, next) => {
		setStatus(null);
		setValues((current) => {
			const result = { ...current };

			if (next) {
				result[key] = next;
			} else {
				delete result[key];
			}

			return result;
		});
	};

	/**
	 * Fills the colors the theme has, for the person to check before saving.
	 * Text on primary becomes the theme's text or background, whichever
	 * reads better on Primary.
	 */
	const applyThemeColors = () => {
		const next = { ...values };

		Object.entries(theme.roles).forEach(([key, role]) => {
			const color = conversions.fromTheme(role);

			if (color) {
				next[key] = color;
			}
		});

		if (theme.roles.primary) {
			const [, slug] = theme.background.match(PRESET) ?? [];
			const choices = [
				next.text,
				conversions.fromTheme(
					slug ? { slug } : { color: theme.background }
				),
			].filter(Boolean);
			const primary = toHex(conversions.toShown(next.primary));

			next["on-primary"] = choices.reduce((best, choice) =>
				contrast(toHex(conversions.toShown(choice)), primary) >
				contrast(toHex(conversions.toShown(best)), primary)
					? choice
					: best
			);
		}

		const isFilled = (field) =>
			Boolean(theme.roles[field.key]) ||
			(field.key === "on-primary" && Boolean(theme.roles.primary));
		const filled = fields.filter(isFilled);
		const missing = fields.filter((field) => !isFilled(field));

		setValues(next);
		setStatus({
			type: "info",
			message: [
				sprintf(
					/* translators: %s: The colors filled, e.g. "Primary, Text". */
					__(
						"From your theme: %s. Check the preview, then save.",
						"codexa-blocks"
					),
					filled.map((field) => field.label).join(", ")
				),
				missing.length
					? sprintf(
							/* translators: %s: The colors left as they were, e.g. "Borders". */
							__(
								"Not found in your theme, so unchanged: %s.",
								"codexa-blocks"
							),
							missing.map((field) => field.label).join(", ")
						)
					: "",
			]
				.filter(Boolean)
				.join(" "),
		});
	};

	const save = async () => {
		setIsSaving(true);
		setStatus(null);

		try {
			const response = await apiFetch({
				path: "/wp/v2/settings",
				method: "POST",
				data: { [option]: values, [backdropOption]: backdropValues },
			});
			const stored = response?.[option] ?? {};
			const storedBackdrops = response?.[backdropOption] ?? {};

			const dropped = Object.keys(values).filter(
				(key) => !(key in stored)
			);

			setValues({ ...stored });
			setSavedValues({ ...stored });
			setBackdropValues({ ...storedBackdrops });
			setSavedBackdropValues({ ...storedBackdrops });
			setStatus(
				dropped.length
					? {
							type: "warning",
							message: sprintf(
								/* translators: %d: How many colors weren't saved. */
								_n(
									"%d color couldn't be saved and was reset.",
									"%d colors couldn't be saved and were reset.",
									dropped.length,
									"codexa-blocks"
								),
								dropped.length
							),
						}
					: {
							type: "success",
							message: __("Colors saved.", "codexa-blocks"),
						}
			);
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error?.message ??
					__("The colors couldn't be saved.", "codexa-blocks"),
			});
		} finally {
			setIsSaving(false);
		}
	};

	// In the tab bar, and again under the colors, beside the other actions.
	const saveButton = (
		<Button
			variant="primary"
			onClick={save}
			isBusy={isSaving}
			disabled={isSaving || !isDirty}
			accessibleWhenDisabled
		>
			{__("Save colors", "codexa-blocks")}
		</Button>
	);

	return (
		<div className="codexa-colors">
			{toolbar && createPortal(saveButton, toolbar)}

			{status && (
				<Notice
					status={status.type}
					onRemove={() => setStatus(null)}
					politeness={
						status.type === "error" ? "assertive" : "polite"
					}
				>
					{status.message}
				</Notice>
			)}

			<section
				className="codexa-colors__card"
				aria-labelledby="codexa-colors-title"
			>
				<div>
					<h2 id="codexa-colors-title">
						{__("Brand colors", "codexa-blocks")}
					</h2>
					<p className="codexa-colors__intro">
						{__(
							"The colors every Codexa block starts with on this site. Hover and open colors follow from them. A block's own color settings still take their place for that block.",
							"codexa-blocks"
						)}
					</p>
				</div>

				<div className="codexa-colors__fields">
					{fields.map((field) => (
						<ColorField
							key={field.key}
							field={field}
							value={values[field.key]}
							palette={palette}
							conversions={conversions}
							isOpen={openField === field.key}
							onToggle={(next) => toggleField(field.key, next)}
							onChange={(next) => setValue(field.key, next)}
						/>
					))}
				</div>

				<div className="codexa-colors__contrast" aria-live="polite">
					{hardToRead.length ? (
						<Notice status="warning" isDismissible={false}>
							<p>
								{sprintf(
									/* translators: %s: The minimum contrast, e.g. "4.5". */
									__(
										"Some colors are hard to read together. Text needs a contrast of at least %s:1.",
										"codexa-blocks"
									),
									MIN_CONTRAST
								)}
							</p>
							<ul>
								{hardToRead.map((pair) => (
									<li key={pair.label}>
										{sprintf(
											/* translators: 1: Two colors, e.g. "Text on Light background". 2: Their contrast, e.g. "3.2". */
											__("%1$s: %2$s:1", "codexa-blocks"),
											pair.label,
											(
												Math.floor(pair.ratio * 10) / 10
											).toString()
										)}
									</li>
								))}
							</ul>
						</Notice>
					) : (
						<p className="codexa-colors__contrast-ok">
							{__(
								"Every pair of colors the blocks show together is easy to read (WCAG AA).",
								"codexa-blocks"
							)}
						</p>
					)}
				</div>
			</section>

			{backdrops.length > 0 && (
				<BackdropsCard
					backdrops={backdrops}
					values={backdropValues}
					onChange={(key, entry) => {
						setStatus(null);
						setBackdropValues((current) => {
							const result = { ...current, [key]: entry };

							if (!Object.keys(entry).length) {
								delete result[key];
							}

							return result;
						});
					}}
					palette={palette}
					conversions={conversions}
					openField={openField}
					onToggle={toggleField}
				/>
			)}

			<div className="codexa-colors__actions">
				{saveButton}
				{Object.keys(theme.roles).length > 0 && (
					<Button variant="secondary" onClick={applyThemeColors}>
						{__("Use my theme's colors", "codexa-blocks")}
					</Button>
				)}
				<Button
					variant="tertiary"
					onClick={() => {
						setStatus(null);
						setValues({});
					}}
					disabled={!Object.keys(values).length}
					accessibleWhenDisabled
				>
					{__("Use the plugin's colors", "codexa-blocks")}
				</Button>
				{isDirty && (
					<span className="codexa-colors__unsaved">
						{__("Unsaved changes", "codexa-blocks")}
					</span>
				)}
			</div>
		</div>
	);
}
