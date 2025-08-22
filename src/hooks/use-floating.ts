// import {
// 	type ComputePositionConfig,
// 	type FloatingElement,
// 	type Middleware,
// 	type MiddlewareData,
// 	type Placement,
// 	type ReferenceElement,
// 	type Strategy,
// 	computePosition,
// } from "@floating-ui/dom";
// import { createMemo, createEffect, Accessor } from "solid-js";
// import { createStore, type SetStoreFunction } from "solid-js/store";
// import { createPubSub } from "../internal/create-pub-sub";
// import { getDPR, roundByDPR } from "../internal/dpr";
// import { noop } from "../internal/noop";
// import { styleObjectToString } from "../internal/style-object-to-string";
// import type { OpenChangeReason } from "../types";
// import { useId } from "./use-id";

// interface FloatingElements {
// 	/**
// 	 * The reference element.
// 	 */
// 	reference?: ReferenceElement | null;

// 	/**
// 	 * The floating element.
// 	 */
// 	floating?: FloatingElement | null;
// }

// interface UseFloatingOptions {
// 	/**
// 	 * Represents the open/close state of the floating element.
// 	 * @default true
// 	 */
// 	open?: Accessor<boolean> | boolean;

// 	/**
// 	 * Callback that is called whenever the open state changes.
// 	 */
// 	onOpenChange?: (
// 		open: boolean,
// 		event?: Event,
// 		reason?: OpenChangeReason,
// 	) => void;

// 	/**
// 	 * Where to place the floating element relative to its reference element.
// 	 * @default 'bottom'
// 	 */
// 	placement?: Accessor<Placement> | Placement;

// 	/**
// 	 * The type of CSS position property to use.
// 	 * @default 'absolute'
// 	 */
// 	strategy?: Accessor<Strategy> | Strategy;

// 	/**
// 	 * These are plain objects that modify the positioning coordinates in some fashion, or provide useful data for the consumer to use.
// 	 * @default []
// 	 */
// 	middleware?: Accessor<Array<Middleware | undefined | null | false>> | Array<Middleware | undefined | null | false>;

// 	/**
// 	 * Whether to use `transform` instead of `top` and `left` styles to
// 	 * position the floating element (`floatingStyles`).
// 	 * @default true
// 	 */
// 	transform?: Accessor<boolean> | boolean;

// 	/**
// 	 * Object containing the floating and reference elements.
// 	 * @default {}
// 	 */
// 	elements?: Accessor<FloatingElements> | FloatingElements;

// 	/**
// 	 * Callback to handle mounting/unmounting of the elements.
// 	 * @default undefined
// 	 */
// 	whileElementsMounted?: (
// 		reference: ReferenceElement,
// 		floating: FloatingElement,
// 		update: () => void,
// 	) => () => void;

// 	/**
// 	 * Unique node id when using `FloatingTree`.
// 	 * @default undefined
// 	 */
// 	nodeId?: Accessor<string | undefined> | string;
// }

// interface UseFloatingData {
// 	/**
// 	 * The x-coordinate of the floating element.
// 	 */
// 	x: number;

// 	/**
// 	 * The y-coordinate of the floating element.
// 	 */
// 	y: number;

// 	/**
// 	 * The stateful placement, which can be different from the initial `placement` passed as options.
// 	 */
// 	placement: Placement;

// 	/**
// 	 * The stateful strategy, which can be different from the initial `strategy` passed as options.
// 	 */
// 	strategy: Strategy;

// 	/**
// 	 * Additional data from middleware.
// 	 */
// 	middlewareData: MiddlewareData;

// 	/**
// 	 * The boolean that let you know if the floating element has been positioned.
// 	 */
// 	isPositioned: boolean;
// }

// interface FloatingEvents {
// 	// biome-ignore lint/suspicious/noExplicitAny: From the port
// 	emit<T extends string>(event: T, data?: any): void;
// 	// biome-ignore lint/suspicious/noExplicitAny: From the port
// 	on(event: string, handler: (data: any) => void): void;
// 	// biome-ignore lint/suspicious/noExplicitAny: From the port
// 	off(event: string, handler: (data: any) => void): void;
// }

