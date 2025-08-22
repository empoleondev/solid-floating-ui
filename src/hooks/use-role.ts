// import { createMemo, JSX } from "solid-js";
// import type { FloatingContext } from "./use-floating";
// import { useId } from "./use-id";
// import type {
// 	ElementProps,
// 	ExtendedUserProps,
// } from "./use-interactions";

// type AriaRole =
// 	| "tooltip"
// 	| "dialog"
// 	| "alertdialog"
// 	| "menu"
// 	| "listbox"
// 	| "grid"
// 	| "tree";

// type ComponentRole = "select" | "label" | "combobox";

// interface UseRoleOptions {
// 	/**
// 	 * Whether the Hook is enabled, including all internal Effects and event
// 	 * handlers.
// 	 * @default true
// 	 */
// 	enabled?: boolean;
// 	/**
// 	 * The role of the floating element.
// 	 * @default 'dialog'
// 	 */
// 	role?: AriaRole | ComponentRole;
// }

// const componentRoleToAriaRoleMap = new Map<
// 	AriaRole | ComponentRole,
// 	AriaRole | false
// >([
// 	["select", "listbox"],
// 	["combobox", "listbox"],
// 	["label", false],
// ]);

// function useRole(
// 	context: FloatingContext,
// 	options: UseRoleOptions = {},
// ): ElementProps {
// 	const contextData = createMemo(() => context);
// 	const { open, floatingId } = contextData();

// 	const optionsData = createMemo(() => options);
// 	const { enabled = true, role = "dialog" } = optionsData();

// 	const ariaRole = createMemo(() =>
// 		(componentRoleToAriaRoleMap.get(role) ?? role) as
// 			| AriaRole
// 			| false
// 			| undefined,
// 	);

// 	// FIXME: Uncomment the commented code once useId and useFloatingParentNodeId are implemented.
// 	const referenceId = useId();
// 	const parentId = undefined;
// 	// const parentId = useFloatingParentNodeId();

// 	const isNested = parentId != null;

// 	const floatingProps = createMemo(() => ({
// 		id: floatingId,
// 		...(ariaRole() && { role: ariaRole() }),
// 	}));

// 	return {
// 		get reference(): JSX.HTMLAttributes<Element> {
// 			if (!enabled) {
// 				return {};
// 			}
// 			if (ariaRole() === "tooltip" || role === "label") {
// 				return {
// 					[`aria-${role === "label" ? "labelledby" : "describedby"}` as const]:
// 						open ? floatingId : undefined,
// 				};
// 			}
// 			return {
// 				"aria-expanded": open ? "true" : "false",
// 				"aria-haspopup": ariaRole() === "alertdialog" ? "dialog" : ariaRole(),
// 				"aria-controls": open ? floatingId : undefined,
// 				...(ariaRole() === "listbox" && { role: "combobox" }),
// 				...(ariaRole() === "menu" && { id: referenceId }),
// 				...(ariaRole() === "menu" && isNested && { role: "menuitem" }),
// 				...(role === "select" && { "aria-autocomplete": "none" }),
// 				...(role === "combobox" && { "aria-autocomplete": "list" }),
// 			} as JSX.HTMLAttributes<Element>;
// 		},
// 		get floating() {
// 			if (!enabled) {
// 				return {};
// 			}
// 			if (ariaRole() === "tooltip" || role === "label") {
// 				return floatingProps();
// 			}
// 			return {
// 				...floatingProps(),
// 				...(ariaRole() === "menu" && { "aria-labelledby": referenceId }),
// 			};
// 		},
// 		get item() {
// 			if (!enabled) {
// 				return {};
// 			}
// 			return ({ active, selected }: ExtendedUserProps) => {
// 				const commonProps = {
// 					role: "option",
// 					...(active && { id: `${context.floatingId}-option` }),
// 				};

// 				// For `menu`, we are unable to tell if the item is a `menuitemradio`
// 				// or `menuitemcheckbox`. For backwards-compatibility reasons, also
// 				// avoid defaulting to `menuitem` as it may overwrite custom role props.
// 				switch (role) {
// 					case "select":
// 						return {
// 							...commonProps,
// 							"aria-selected": active && selected,
// 						};
// 					case "combobox": {
// 						return {
// 							...commonProps,
// 							...(active && { "aria-selected": true }),
// 						};
// 					}
// 				}

