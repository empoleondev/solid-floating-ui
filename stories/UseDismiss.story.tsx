import { createSignal, Show } from 'solid-js';
import { flip, offset, shift, useFloating, useClick, useDismiss, useInteractions, useRole } from 'solid-floating-ui';

export default { title: 'All/UseDismiss' };

export function UseDismiss() {
    const [isOpen, setIsOpen] = createSignal(false);
    const [reference, setReference] = createSignal(null);
    const [floating, setFloating] = createSignal(null);

    const floatingState = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom',
        middleware: [offset(5), flip(), shift({ padding: 8 })],
         elements: {
            get reference() { return reference(); },
            get floating() { return floating(); }
        }
    });

    const click = useClick(floatingState.context);
    const dismiss = useDismiss(() => floatingState.context, {
        escapeKey: true,
        outsidePress: true,
    });
    const role = useRole(floatingState.context, { role: 'dialog' });
    const interactions = useInteractions([click(), dismiss, role()]);

    return (
        <div style="padding: 1rem;">
            <h2 style="font-size: 1.125rem; line-height: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">useDismiss Example</h2>
            <button
                ref={setReference}
                {...interactions.getReferenceProps()}
                style="background-color: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer;"
            >
                Open Dialog
            </button>
            <Show when={isOpen()}>
                <div
                    ref={setFloating}
                    style={`${floatingState.floatingStyles} background-color: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); padding: 1.5rem; color: black;`}
                    {...interactions.getFloatingProps}
                >
                    <h3 style="font-weight: 700; font-size: 1.125rem; line-height: 1.75rem;">Dialog</h3>
                    <p style="padding-top: 1rem; padding-bottom: 1rem;">Click outside or press 'Esc' to dismiss.</p>
                </div>
            </Show>
        </div>
    );
}