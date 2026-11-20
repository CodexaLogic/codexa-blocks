/**
 * The carousel any block can show its list as, shared by carousel-view.js
 * on the page and CarouselFrame in the editor, so both behave alike. The
 * markup comes from CodexaBlocks\Utilities\Carousel.
 *
 * The list (the track) scrolls sideways and snaps to each item, so a
 * swipe, a trackpad or the keyboard (once the list has focus) moves it
 * with no script at all. This adds the arrows, the dots and a status
 * message for screen readers in the carousel's controls element, which
 * stays hidden without the script.
 *
 * A slide is the items in view at once, as many as the block sets in
 * --codexa-carousel-per-view for that device. The arrows move a slide at a
 * time and each dot jumps to one. The last slide ends on the last item, so
 * it may share items with the one before. Hidden items, such as those an
 * add-on's filter hides, are skipped, and the carousel starts again from
 * the first slide when they change.
 *
 * When the track can't scroll, because an add-on's stylesheet stacks the
 * items in one place, slides change by class only (CURRENT on the items in
 * view), and a swipe or the arrow keys move between them. Such a
 * stylesheet should set touch-action: pan-y on the track, or the browser
 * keeps a sideways finger drag for itself.
 *
 * For add-ons, on the carousel element:
 * - CHANGE fires after the slide changes, with detail
 *   { slide, slides, items, current }. items are the items shown, and
 *   current those in view.
 * - GO moves it. detail.to is "next", "previous", a slide number from 0,
 *   or an item's element, and detail.loop wraps around at the ends.
 */

/** Class on the carousel once this has set it up. */
export const READY = "is-carousel-ready";

/** Class on the items in view. */
export const CURRENT = "is-carousel-current";

/** Event fired after the slide changes. */
export const CHANGE = "codexa-blocks:carousel-change";

/** Event that moves the carousel. */
export const GO = "codexa-blocks:carousel-go";

const TRACK = ":scope > .codexa-carousel__track";
const CONTROLS = ":scope > .codexa-carousel__controls";
const PREFIX = "codexa-carousel";

/** How far a finger must move sideways, in pixels, to count as a swipe. */
const SWIPE = 50;

/** Chevrons pointing back and forward, flipped by the stylesheet right to left. */
const ICONS = {
	previous: "M15.4 5 8.4 12l7 7 1.4-1.4-5.6-5.6 5.6-5.6z",
	next: "m8.6 5-1.4 1.4 5.6 5.6-5.6 5.6L8.6 19l7-7z",
};

/**
 * A message with its numbers filled in, as PHP's sprintf() numbers them.
 *
 * @param {string}   message A message with %1$d, %2$d.
 * @param {number[]} numbers The numbers.
 * @return {string} The message.
 */
const format = (message, numbers) =>
	String(message ?? "").replace(/%(\d)\$d/g, (match, place) =>
		String(numbers[Number(place) - 1] ?? match)
	);

/**
 * An arrow button.
 *
 * @param {Document} document The carousel's document (the editor's canvas is a frame).
 * @param {string}   name     "previous" or "next".
 * @param {string}   label    Its accessible name.
 * @return {HTMLButtonElement} The button.
 */
function arrow(document, name, label) {
	const button = document.createElement("button");
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

	button.type = "button";
	button.className = `${PREFIX}__arrow is-${name}`;
	button.setAttribute("aria-label", label);
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("focusable", "false");
	path.setAttribute("d", ICONS[name]);
	svg.append(path);
	button.append(svg);

	return button;
}

/**
 * Sets up a carousel.
 *
 * @param {HTMLElement} carousel         The carousel element (.codexa-carousel).
 * @param {Object}      options          Options.
 * @param {boolean}     options.arrows   Whether to show the arrows.
 * @param {boolean}     options.dots     Whether to show the dots.
 * @param {Object}      options.labels   Translated labels: previous, next and slide ("Slide %1$d of %2$d").
 * @param {boolean}     [options.static] True in the editor, where the status message is left out.
 * @return {() => void} Stops, and removes everything it added.
 */
