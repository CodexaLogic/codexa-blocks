/**
 * Plays the background videos of Row and Column blocks.
 *
 * Loaded only on pages with one (Utilities\BackgroundVideo). Each video's
 * src is set the first time it's on screen, so only videos people scroll to
 * download. The stylesheet hides it on phones and for reduced motion, where
 * it never downloads and the background image shows instead.
 *
 * A video plays on screen and pauses when scrolled away. Its corner button
 * pauses it until pressed again (aria-pressed="true" means paused). The
 * button shows once the video has played, and hides again if it can't, such
 * as a format the browser doesn't support.
 */

/**
 * Sets up one background video.
 *
 * @param {HTMLElement} container The .codexa-background-video element.
 */
function setUp(container) {
	const video = container.querySelector("video");
	const toggle = container.querySelector("button");

	if (!video || !toggle) {
		return;
	}

	let isOnScreen = false;
	let isPausedByVisitor = false;

	/** Plays or pauses the video to match the state. */
	const sync = () => {
		if (!isOnScreen || isPausedByVisitor) {
			video.pause();

			return;
		}

		if (!video.hasAttribute("src")) {
			video.src = video.dataset.src;
		}

		// A browser that refuses to play leaves the background image showing.
		video.play().catch(() => {});
	};

	// Muted is what lets browsers start a video without a click; set as a
	// property too, since some browsers read only that.
	video.muted = true;

	video.addEventListener(
		"playing",
		() => {
			toggle.hidden = false;
		},
		{ once: true }
	);
	video.addEventListener("error", () => {
		toggle.hidden = true;
	});

	toggle.addEventListener("click", () => {
		isPausedByVisitor = !isPausedByVisitor;
		toggle.setAttribute("aria-pressed", String(isPausedByVisitor));
		sync();
	});

	new window.IntersectionObserver(([entry]) => {
		isOnScreen = entry.isIntersecting;
		sync();
	}).observe(container);
}

document.querySelectorAll(".codexa-background-video").forEach(setUp);