// interface ContextData {
// 	/**
// 	 * The latest even that caused the open state to change.
// 	 */
// 	openEvent?: Event;

// 	/**
// 	 * Arbitrary data produced and consumed by other hooks.
// 	 */
// 	[key: string]: unknown;
// }

// interface FloatingContext extends UseFloatingData {
// 	/**
// 	 * Represents the open/close state of the floating element.
// 	 */
// 	open: boolean;

// 	/**
// 	 * Callback that is called whenever the open state changes.
// 	 */
// 	onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason): void;

// 	/**
// 	 * Events for other hooks to consume.
// 	 */
// 	events: FloatingEvents;

// 	/**
// 	 * Arbitrary data produced and consumer by other hooks.
// 	 */
// 	data: ContextData;

//   /**
// 	 * The setter for the data store.
// 	 */
// 	setData: SetStoreFunction<ContextData>;

// 	/**
// 	 * The id for the reference element
// 	 */
// 	nodeId: string | undefined;

// 	/**
// 	 * The id for the floating element
// 	 */
// 	floatingId: string;

// 	/**
// 	 * Object containing the floating and reference elements.
// 	 */
// 	elements: FloatingElements;
// }

// interface UseFloatingReturn extends UseFloatingData {
// 	/**
// 	 * Represents the open/close state of the floating element.
// 	 */
// 	readonly open: boolean;

// 	/**
// 	 * CSS styles to apply to the floating element to position it.
// 	 */
// 	readonly floatingStyles: string;

// 	/**
// 	 * The reference and floating elements.
// 	 */
// 	readonly elements: FloatingElements;

// 	/**
// 	 * Updates the floating element position.
// 	 */
// 	readonly update: () => Promise<void>;

// 	/**
// 	 * Additional context meant for other hooks to consume.
// 	 */
// 	readonly context: FloatingContext;
// }

// // Helper function to resolve accessor or value
// function resolveAccessor<T>(value: Accessor<T> | T): T {
// 	return typeof value === 'function' ? (value as Accessor<T>)() : value;
// }

// /**
//  * Hook for managing floating elements.
//  */
// function useFloating(options: UseFloatingOptions = {}): UseFloatingReturn {
// 	const [elements, setElements] = createStore<FloatingElements>(
// 		resolveAccessor(options.elements) ?? {}
// 	);

// 	// Create reactive getters for options
// 	const placement = createMemo(() => resolveAccessor(options.placement) ?? "bottom");
// 	const strategy = createMemo(() => resolveAccessor(options.strategy) ?? "absolute");
// 	const middleware = createMemo(() => resolveAccessor(options.middleware) ?? []);
// 	const transform = createMemo(() => resolveAccessor(options.transform) ?? true);
// 	const open = createMemo(() => resolveAccessor(options.open) ?? true);
// 	const nodeId = createMemo(() => resolveAccessor(options.nodeId));
// 	const onOpenChange = options.onOpenChange ?? noop;
// 	const whileElementsMounted = options.whileElementsMounted;

// 	const [state, setState] = createStore<UseFloatingData>({
// 		x: 0,
// 		y: 0,
// 		strategy: strategy(),
// 		placement: placement(),
// 		middlewareData: {},
// 		isPositioned: false,
// 	});

// 	const floatingStyles = createMemo(() => {
// 		const initialStyles = {
// 			position: strategy(),
// 			left: "0px",
// 			top: "0px",
// 		};

// 		if (!elements.floating) {
// 			return styleObjectToString(initialStyles);
// 		}

// 		const x = roundByDPR(elements.floating, state.x);
// 		const y = roundByDPR(elements.floating, state.y);

// 		if (transform()) {
// 			return styleObjectToString({
// 				...initialStyles,
// 				transform: `translate(${x}px, ${y}px)`,
// 				...(getDPR(elements.floating) >= 1.5 && { willChange: "transform" }),
// 			});
// 		}

// 		return styleObjectToString({
// 			position: strategy(),
// 			left: `${x}px`,
// 			top: `${y}px`,
// 		});
// 	});

// 	const events = createPubSub();
// 	const [data, setData] = createStore<ContextData>({});

