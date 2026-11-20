/**
 * The Gallery block's type setting as pictures, one per registered type,
 * each with its title underneath.
 *
 * The chosen type is pressed (filled with the admin color), like the Row's
 * layout pictures. The pictures are drawn in currentColor, so they follow
 * the button's text color in every state.
 */
import { Button } from "@wordpress/components";

/**
 * @param {Object}                 props          Component props.
 * @param {string}                 props.label    The setting's name, for screen readers, e.g. "Gallery type".
 * @param {readonly Object[]}      props.types    Registered types, from useGalleryTypes().
 * @param {string}                 props.value    The chosen type's name.
 * @param {(name: string) => void} props.onChange Receives the picked type's name.
 * @return {Element} The pictures.
 */
export function TypePicker({ label, types, value, onChange }) {
	return (
		<div className="codexa-type-picker" role="group" aria-label={label}>
			{types.map((type) => (
				<Button
					key={type.name}
					className="codexa-type-picker__choice"
					isPressed={type.name === value}
					onClick={() => onChange(type.name)}
				>
					<span className="codexa-type-picker__picture">
						{type.picture}
					</span>
					<span className="codexa-type-picker__title">
						{type.title}
					</span>
				</Button>
			))}
		</div>
	);
}
