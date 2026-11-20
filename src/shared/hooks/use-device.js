/**
 * The device being edited, shared with WordPress's own preview.
 *
 * Reads and sets the editor's device preview (the Desktop / Tablet / Mobile
 * preview in the editor's top toolbar), so choosing Tablet in any Codexa
 * control resizes the canvas to a tablet, and choosing Tablet in WordPress's
 * preview switches every Codexa control. One switch for everything.
 *
 * Editors without that preview (such as the widgets screen) fall back to a
 * local switch that only changes which values the controls show.
 */
import { useDispatch, useSelect } from "@wordpress/data";
import { useState } from "@wordpress/element";

/** WordPress's device names => ours. */
const FROM_WORDPRESS = Object.freeze({
	Desktop: "desktop",
	Tablet: "tablet",
	Mobile: "mobile",
});

/** Our device names => WordPress's. */
const TO_WORDPRESS = Object.freeze({
	desktop: "Desktop",
	tablet: "Tablet",
	mobile: "Mobile",
});

/**
 * @return {[string, (device: string) => void]} The current device and a setter.
 */
export function useDevice() {
	const [localDevice, setLocalDevice] = useState("desktop");

	const editorDevice = useSelect(
		(select) => select("core/editor")?.getDeviceType?.(),
		[]
	);
	const editor = useDispatch("core/editor");

	if (!editorDevice || !editor?.setDeviceType) {
		return [localDevice, setLocalDevice];
	}

	return [
		FROM_WORDPRESS[editorDevice] ?? "desktop",
		(device) => editor.setDeviceType(TO_WORDPRESS[device] ?? "Desktop"),
	];
}
