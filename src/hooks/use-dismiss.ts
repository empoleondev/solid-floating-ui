import { createEffect, createMemo, onCleanup } from "solid-js";
import {
	getOverflowAncestors,
	getParentNode,
	isElement,
	isHTMLElement,
	isLastTraversableNode,
} from "@floating-ui/utils/dom";
import {
	contains,
	createAttribute,
	getDocument,
	getTarget,
	isEventTargetWithin,
	isRootElement,
} from "../internal/dom";
import type { FloatingContext } from "./use-floating";

const bubbleHandlerKeys = {
	pointerdown: "onPointerDown",
	mousedown: "onMouseDown",
	click: "onClick",
};

const captureHandlerKeys = {
	pointerdown: "onPointerDownCapture",
	mousedown: "onMouseDownCapture",
	click: "onClickCapture",
};

const normalizeProp = (
	normalizable?: boolean | { escapeKey?: boolean; outsidePress?: boolean },
) => {
	return {
		escapeKey:
			typeof normalizable === "boolean"
				? normalizable
				: (normalizable?.escapeKey ?? false),
		outsidePress:
			typeof normalizable === "boolean"
				? normalizable
				: (normalizable?.outsidePress ?? true),
	};
};

export interface DismissPayload {
  type: 'outsidePress' | 'referencePress' | 'escapeKey' | 'mouseLeave';
  data: {
    returnFocus: boolean | {preventScroll: boolean};
  };
}

interface UseDismissOptions {
	/**
	 * Whether the Hook is enabled, including all internal Effects and event
	 * handlers.
	 * @default true
	 */
	enabled?: boolean;
	/**
	 * Whether to dismiss the floating element upon pressing the `esc` key.
	 * @default true
	 */
	escapeKey?: boolean;
	/**
	 * Whether to dismiss the floating element upon pressing the reference
	 * element. You likely want to ensure the `move` option in the `useHover()`
	 * Hook has been disabled when this is in use.
	 * @default false
	 */
	referencePress?: boolean;
	/**
	 * The type of event to use to determine a "press".
	 * - `pointerdown` is eager on both mouse + touch input.
	 * - `mousedown` is eager on mouse input, but lazy on touch input.
	 * - `click` is lazy on both mouse + touch input.
	 * @default 'pointerdown'
	 */
	referencePressEvent?: "pointerdown" | "mousedown" | "click";
	/**
	 * Whether to dismiss the floating element upon pressing outside of the
	 * floating element.
	 * If you have another element, like a toast, that is rendered outside the
	 * floating element's Solid's tree and don't want the floating element to close
	 * when pressing it, you can guard the check like so:
	 * ```jsx
	 * useDismiss(context, {
	 *   outsidePress: (event) => !event.target.closest('.toast'),
	 * });
	 * ```
	 * @default true
	 */
	outsidePress?: boolean | ((event: MouseEvent) => boolean);
	/**
	 * The type of event to use to determine an outside "press".
	 * - `pointerdown` is eager on both mouse + touch input.
	 * - `mousedown` is eager on mouse input, but lazy on touch input.
	 * - `click` is lazy on both mouse + touch input.
	 * @default 'pointerdown'
	 */
	outsidePressEvent?: "pointerdown" | "mousedown" | "click";
	/**
	 * Whether to dismiss the floating element upon scrolling an overflow
	 * ancestor.
	 * @default false
	 */
	ancestorScroll?: boolean;
	/**
	 * Determines whether event listeners bubble upwards through a tree of
	 * floating elements.
	 */
	bubbles?: boolean | { escapeKey?: boolean; outsidePress?: boolean };
	/**
	 * Determines whether to use capture phase event listeners.
	 */
	capture?: boolean | { escapeKey?: boolean; outsidePress?: boolean };
}

