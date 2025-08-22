import { isHTMLElement } from "@floating-ui/utils/dom";
import { isMouseLikePointerType } from "../internal/dom";
import { isTypeableElement } from "../internal/is-typable-element";
import { createMemo } from "solid-js";
import type { FloatingContext } from "./use-floating";
import type { ElementProps } from "./use-interactions";

interface UseClickOptions {
	/**
	 * Whether the Hook is enabled, including all internal Effects and event
	 * handlers.
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * The type of event to use to determine a "click" with mouse input.
	 * Keyboard clicks work as normal.
	 * @default 'click'
	 */
	event?: "click" | "mousedown";

	/**
	 * Whether to toggle the open state with repeated clicks.
	 * @default true
	 */
	toggle?: boolean;

	/**
	 * Whether to ignore the logic for mouse input (for example, if `useHover()`
	 * is also being used).
	 * When `useHover()` and `useClick()` are used together, clicking the
	 * reference element after hovering it will keep the floating element open
	 * even once the cursor leaves. This may be not be desirable in some cases.
	 * @default false
	 */
	ignoreMouse?: boolean;

	/**
	 * Whether to add keyboard handlers (Enter and Space key functionality) for
	 * non-button elements (to open/close the floating element via keyboard
	 * "click").
	 * @default true
	 */
	keyboardHandlers?: boolean;
}

function hasNativeClickBehavior(event: KeyboardEvent) {
  return isHTMLElement(event.target) && 
         (event.target.tagName === "BUTTON" || event.target.tagName === "A");
}

function isSpaceIgnored(element: Element | null) {
	return isTypeableElement(element);
}

function useClick(
	context: FloatingContext,
	options: UseClickOptions = {},
): () => ElementProps {
	const contextMemo = createMemo(() => context);
	const optionsMemo = createMemo(() => options);

	const {
		open,
		onOpenChange,
		data,
		elements: { reference },
	} = contextMemo();

	const {
		enabled = true,
		event: eventOption = "click",
		toggle = true,
		ignoreMouse = false,
		keyboardHandlers = true,
	} = optionsMemo();

	let pointerType: PointerEvent["pointerType"] | undefined = undefined;
	let didKeyDown = false;

	return createMemo(() => ({
		get reference() {
			if (!enabled) {
				return {};
			}
			return {
				onPointerDown: (event: PointerEvent) => {
					pointerType = event.pointerType;
				},
				onMouseDown: (event: MouseEvent) => {
					if (event.button !== 0) {
						return;
					}

					if (isMouseLikePointerType(pointerType, true) && ignoreMouse) {
						return;
					}

					if (eventOption === "click") {
						return;
					}

					if (
						open &&
						toggle &&
						(data.openEvent ? data.openEvent.type === "mousedown" : true)
					) {
						onOpenChange(false, event, "click");
					} else {
						// Prevent stealing focus from the floating element
						event.preventDefault();
						onOpenChange(true, event, "click");
					}
				},
				onClick: (event: MouseEvent) => {
					if (eventOption === "mousedown" && pointerType) {
						pointerType = undefined;
						return;
					}

					if (isMouseLikePointerType(pointerType, true) && ignoreMouse) {
						return;
					}

          const currentOpen = contextMemo().open;

					if (
						currentOpen &&
						toggle &&
						(data.openEvent ? data.openEvent.type === "click" : true)
					) {
						onOpenChange(false, event, "click");
					} else {
						onOpenChange(true, event, "click");
					}
				},
				onKeyDown: (event: KeyboardEvent) => {
					pointerType = undefined;

					if (
						event.defaultPrevented ||
						!keyboardHandlers ||
						hasNativeClickBehavior(event)
					) {
						return;
					}

          // only treat it as “space click” if reference is a real HTMLElement
        //   const el = isHTMLElement(reference) ? reference : null;
		const el = isHTMLElement(event.target) ? event.target : null;

					if (event.key === " " && !isSpaceIgnored(el)) {
						// Prevent scrolling
						event.preventDefault();
						didKeyDown = true;
					}

          const currentOpen = contextMemo().open;

					if (event.key === "Enter") {
						if (currentOpen && toggle) {
							onOpenChange(false, event, "click");
						} else {
							onOpenChange(true, event, "click");
						}
					}
				},
				onKeyUp: (event: KeyboardEvent) => {
        //   const el = isHTMLElement(reference) ? reference : null;
		const el = isHTMLElement(event.target) ? event.target : null;


					if (
						event.defaultPrevented ||
						!keyboardHandlers ||
						hasNativeClickBehavior(event) ||
						isSpaceIgnored(el)
					) {
						return;
					}

          const currentOpen = contextMemo().open;

					if (event.key === " " && didKeyDown) {
						didKeyDown = false;
						if (currentOpen && toggle) {
							onOpenChange(false, event, "click");
						} else {
							onOpenChange(true, event, "click");
						}
					}
				},
			};
		},
	}));
}

export type { UseClickOptions };
export { useClick };