// 	const handleOpenChange = (
// 		open: boolean,
// 		event?: Event,
// 		reason?: OpenChangeReason,
// 	) => {
// 		setData("openEvent", open ? event : undefined);
// 		events.emit("openchange", { open, event, reason });
// 		onOpenChange(open, event, reason);
// 	};

// 	const update = async () => {
// 		if (!elements.floating || !elements.reference) {
// 			return;
// 		}

// 		const config: ComputePositionConfig = {
// 			placement: placement(),
// 			strategy: strategy(),
// 			middleware: middleware(),
// 		};

// 		const position = await computePosition(
// 			elements.reference,
// 			elements.floating,
// 			config,
// 		);

// 		setState({
// 			x: position.x,
// 			y: position.y,
// 			placement: position.placement,
// 			strategy: position.strategy,
// 			middlewareData: position.middlewareData,
// 			isPositioned: true,
// 		});
// 	};

// 	const context: FloatingContext = {
// 		get data() { return data; },
//     setData: setData,
// 		events,
// 		get elements() { return elements; },
// 		onOpenChange: handleOpenChange,
// 		floatingId: useId(),
// 		get nodeId() { return nodeId(); },
// 		get x() { return state.x; },
// 		get y() { return state.y; },
// 		get placement() { return state.placement; },
// 		get strategy() { return state.strategy; },
// 		get middlewareData() { return state.middlewareData; },
// 		get isPositioned() { return state.isPositioned; },
// 		get open() { return open(); },
// 	};

// 	// Effects to handle element updates
// 	createEffect(() => {
// 		const optionsElements = resolveAccessor(options.elements);
// 		if (optionsElements?.reference) {
// 			setElements("reference", optionsElements.reference);
// 		}
// 	});

// 	createEffect(() => {
// 		const optionsElements = resolveAccessor(options.elements);
// 		if (optionsElements?.floating) {
// 			setElements("floating", optionsElements.floating);
// 		}
// 	});

// 	// Effect to handle positioning state
// 	createEffect(() => {
// 		if (open() || !state.isPositioned) {
// 			return;
// 		}
// 		setState("isPositioned", false);
// 	});

// 	// Effect to handle mounting and updates
// 	createEffect(() => {
// 		if (!elements.floating || !elements.reference) {
// 			return;
// 		}

// 		if (!whileElementsMounted) {
// 			update();
// 			return;
// 		}

// 		const cleanup = whileElementsMounted(elements.reference, elements.floating, update);
// 		return cleanup;
// 	});

// 	return {
// 		update,
// 		context,
// 		get elements() { return elements; },
// 		get x() { return state.x; },
// 		get y() { return state.y; },
// 		get placement() { return state.placement; },
// 		get strategy() { return state.strategy; },
// 		get middlewareData() { return state.middlewareData; },
// 		get isPositioned() { return state.isPositioned; },
// 		get open() { return open(); },
// 		get floatingStyles() { return floatingStyles(); },
// 	};
// }

// export type { UseFloatingOptions, UseFloatingReturn, FloatingContext };
// export { useFloating };

import {
	type ComputePositionConfig,
	type FloatingElement,
	type Middleware,
	type MiddlewareData,
	type Placement,
	type ReferenceElement,
	type Strategy,
	computePosition,
} from "@floating-ui/dom";
import { createMemo, createEffect, Accessor } from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import { createPubSub } from "../internal/create-pub-sub";
import { getDPR, roundByDPR } from "../internal/dpr";
import { noop } from "../internal/noop";
import { styleObjectToString } from "../internal/style-object-to-string";
import type { OpenChangeReason } from "../types";
import { useId } from "./use-id";

interface FloatingElements {
	/**
	 * The reference element.
	 */
	reference?: ReferenceElement | null;

	/**
	 * The floating element.
	 */
	floating?: FloatingElement | null;
}

interface UseFloatingOptions {
	/**
	 * Represents the open/close state of the floating element.
	 * @default true
	 */
	open?: Accessor<boolean> | boolean;

	/**
	 * Callback that is called whenever the open state changes.
	 */
	onOpenChange?: (
		open: boolean,
		event?: Event,
		reason?: OpenChangeReason,
	) => void;

	/**
	 * Where to place the floating element relative to its reference element.
	 * @default 'bottom'
	 */
	placement?: Accessor<Placement> | Placement;

