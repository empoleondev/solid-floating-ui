import { createSignal, Show } from 'solid-js';
import { flip, offset, shift, useFloating, useClick, useInteractions, useRole, useDismiss } from 'solid-floating-ui';

export default { title: 'All/UseClick' };

export function UseClick() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [reference, setReference] = createSignal(null);
  const [floating, setFloating] = createSignal(null);

  const floatingState = useFloating({
    get open() { return isOpen(); },
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [offset(5), flip(), shift({ padding: 8 })],
    elements: {
        get reference() { return reference(); },
        get floating() { return floating(); }
    }
  });

  const click = useClick(floatingState.context);
  const dismiss = useDismiss(() => floatingState.context);
  const role = useRole(floatingState.context, { role: 'dialog' });

  const interactions = useInteractions([click(), dismiss, role]);

  return (
    <div style="padding: 1rem;">
      <h2 style="font-size: 1.125rem; line-height: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">useClick Example</h2>
      <button
        ref={setReference}
        {...interactions.getReferenceProps()}
        style="background-color: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer;"
      >
        Toggle with Click
      </button>
      <Show when={isOpen()}>
        <div
          ref={setFloating}
          style={`${floatingState.floatingStyles} background-color: #374151; color: white; padding: 1rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);`}
          {...interactions.getFloatingProps()}
        >
          <p>This was opened by a click.</p>
        </div>
      </Show>
    </div>
  );
}