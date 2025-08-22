import { createEffect, createMemo, onCleanup } from "solid-js";
import { isElement } from "@floating-ui/utils/dom";
import {
	contains,
	createAttribute,
	getDocument,
	isMouseLikePointerType,
} from "../internal/dom";
import { noop } from "../internal/noop";
import type { OpenChangeReason } from "../types";
import type { FloatingContext } from "./use-floating";
import type { ElementProps } from "./use-interactions";

interface DelayOptions {
	/**
	 * Time in ms that will delay the change of the open state to true.
	 * @default 0
	 */
	open?: number;

	/**
	 * Time in ms that will delay the change of the open state to false.
	 * @default 0
	 */
	close?: number;
}

interface HandleCloseFn {
	(
		context: FloatingContext & {
			onClose: () => void;
			leave?: boolean;
		},
	): (event: MouseEvent) => void;
	__options: {
		blockPointerEvents: boolean;
	};
}

interface UseHoverOptions {
	/**
	 * Enables/disables the hook.
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Only allow pointers of type mouse to trigger the hover (thus excluding pens and touchscreens).
	 * @default false
	 */
	mouseOnly?: boolean;

	/**
	 * Time in ms that will delay the change of the open state.
	 * @default 0
	 */
	delay?: number | DelayOptions;

	/**
	 * Time in ms that the pointer must rest on the reference element before the open state is set to true.
	 * @default 0
	 */
	restMs?: number;

	/**
	 * Whether moving the pointer over the floating element will open it, without a regular hover event required.
	 * @default true
	 */
	move?: boolean;

	/**
	 * Callback to handle the closing of the floating element.
	 * @default null
	 */
	handleClose?: HandleCloseFn | null;
}

const safePolygonIdentifier = createAttribute("safe-polygon");
const MOVEMENT_THRESHOLD = 5; // Movement threshold in pixels


export function getDelay(
	value: UseHoverOptions["delay"],
	prop: "open" | "close",
	pointerType?: PointerEvent["pointerType"],
) {
	if (pointerType && !isMouseLikePointerType(pointerType)) {
		return 0;
	}

	if (typeof value === "number") {
		return value;
	}

	const result = value?.[prop];
	return result;
}

