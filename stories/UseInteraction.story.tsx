import { createSignal, For, Show } from 'solid-js';
import { flip, offset, shift, useFloating, useClick, useDismiss, useInteractions, useRole } from 'solid-floating-ui';

export default { title: 'All/UseInteraction' };

export function UseInteraction() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [reference, setReference] = createSignal(null);
  const [floating, setFloating] = createSignal(null);

  const floatingState = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    middleware: [offset(5), flip(), shift({ padding: 8 })],
     elements: {
        get reference() { return reference(); },
        get floating() { return floating(); }
    }
  });

  const click = useClick(floatingState.context);
  const dismiss = useDismiss(() => floatingState.context);
  const role = useRole(floatingState.context, { role: 'menu' });

  // Correctly pass the interaction hooks to useInteractions.
  // useClick returns a function (accessor), so we call it.
  // useDismiss and useRole return objects directly.
  const interactions = useInteractions([click(), dismiss, role]);

  const menuItems = ['Save', 'View', 'Edit', 'Delete'];

  return (
    <>
      {/* This style tag is needed for the hover effect on menu items */}
      <style>
        {`
          .menu-item:hover {
            background-color: #f3f4f6;
          }
        `}
      </style>
      <div style="padding: 1rem;">
        <h2 style="font-size: 1.125rem; line-height: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">useInteractions & useRole Menu</h2>
        <button
          ref={setReference}
          {...interactions.getReferenceProps({
              'aria-label': 'Actions',
          })}
          style="background-color: #8b5cf6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer;"
        >
          Actions
        </button>
        <Show when={isOpen()}>
          <div
            ref={setFloating}
            style={`${floatingState.floatingStyles} background-color: white; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border: 1px solid #e5e7eb; width: 10rem;`}
            {...interactions.getFloatingProps()}
          >
            <For each={menuItems}>
              {(item) => (
                <button
                  {...interactions.getItemProps()}
                  class="menu-item"
                  style="display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; font-size: 0.875rem; line-height: 1.25rem; color: #374151; border: none; background: transparent; cursor: pointer;"
                  onClick={() => {
                    console.log(item);
                    setIsOpen(false);
                  }}
                >
                  {item}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </>
  );
}