	/**
	 * The type of CSS position property to use.
	 * @default 'absolute'
	 */
	strategy?: Accessor<Strategy> | Strategy;

	/**
	 * These are plain objects that modify the positioning coordinates in some fashion, or provide useful data for the consumer to use.
	 * @default []
	 */
	middleware?: Accessor<Array<Middleware | undefined | null | false>> | Array<Middleware | undefined | null | false>;

	/**
	 * Whether to use `transform` instead of `top` and `left` styles to
	 * position the floating element (`floatingStyles`).
	 * @default true
	 */
	transform?: Accessor<boolean> | boolean;

	/**
	 * Object containing the floating and reference elements.
	 * @default {}
	 */
	elements?: Accessor<FloatingElements> | FloatingElements;

	/**
	 * Callback to handle mounting/unmounting of the elements.
	 * @default undefined
	 */
	whileElementsMounted?: (
		reference: ReferenceElement,
		floating: FloatingElement,
		update: () => void,
	) => () => void;

	/**
	 * Unique node id when using `FloatingTree`.
	 * @default undefined
	 */
	nodeId?: Accessor<string | undefined> | string;
}

interface UseFloatingData {
	/**
	 * The x-coordinate of the floating element.
	 */
	x: number;

	/**
	 * The y-coordinate of the floating element.
	 */
	y: number;

	/**
	 * The stateful placement, which can be different from the initial `placement` passed as options.
	 */
	placement: Placement;

	/**
	 * The stateful strategy, which can be different from the initial `strategy` passed as options.
	 */
	strategy: Strategy;

	/**
	 * Additional data from middleware.
	 */
	middlewareData: MiddlewareData;

	/**
	 * The boolean that let you know if the floating element has been positioned.
	 */
	isPositioned: boolean;
}

interface FloatingEvents {
	// biome-ignore lint/suspicious/noExplicitAny: From the port
	emit<T extends string>(event: T, data?: any): void;
	// biome-ignore lint/suspicious/noExplicitAny: From the port
	on(event: string, handler: (data: any) => void): void;
	// biome-ignore lint/suspicious/noExplicitAny: From the port
	off(event: string, handler: (data: any) => void): void;
}

interface ContextData {
	/**
	 * The latest even that caused the open state to change.
	 */
	openEvent?: Event;

	/**
	 * Arbitrary data produced and consumed by other hooks.
	 */
	[key: string]: unknown;
}

interface FloatingContext extends UseFloatingData {
	/**
	 * Represents the open/close state of the floating element.
	 */
	open: boolean;

	/**
	 * Callback that is called whenever the open state changes.
	 */
	onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason): void;

	/**
	 * Events for other hooks to consume.
	 */
	events: FloatingEvents;

	/**
	 * Arbitrary data produced and consumer by other hooks.
	 */
	data: ContextData;

  /**
	 * The setter for the data store.
	 */
	setData: SetStoreFunction<ContextData>;

	/**
	 * The id for the reference element
	 */
	nodeId: string | undefined;

	/**
	 * The id for the floating element
	 */
	floatingId: string;

	/**
	 * Object containing the floating and reference elements.
	 */
	elements: FloatingElements;
}

interface UseFloatingReturn extends UseFloatingData {
	/**
	 * Represents the open/close state of the floating element.
	 */
	readonly open: boolean;

	/**
	 * CSS styles to apply to the floating element to position it.
	 */
	readonly floatingStyles: string;

	/**
	 * The reference and floating elements.
	 */
	readonly elements: FloatingElements;

	/**
	 * Updates the floating element position.
	 */
	readonly update: () => Promise<void>;

	/**
	 * Additional context meant for other hooks to consume.
	 */
	readonly context: FloatingContext;
}

// Helper function to resolve accessor or value
function resolveAccessor<T>(value: Accessor<T> | T): T {
	return typeof value === 'function' ? (value as Accessor<T>)() : value;
}

/**
 * Hook for managing floating elements.
 */