// 				return {};
// 			};
// 		},
// 	};
// }

// export type { UseRoleOptions };
// export { useRole };

import { createMemo, JSX } from "solid-js";
import type { FloatingContext } from "./use-floating";
import { useId } from "./use-id";
import type {
	ElementProps,
	ExtendedUserProps,
} from "./use-interactions";

type AriaRole =
	| "tooltip"
	| "dialog"
	| "alertdialog"
	| "menu"
	| "listbox"
	| "grid"
	| "tree";

type ComponentRole = "select" | "label" | "combobox";

interface UseRoleOptions {
	/**
	 * Whether the Hook is enabled, including all internal Effects and event
	 * handlers.
	 * @default true
	 */
	enabled?: boolean;
	/**
	 * The role of the floating element.
	 * @default 'dialog'
	 */
	role?: AriaRole | ComponentRole;
}

const componentRoleToAriaRoleMap = new Map<
	AriaRole | ComponentRole,
	AriaRole | false
>([
	["select", "listbox"],
	["combobox", "listbox"],
	["label", false],
]);

function useRole(
	context: FloatingContext,
	options: UseRoleOptions = {},
): ElementProps {
	const optionsData = createMemo(() => options);
	const { enabled = true, role = "dialog" } = optionsData();

	const ariaRole = createMemo(() =>
		(componentRoleToAriaRoleMap.get(role) ?? role) as
			| AriaRole
			| false
			| undefined,
	);

	// FIXME: Uncomment the commented code once useId and useFloatingParentNodeId are implemented.
	const referenceId = useId();
	const parentId = undefined;
	// const parentId = useFloatingParentNodeId();

	const isNested = parentId != null;

	const floatingProps = createMemo(() => ({
		id: context.floatingId,
		...(ariaRole() && { role: ariaRole() }),
	}));

	return {
		get reference(): JSX.HTMLAttributes<Element> {
			if (!enabled) {
				return {};
			}
			if (ariaRole() === "tooltip" || role === "label") {
				return {
					[`aria-${role === "label" ? "labelledby" : "describedby"}` as const]:
						context.open ? context.floatingId : undefined,
				};
			}
			return {
				"aria-expanded": context.open ? "true" : "false",
				"aria-haspopup": ariaRole() === "alertdialog" ? "dialog" : ariaRole(),
				"aria-controls": context.open ? context.floatingId : undefined,
				...(ariaRole() === "listbox" && { role: "combobox" }),
				...(ariaRole() === "menu" && { id: referenceId }),
				...(ariaRole() === "menu" && isNested && { role: "menuitem" }),
				...(role === "select" && { "aria-autocomplete": "none" }),
				...(role === "combobox" && { "aria-autocomplete": "list" }),
			} as JSX.HTMLAttributes<Element>;
		},
		get floating() {
			if (!enabled) {
				return {};
			}
			if (ariaRole() === "tooltip" || role === "label") {
				return floatingProps();
			}
			return {
				...floatingProps(),
				...(ariaRole() === "menu" && { "aria-labelledby": referenceId }),
			};
		},
		get item() {
			if (!enabled) {
				return {};
			}
			return ({ active, selected }: ExtendedUserProps) => {
				const commonProps = {
					role: "option",
					...(active && { id: `${context.floatingId}-option` }),
				};

				// For `menu`, we are unable to tell if the item is a `menuitemradio`
				// or `menuitemcheckbox`. For backwards-compatibility reasons, also
				// avoid defaulting to `menuitem` as it may overwrite custom role props.
				switch (role) {
					case "select":
						return {
							...commonProps,
							"aria-selected": selected ? "true" : "false", // Fix: always return string
						};
					case "combobox": {
						return {
							...commonProps,
							"aria-selected": active ? "true" : "false", // Fix: always return string 
						};
					}
				}

				return {};
			};
		}
	};
}

export type { UseRoleOptions };
export { useRole };