function useHover(
	context: () => FloatingContext,
	options: () => UseHoverOptions = () => ({}),
): () => ElementProps {
	return createMemo(() => {
		const ctx = context();
		const opts = options(); // This needs to be reactive - called every time

		const {
			open,
			onOpenChange,
			data,
			events,
			elements: { reference, floating },
		} = ctx;

		const {
			enabled = true,
			mouseOnly = false,
			delay = 0,
			restMs = 0,
			move = true,
			handleClose = null,
		} = opts;

		let pointerType: string | undefined = undefined;
		let timeout = -1;
		let handler: ((event: MouseEvent) => void) | undefined = undefined;
		let restTimeout = -1;
		let blockMouseMove = true;
		let performedPointerEventsMutation = false;
		let unbindMouseMove = noop;

		const isHoverOpen = createMemo(() => {
			const type = data.openEvent?.type;
			return type?.includes("mouse") && type !== "mousedown";
		});

		const isClickLikeOpenEvent = createMemo(() =>
			data.openEvent
				? ["click", "mousedown"].includes(data.openEvent.type)
				: false,
		);

		createEffect(() => {
			if (!enabled) {
				return;
			}

			const onOpenChangeHandler = ({ open }: { open: boolean }) => {
				if (!open) {
					clearTimeout(timeout);
					clearTimeout(restTimeout);
					blockMouseMove = true;
				}
			};

			events.on("openchange", onOpenChangeHandler);
			onCleanup(() => {
				events.off("openchange", onOpenChangeHandler);
			});
		});

		createEffect(() => {
			if (enabled || !handleClose || !open) {
				return;
			}

			const onLeave = (event: MouseEvent) => {
				if (!isHoverOpen()) {
					return;
				}
				onOpenChange(false, event, "hover");
			};

			const document = getDocument(floating);
			document.addEventListener("mouseleave", onLeave);
			onCleanup(() => {
				document.removeEventListener("mouseleave", onLeave);
			});
		});

		const closeWithDelay = (
			event: Event,
			runElseBranch = true,
			reason: OpenChangeReason = "hover",
		) => {
			const currentDelay = options().delay || 0;
			const closeDelay = getDelay(currentDelay, "close", pointerType);
			if (closeDelay && !handler) {
				clearTimeout(timeout);
				timeout = window.setTimeout(
					() => {
						onOpenChange(false, event, reason);
					},
					closeDelay,
				);
			} else if (runElseBranch) {
				clearTimeout(timeout);
				onOpenChange(false, event, reason);
			}
		};

		const cleanupMouseMoveHandler = () => {
			unbindMouseMove();
			handler = undefined;
		};

		const clearPointerEvents = () => {
			if (!performedPointerEventsMutation) {
				return;
			}
			const body = getDocument(floating).body;
			body.style.pointerEvents = "";
			body.removeAttribute(safePolygonIdentifier);
			performedPointerEventsMutation = false;
		};

		// Block pointer-events of every element other than the reference and floating
		// while the floating element is open and has a `handleClose` handler. Also
		// handles nested floating elements.
		// https://github.com/floating-ui/floating-ui/issues/1722
		createEffect(() => {
			if (!enabled) {
				return;
			}

			if (open && handleClose?.__options.blockPointerEvents && isHoverOpen()) {
				const body = getDocument(floating).body;
				body.setAttribute(safePolygonIdentifier, "");
				body.style.pointerEvents = "none";
				performedPointerEventsMutation = true;

				if (isElement(reference) && floating) {
					const ref = reference as unknown as HTMLElement | SVGSVGElement;

					// const parentFloating = tree?.nodesRef.current.find((node) => node.id === parentId)?.context
					// 	?.elements.floating;

					// if (parentFloating) {
					// 	parentFloating.style.pointerEvents = '';
					// }

					ref.style.pointerEvents = "auto";
					floating.style.pointerEvents = "auto";

					onCleanup(() => {
						ref.style.pointerEvents = "";
						floating.style.pointerEvents = "";
					});
				}
			}
		});

		createEffect(() => {
			if (!open) {
				pointerType = undefined;
				cleanupMouseMoveHandler();
				clearPointerEvents();
			}
		});

		onCleanup(() => {
			cleanupMouseMoveHandler();
			clearTimeout(timeout);
			clearTimeout(restTimeout);
			clearPointerEvents();
		});

		return {
			get reference() {
				if (!enabled) {
					return {};
				}


				const onmouseenter = (event: MouseEvent) => {
					const currentDelay = options().delay || 0;
					clearTimeout(timeout);
					blockMouseMove = false;

					if (
						(mouseOnly && !isMouseLikePointerType(pointerType)) ||
						(restMs > 0 && !getDelay(currentDelay, "open"))
					) {
						return;
					}

					const openDelay = getDelay(currentDelay, "open", pointerType);

					if (openDelay) {
						timeout = window.setTimeout(() => {
            const currentRef = ctx.elements.reference;
            if (currentRef && document.contains(currentRef as Node)) {
              onOpenChange(true, event, "hover");
            }
          }, openDelay);
			} else {
				onOpenChange(true, event, "hover");
			}
				};

				const handlers = {
					onpointerdown: (event: PointerEvent) => {
						pointerType = event.pointerType;
					},
					onpointerenter: (event: PointerEvent) => {
						pointerType = event.pointerType;
					},
					onmouseenter,					
					onmousemove: (event: MouseEvent) => {
						if (move) {
							onmouseenter(event);
						}
						function handleMouseMove() {
							if (!blockMouseMove) {
							onOpenChange(true, event, "hover");
							}
						}

						if (mouseOnly && !isMouseLikePointerType(pointerType)) {
							return;
						}

						if (open || restMs === 0) {
							return;
						}

						if (pointerType === "touch") {
							clearTimeout(restTimeout);
							handleMouseMove();
							return;
						}

						const movementX = Math.abs(event.movementX || 0);
						const movementY = Math.abs(event.movementY || 0);
						const totalMovement = Math.sqrt(movementX * movementX + movementY * movementY);
						
						// Only reset the timer if movement is significant
						if (totalMovement >= MOVEMENT_THRESHOLD) {
							clearTimeout(restTimeout);
							restTimeout = window.setTimeout(handleMouseMove, restMs);
						} else {
							// For minor movement, don't reset the timer but ensure one is set if none exists
							if (restTimeout === -1) {
							restTimeout = window.setTimeout(handleMouseMove, restMs);
							}
						}
					},
					onmouseleave: (event: MouseEvent) => {
						if (!isClickLikeOpenEvent()) {
							unbindMouseMove();

							const doc = getDocument(floating);
							clearTimeout(restTimeout);

							if (handleClose) {
								if (!open) {
									clearTimeout(timeout);
								}

								handler = handleClose({
									...ctx,
									x: event.clientX,
									y: event.clientY,
									onClose() {
										clearPointerEvents();
										cleanupMouseMoveHandler();
										closeWithDelay(event, true, "safe-polygon");
									},
								});

								const localHandler = handler;

								doc.addEventListener("mousemove", localHandler);
								unbindMouseMove = () => {
									doc.removeEventListener("mousemove", localHandler);
								};

								return;
							}

							// Allow interactivity without `safePolygon` on touch devices. With a
							// pointer, a short close delay is an alternative, so it should work
							// consistently.
							const shouldClose =
								pointerType === "touch"
									? !contains(floating, event.relatedTarget as Element | null)
									: true;
							if (shouldClose) {
								closeWithDelay(event);
							}
						}

						if (open && !isClickLikeOpenEvent()) {
							handleClose?.({
								...ctx,
								// tree,
								x: event.clientX,
								y: event.clientY,
								onClose() {
									clearPointerEvents();
									cleanupMouseMoveHandler();
									closeWithDelay(event);
								},
							})(event);
						}
					},
				};

				return handlers;
			},

			get floating() {
				if (!enabled) {
					return {};
				}
				return {
					onmouseenter() {
						clearTimeout(timeout);
					},
					onmouseleave(event: MouseEvent) {
						if (!isClickLikeOpenEvent()) {
							handleClose?.({
								...ctx,
								// tree,
								x: event.clientX,
								y: event.clientY,
								onClose() {
									clearPointerEvents();
									cleanupMouseMoveHandler();
									closeWithDelay(event);
								},
							})(event);
						}
						closeWithDelay(event, false);
					},
				};
			},
		};
	});
}

export type { UseHoverOptions };
export { useHover };