function useDismiss(context: () => FloatingContext, options: UseDismissOptions = {}) {
	const contextData = createMemo(() => context());

	const {
		enabled = true,
		escapeKey = true,
		outsidePress: unstable_outsidePress = true,
		outsidePressEvent = "pointerdown",
		referencePress = false,
		referencePressEvent = "pointerdown",
		ancestorScroll = false,
		bubbles,
		capture,
	} = options;

	const outsidePressFn = createMemo(() =>
		typeof unstable_outsidePress === "function"
			? unstable_outsidePress
			: () => false,
	);

	const outsidePress = createMemo(() =>
		typeof unstable_outsidePress === "function"
			? outsidePressFn()
			: unstable_outsidePress,
	);

	let insideReactTree = false;
	let endedOrStartedInside = false;

	const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } =
		normalizeProp(bubbles);
	const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } =
		normalizeProp(capture);

	const closeOnEscapeKeyDown = (event: KeyboardEvent) => {
		const { open, onOpenChange } = contextData();

		if (!open || !enabled || !escapeKey || event.key !== "Escape") {
			return;
		}

		if (!escapeKeyBubbles) {
			event.stopPropagation();
		}

		onOpenChange(false, event, "escape-key");
	};

	const closeOnEscapeKeyDownCapture = (event: KeyboardEvent) => {
		const callback = () => {
			closeOnEscapeKeyDown(event);
			getTarget(event)?.removeEventListener("keydown", callback);
		};
		getTarget(event)?.addEventListener("keydown", callback);
	};

	const closeOnPressOutside = (event: MouseEvent) => {
		const { open, onOpenChange, elements: { reference, floating } } = contextData();

		// Given developers can stop the propagation of the synthetic event,
		// we can only be confident with a positive value.
		const insideReactTreeLocal = insideReactTree;
		insideReactTree = false;

		// When click outside is lazy (`click` event), handle dragging.
		// Don't close if:
		// - The click started inside the floating element.
		// - The click ended inside the floating element.
		const endedOrStartedInsideLocal = endedOrStartedInside;
		endedOrStartedInside = false;

		if (outsidePressEvent === "click" && endedOrStartedInsideLocal) {
			return;
		}

		if (insideReactTreeLocal) {
			return;
		}

		const outsidePressValue = outsidePress();
		if (typeof outsidePressValue === "function" && !outsidePressValue(event)) {
			return;
		}

		const target = getTarget(event);
		const inertSelector = `[${createAttribute("inert")}]`;
		const markers = getDocument(floating).querySelectorAll(inertSelector);

		let targetRootAncestor = isElement(target) ? target : null;
		while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
			const nextParent = getParentNode(targetRootAncestor);
			if (isLastTraversableNode(nextParent) || !isElement(nextParent)) {
				break;
			}

			targetRootAncestor = nextParent;
		}

		// Check if the click occurred on a third-party element injected after the
		// floating element rendered.
		if (
			markers.length &&
			isElement(target) &&
			!isRootElement(target) &&
			// Clicked on a direct ancestor (e.g. FloatingOverlay).
			!contains(target, floating) &&
			// If the target root element contains none of the markers, then the
			// element was injected after the floating element rendered.
			Array.from(markers).every(
				(marker) => !contains(targetRootAncestor, marker),
			)
		) {
			return;
		}

		// Check if the click occurred on the scrollbar
		if (isHTMLElement(target) && floating) {
			// In Firefox, `target.scrollWidth > target.clientWidth` for inline
			// elements.
			const canScrollX =
				target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
			const canScrollY =
				target.clientHeight > 0 && target.scrollHeight > target.clientHeight;

			let xCond = canScrollY && event.offsetX > target.clientWidth;

			// In some browsers it is possible to change the <body> (or window)
			// scrollbar to the left side, but is very rare and is difficult to
			// check for. Plus, for modal dialogs with backdrops, it is more
			// important that the backdrop is checked but not so much the window.
			if (canScrollY) {
				const isRTL = getComputedStyle(target).direction === "rtl";

				if (isRTL) {
					xCond = event.offsetX <= target.offsetWidth - target.clientWidth;
				}
			}

			if (xCond || (canScrollX && event.offsetY > target.clientHeight)) {
				return;
			}
		}

		if (
			isEventTargetWithin(event, floating) ||
			// @ts-expect-error - FIXME
			isEventTargetWithin(event, reference)
		) {
			return;
		}

		onOpenChange(false, event, "outside-press");
	};

	const closeOnPressOutsideCapture = (event: MouseEvent) => {
		const callback = () => {
			closeOnPressOutside(event);
			getTarget(event)?.removeEventListener(outsidePressEvent, callback);
		};
		getTarget(event)?.addEventListener(outsidePressEvent, callback);
	};

	createEffect(() => {
		const { open, elements: { reference, floating }, setData } = contextData();

		if (!open || !enabled) {
			return;
		}

		setData("__escapeKeyBubbles", escapeKeyBubbles);
		setData("__outsidePressBubbles", outsidePressBubbles);

		function onScroll(event: Event) {
			const { onOpenChange } = contextData();
			onOpenChange(false, event, "ancestor-scroll");
		}

		const doc = getDocument(floating);
		escapeKey &&
			doc.addEventListener(
				"keydown",
				escapeKeyCapture ? closeOnEscapeKeyDownCapture : closeOnEscapeKeyDown,
				escapeKeyCapture,
			);
		outsidePress() &&
			doc.addEventListener(
				outsidePressEvent,
				outsidePressCapture ? closeOnPressOutsideCapture : closeOnPressOutside,
				outsidePressCapture,
			);

		let ancestors: (Element | Window | VisualViewport)[] = [];

		if (ancestorScroll) {
			if (isElement(reference)) {
				ancestors = getOverflowAncestors(reference);
			}

			if (isElement(floating)) {
				ancestors = ancestors.concat(getOverflowAncestors(floating));
			}

			if (!isElement(reference) && reference && reference.contextElement) {
				ancestors = ancestors.concat(
					getOverflowAncestors(reference.contextElement),
				);
			}
		}

		// Ignore the visual viewport for scrolling dismissal (allow pinch-zoom)
		ancestors = ancestors.filter(
			(ancestor) => ancestor !== doc.defaultView?.visualViewport,
		);

		for (const ancestor of ancestors) {
			ancestor.addEventListener("scroll", onScroll, { passive: true });
		}

		onCleanup(() => {
			escapeKey &&
				doc.removeEventListener(
					"keydown",
					escapeKeyCapture ? closeOnEscapeKeyDownCapture : closeOnEscapeKeyDown,
					escapeKeyCapture,
				);
			outsidePress() &&
				doc.removeEventListener(
					outsidePressEvent,
					outsidePressCapture
						? closeOnPressOutsideCapture
						: closeOnPressOutside,
					outsidePressCapture,
				);
			for (const ancestor of ancestors) {
				ancestor.removeEventListener("scroll", onScroll);
			}
		});
	});

	createEffect(() => {
		// Track dependencies for reactive updates
		outsidePress();
		outsidePressEvent;
		insideReactTree = false;
	});

	const referenceHandlers = createMemo(() => {
		if (!enabled) {
			return {};
		}

		return {
			onKeyDown: closeOnEscapeKeyDown,
			[bubbleHandlerKeys[referencePressEvent]]: (event: Event) => {
				if (referencePress) {
					const { onOpenChange } = contextData();
					onOpenChange(false, event, "reference-press");
				}
			},
		};
	});

	const floatingHandlers = createMemo(() => {
		if (!enabled) {
			return {};
		}

		return {
			onKeyDown: closeOnEscapeKeyDown,
			onMouseDown() {
				endedOrStartedInside = true;
			},
			onMouseUp() {
				endedOrStartedInside = true;
			},
			[captureHandlerKeys[outsidePressEvent]]: () => {
				insideReactTree = true;
			},
		};
	});

	return {
		get reference() {
			return referenceHandlers();
		},
		get floating() {
			return floatingHandlers();
		},
	};
}

export type { UseDismissOptions };
export { useDismiss };