function useFloating(options: UseFloatingOptions = {}): UseFloatingReturn {
	const [elements, setElements] = createStore<FloatingElements>(
		resolveAccessor(options.elements) ?? {}
	);

	// Create reactive getters for options
	const placement = createMemo(() => resolveAccessor(options.placement) ?? "bottom");
	const strategy = createMemo(() => resolveAccessor(options.strategy) ?? "absolute");
	const middleware = createMemo(() => resolveAccessor(options.middleware) ?? []);
	const transform = createMemo(() => resolveAccessor(options.transform) ?? true);
	const open = createMemo(() => resolveAccessor(options.open) ?? true);
	const nodeId = createMemo(() => resolveAccessor(options.nodeId));
	const onOpenChange = options.onOpenChange ?? noop;
	const whileElementsMounted = options.whileElementsMounted;

	const [state, setState] = createStore<UseFloatingData>({
		x: 0,
		y: 0,
		strategy: strategy(),
		placement: placement(),
		middlewareData: {},
		isPositioned: false,
	});

	const floatingStyles = createMemo(() => {
		const initialStyles = {
			position: strategy(),
			left: "0px",
			top: "0px",
		};

		if (!elements.floating) {
			return styleObjectToString(initialStyles);
		}

		const x = roundByDPR(elements.floating, state.x);
		const y = roundByDPR(elements.floating, state.y);

		if (transform()) {
			return styleObjectToString({
				...initialStyles,
				transform: `translate(${x}px, ${y}px)`,
				...(getDPR(elements.floating) >= 1.5 && { willChange: "transform" }),
			});
		}

		return styleObjectToString({
			position: strategy(),
			left: `${x}px`,
			top: `${y}px`,
		});
	});

	const events = createPubSub();
	const [data, setData] = createStore<ContextData>({});

	const handleOpenChange = (
		open: boolean,
		event?: Event,
		reason?: OpenChangeReason,
	) => {
		setData("openEvent", open ? event : undefined);
		events.emit("openchange", { open, event, reason });
		onOpenChange(open, event, reason);
	};

	const update = async () => {
		if (!elements.floating || !elements.reference) {
			return;
		}

		const config: ComputePositionConfig = {
			placement: placement(),
			strategy: strategy(),
			middleware: middleware(),
		};

		const position = await computePosition(
			elements.reference,
			elements.floating,
			config,
		);

		setState({
			x: position.x,
			y: position.y,
			placement: position.placement,
			strategy: position.strategy,
			middlewareData: position.middlewareData,
			isPositioned: true,
		});
	};

	const context: FloatingContext = {
		get data() { return data; },
    setData: setData,
		events,
		get elements() { return elements; },
		onOpenChange: handleOpenChange,
		floatingId: useId(),
		get nodeId() { return nodeId(); },
		get x() { return state.x; },
		get y() { return state.y; },
		get placement() { return state.placement; },
		get strategy() { return state.strategy; },
		get middlewareData() { return state.middlewareData; },
		get isPositioned() { return state.isPositioned; },
		get open() { return open(); },
	};

	// Effects to handle element updates
	createEffect(() => {
		const optionsElements = resolveAccessor(options.elements);
		if (optionsElements) {
			if (optionsElements.reference !== undefined) {
				setElements("reference", optionsElements.reference);
			}
			if (optionsElements.floating !== undefined) {
				setElements("floating", optionsElements.floating);
			}
		}
	});

	// Effect to handle positioning state
	createEffect(() => {
		if (open() || !state.isPositioned) {
			return;
		}
		setState("isPositioned", false);
	});

	// Effect to handle mounting and updates
	createEffect(() => {
		if (!elements.floating || !elements.reference) {
			return;
		}

		if (!whileElementsMounted) {
			update();
			return;
		}

		const cleanup = whileElementsMounted(elements.reference, elements.floating, update);
		return cleanup;
	});

	return {
		update,
		context,
		get elements() { return elements; },
		get x() { return state.x; },
		get y() { return state.y; },
		get placement() { return state.placement; },
		get strategy() { return state.strategy; },
		get middlewareData() { return state.middlewareData; },
		get isPositioned() { return state.isPositioned; },
		get open() { return open(); },
		get floatingStyles() { return floatingStyles(); },
	};
}

export type { UseFloatingOptions, UseFloatingReturn, FloatingContext };
export { useFloating };