export function setupCarousel(carousel, { arrows, dots, labels, ...options }) {
	const document = carousel.ownerDocument;
	const view = document.defaultView;
	const list = carousel.querySelector(TRACK);
	const controls = carousel.querySelector(CONTROLS);

	if (!view || !list || !controls) {
		return () => {};
	}

	const previous = arrows
		? arrow(document, "previous", labels.previous)
		: null;
	const next = arrows ? arrow(document, "next", labels.next) : null;
	const dotList = dots ? document.createElement("div") : null;
	const status = options.static ? null : document.createElement("p");

	let items = [];
	let perView = 1;
	let slides = 1;
	let slide = 0;
	let settle = 0;
	let frame = 0;
	let swipeStart = null;
	let swiped = false;
	let built = false;

	const isRtl = () => view.getComputedStyle(list).direction === "rtl";
	const scrolls = () => list.scrollWidth > list.clientWidth + 1;
	const reduceMotion = () =>
		view.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// The first item of a slide. The last slide ends on the last item.
	const firstOf = (number) =>
		Math.max(0, Math.min(number * perView, items.length - perView));

	// The slide that shows an item first, or the last one with it in view.
	const slideOf = (index) => {
		for (let number = 0; number < slides; number++) {
			if (index < firstOf(number) + perView) {
				return number;
			}
		}

		return slides - 1;
	};

	// The distance from an item's start edge to the track's, in the reading
	// direction.
	const offsetOf = (item) => {
		const box = item.getBoundingClientRect();
		const frameBox = list.getBoundingClientRect();
		const padding =
			parseFloat(view.getComputedStyle(list).paddingInlineStart) || 0;

		return isRtl()
			? frameBox.right - padding - box.right
			: box.left - frameBox.left - padding;
	};

	/**
	 * Shows the slide on the controls and the items, and tells add-ons.
	 *
	 * @param {boolean} announce Whether screen readers hear the new position.
	 */
	const mark = (announce) => {
		const first = firstOf(slide);
		const current = items.slice(first, first + perView);

		items.forEach((item) =>
			item.classList.toggle(CURRENT, current.includes(item))
		);
		previous?.setAttribute("aria-disabled", String(slide === 0));
		next?.setAttribute("aria-disabled", String(slide === slides - 1));
		dotList?.querySelectorAll("button").forEach((dot, number) => {
			if (number === slide) {
				dot.setAttribute("aria-current", "true");
			} else {
				dot.removeAttribute("aria-current");
			}
		});

		// Emptied on other changes, so a later announcement always differs
		// from the last and is heard, even with the same words.
		if (status) {
			status.textContent = announce
				? format(labels.slide, [slide + 1, slides])
				: "";
		}

		carousel.dispatchEvent(
			new view.CustomEvent(CHANGE, {
				detail: { slide, slides, items, current },
			})
		);
	};

	/**
	 * Moves to a slide.
	 *
	 * @param {number}  number         The slide, from 0.
	 * @param {Object}  [how]          How.
	 * @param {boolean} [how.announce] Whether screen readers hear the new position.
	 * @param {boolean} [how.instant]  Whether to jump rather than scroll smoothly.
	 */
	const goTo = (number, { announce = false, instant = false } = {}) => {
		slide = Math.max(0, Math.min(number, slides - 1));

		const target = items[firstOf(slide)];

		if (target && scrolls()) {
			const distance = offsetOf(target);

			list.scrollBy({
				left: isRtl() ? -distance : distance,
				behavior: instant || reduceMotion() ? "instant" : "smooth",
			});
		}

		mark(announce);
	};

	/**
	 * Moves a slide forward or back.
	 *
	 * @param {number}  direction 1 or -1.
	 * @param {boolean} loop      Whether to wrap around at the ends.
	 * @param {boolean} announce  Whether screen readers hear the new position.
	 */
	const step = (direction, loop, announce) => {
		const target = slide + direction;

		if (target >= 0 && target < slides) {
			goTo(target, { announce });
		} else if (loop && slides > 1) {
			goTo(target < 0 ? slides - 1 : 0, { announce });
		}
	};

	// After a scroll ends, the slide whose first item is closest to the start.
	const onScroll = () => {
		view.clearTimeout(settle);
		settle = view.setTimeout(() => {
			if (!items.length) {
				return;
			}

			let closest = slide;
			let best = Infinity;

			for (let number = 0; number < slides; number++) {
				const distance = Math.abs(offsetOf(items[firstOf(number)]));

				if (distance < best) {
					best = distance;
					closest = number;
				}
			}

			if (closest !== slide) {
				slide = closest;
				mark(false);
			}
		}, 100);
	};

	// Rebuilds the dots, one per slide. With one slide, neither the arrows
	// nor the dots show.
	const buildDots = () => {
		[previous, next].forEach((button) => {
			if (button) {
				button.hidden = slides < 2;
			}
		});

		if (!dotList) {
			return;
		}

		dotList.replaceChildren(
			...Array.from({ length: slides }, (unused, number) => {
				const dot = document.createElement("button");

				dot.type = "button";
				dot.className = `${PREFIX}__dot`;
				dot.setAttribute(
					"aria-label",
					format(labels.slide, [number + 1, slides])
				);
				dot.addEventListener("click", () =>
					goTo(number, { announce: true })
				);

				return dot;
			})
		);
		dotList.hidden = slides < 2;
	};

	/**
	 * Counts the items and slides again, after the items, the items in view or
	 * the width change.
	 *
	 * @param {boolean} restart Whether to go back to the first slide.
	 */
	const measure = (restart) => {
		frame = 0;

		const shown = [...list.children].filter((item) => !item.hidden);
		const count = parseInt(
			view
				.getComputedStyle(list)
				.getPropertyValue("--codexa-carousel-per-view"),
			10
		);
		const nextPerView = Math.max(
			1,
			Math.min(Number.isInteger(count) ? count : 1, shown.length || 1)
		);
		const nextSlides = Math.max(1, Math.ceil(shown.length / nextPerView));
		const changed =
			shown.length !== items.length ||
			shown.some((item, index) => item !== items[index]);

		if (
			built &&
			!changed &&
			nextPerView === perView &&
			nextSlides === slides
		) {
			return;
		}

		// The item first in view stays in view when only the items in view change.
		const anchor = items[firstOf(slide)];

		items.forEach((item) => {
			if (!shown.includes(item)) {
				item.classList.remove(CURRENT);
			}
		});
		items = shown;
		perView = nextPerView;

		const rebuild = !built || nextSlides !== slides;

		slides = nextSlides;

		if (rebuild) {
			built = true;
			buildDots();
		}

		const keep =
			!restart && !changed && anchor ? items.indexOf(anchor) : -1;

		goTo(keep >= 0 ? slideOf(keep) : 0, { instant: true });
	};

	const schedule = (restart = false) => {
		if (restart) {
			view.cancelAnimationFrame(frame);
			measure(true);
		} else if (!frame) {
			frame = view.requestAnimationFrame(() => measure(false));
		}
	};

	// The arrow keys, Home and End, where the list doesn't scroll itself.
	const onKeydown = (event) => {
		if (scrolls() || event.target !== list) {
			return;
		}

		const forward = isRtl() ? "ArrowLeft" : "ArrowRight";
		const back = isRtl() ? "ArrowRight" : "ArrowLeft";
		const moves = { [forward]: 1, [back]: -1 };

		if (event.key in moves) {
			event.preventDefault();
			step(moves[event.key], false, true);
		} else if (event.key === "Home" || event.key === "End") {
			event.preventDefault();
			goTo(event.key === "Home" ? 0 : slides - 1, { announce: true });
		}
	};

	// A swipe, where the list doesn't scroll itself. A swipe that starts on a
	// link mustn't follow it, so the click after a swipe is cancelled.
	const onPointerDown = (event) => {
		swipeStart = scrolls() ? null : { x: event.clientX, y: event.clientY };
		swiped = false;
	};
	const onPointerUp = (event) => {
		if (!swipeStart) {
			return;
		}

		const dx = event.clientX - swipeStart.x;
		const dy = event.clientY - swipeStart.y;

		swipeStart = null;

		if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
			swiped = true;
			// Swiping left shows the next slide, or the previous one right to left.
			step(dx < 0 !== isRtl() ? 1 : -1, false, true);
		}
	};
	const onPointerCancel = () => {
		swipeStart = null;
	};
	// Dragging an image or link would start the browser's drag and drop, not a swipe.
	const onDragStart = (event) => {
		if (swipeStart) {
			event.preventDefault();
		}
	};
	const onClick = (event) => {
		if (swiped) {
			swiped = false;
			event.preventDefault();
			event.stopPropagation();
		}
	};

	const onGo = (event) => {
		const { to, loop = false } = event.detail ?? {};

		if (to === "next" || to === "previous") {
			step(to === "next" ? 1 : -1, loop, false);
		} else if (Number.isInteger(to)) {
			goTo(to);
		} else if (to && items.includes(to)) {
			goTo(slideOf(items.indexOf(to)));
		}
	};

	const onPrevious = () => step(-1, false, true);
	const onNext = () => step(1, false, true);

	// Arrows on either side of the dots, in the reading direction.
	controls.append(...[previous, dotList, next, status].filter(Boolean));
	controls.hidden = !arrows && !dots;
	previous?.addEventListener("click", onPrevious);
	next?.addEventListener("click", onNext);

	if (dotList) {
		dotList.className = `${PREFIX}__dots`;
	}

	if (status) {
		status.className = `${PREFIX}__status`;
		status.setAttribute("role", "status");
	}

	// The track needs focus to scroll by keyboard when it holds no link or button.
	const madeFocusable =
		!list.hasAttribute("tabindex") &&
		!list.querySelector("a[href], button");

	if (madeFocusable) {
		list.tabIndex = 0;
	}

	list.addEventListener("scroll", onScroll, { passive: true });
	list.addEventListener("keydown", onKeydown);
	list.addEventListener("pointerdown", onPointerDown);
	list.addEventListener("pointerup", onPointerUp);
	list.addEventListener("pointercancel", onPointerCancel);
	list.addEventListener("dragstart", onDragStart);
	list.addEventListener("click", onClick, true);
	carousel.addEventListener(GO, onGo);

	// The items in view follow the device, and an item's width follows them,
	// so a change of either size re-counts the slides.
	const resize = new view.ResizeObserver(() => schedule());
	const observeSizes = () => {
		resize.disconnect();
		resize.observe(list);
		[...list.children].forEach((item) => resize.observe(item));
	};

	// Items shown, hidden or reordered start again from the first slide.
	// Changes inside an item, such as a caption being typed, don't count.
	const mutation = new view.MutationObserver((records) => {
		if (
			records.some(({ type, target }) =>
				type === "childList"
					? target === list
					: target.parentElement === list
			)
		) {
			observeSizes();
			schedule(true);
		}
	});

	observeSizes();
	mutation.observe(list, {
		childList: true,
		subtree: true,
		attributeFilter: ["hidden"],
	});
	carousel.classList.add(READY);
	measure(true);

	return () => {
		view.clearTimeout(settle);
		view.cancelAnimationFrame(frame);
		resize.disconnect();
		mutation.disconnect();
		list.removeEventListener("scroll", onScroll);
		list.removeEventListener("keydown", onKeydown);
		list.removeEventListener("pointerdown", onPointerDown);
		list.removeEventListener("pointerup", onPointerUp);
		list.removeEventListener("pointercancel", onPointerCancel);
		list.removeEventListener("dragstart", onDragStart);
		list.removeEventListener("click", onClick, true);
		carousel.removeEventListener(GO, onGo);
		[previous, dotList, next, status].forEach((element) =>
			element?.remove()
		);
		items.forEach((item) => item.classList.remove(CURRENT));
		carousel.classList.remove(READY);

		if (madeFocusable) {
			list.removeAttribute("tabindex");
		}
	};
}
