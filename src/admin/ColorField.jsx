/**
 * One color on the Colors page, shared by its cards (ColorsApp,
 * BackdropsCard).
 */
import { Button, ColorPalette, Dropdown } from "@wordpress/components";
import { __, sprintf } from "@wordpress/i18n";

/**
 * One color, a circle that opens the palette, its name, its value and
 * where the blocks use it.
 *
 * @param {Object}                            props             Component props.
 * @param {Object}                            props.field       The field's key, label, description and default.
 * @param {string|undefined}                  props.value       Saved value.
 * @param {Array}                             props.palette     The theme's colors.
 * @param {Object}                            props.conversions From useColorConversions().
 * @param {boolean}                           props.isOpen      Whether its palette is open.
 * @param {(isOpen: boolean) => void}         props.onToggle    Opens or closes its palette.
 * @param {(value: string|undefined) => void} props.onChange    Receives the value to save, or undefined to unset it.
 * @return {Element} The field.
 */
export function ColorField({
	field,
	value,
	palette,
	conversions,
	isOpen,
	onToggle,
	onChange,
}) {
	const shown = conversions.toShown(value) ?? field.default;
	const name = value
		? conversions.nameOf(value)
		: __("Default", "codexa-blocks");

	return (
		<div className="codexa-colors__field">
			<Dropdown
				open={isOpen}
				onToggle={onToggle}
				popoverProps={{ placement: "bottom-start" }}
				renderToggle={() => (
					<Button
						className="codexa-colors__swatch"
						onClick={() => onToggle(!isOpen)}
						aria-expanded={isOpen}
						label={sprintf(
							/* translators: 1: A setting, e.g. "Primary", "Link hover" or "Padding (tablet), Top". 2: Its value, e.g. "Accent", "#3a3a3a", "not set" or "24px". */
							__("%1$s: %2$s", "codexa-blocks"),
							field.label,
							name
						)}
					>
						<span
							className="codexa-colors__swatch-color"
							style={{ "--codexa-swatch": shown }}
						/>
					</Button>
				)}
				renderContent={() => (
					<div className="codexa-colors__popover">
						<ColorPalette
							colors={palette}
							value={shown}
							enableAlpha
							clearable={false}
							onChange={(next) =>
								onChange(conversions.toSaved(next))
							}
						/>
						{value && (
							<Button
								variant="secondary"
								size="compact"
								onClick={() => onChange(undefined)}
							>
								{__("Use the default", "codexa-blocks")}
							</Button>
						)}
					</div>
				)}
			/>
			<div className="codexa-colors__field-text">
				<span className="codexa-colors__field-label">
					{field.label}
				</span>
				<span className="codexa-colors__field-value">{name}</span>
				<span className="codexa-colors__field-description">
					{field.description}
				</span>
			</div>
		</div>
	);
}
