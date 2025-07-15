import { arrow, autoUpdate, flip, FloatingArrow, offset, shift, useFloating, useFocus } from "solid-floating-ui";
import { createSignal } from "solid-js";

export default { title: 'All/UseFocus' };

export function UseFocus() {
  const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
  const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
  const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    placement: 'top',
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: () => ({
      reference: referenceEl(),
      floating: floatingEl()
    }),
    middleware: () => {
      const baseMiddleware = [
        offset(10),
        flip(),
        shift({ padding: 5 })
      ];

      const currentArrowEl = arrowEl();
      if (currentArrowEl) {
        baseMiddleware.push(arrow({ element: currentArrowEl }));
      }

      return baseMiddleware;
    },
    whileElementsMounted: autoUpdate
  });

  const focus = useFocus(floating.context, {
    enabled: true,
    visibleOnly: false
  });

  return (
    <div style={{
      padding: '100px',
      display: 'flex',
      'flex-direction': 'column',
      gap: '30px',
      'font-family': 'system-ui, sans-serif'
    }}>
      <div>
        <h1 style={{ 'margin-bottom': '20px', color: '#333' }}>
          useFocus Hook Demo
        </h1>
        <p style={{ 'margin-bottom': '30px', color: '#666', 'line-height': '1.5' }}>
          This demonstrates the useFocus hook from @floating-ui/solid.
          Use Tab to focus the button, or try clicking it.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', 'align-items': 'center' }}>
        <button
          ref={setReferenceEl}
          {...focus().reference}
          style={{
            padding: '12px 24px',
            'background-color': isOpen() ? '#0056b3' : '#007bff',
            color: 'white',
            border: 'none',
            'border-radius': '6px',
            cursor: 'pointer',
            'font-size': '16px',
            transition: 'background-color 0.2s ease',
            outline: 'none'
          }}
        >
          Focus me (Tab or Click)
        </button>

        <input
          type="text"
          placeholder="Another focusable element"
          style={{
            padding: '12px',
            border: '2px solid #ddd',
            'border-radius': '4px',
            'font-size': '14px',
            outline: 'none'
          }}
        />

        <button
          style={{
            padding: '12px 20px',
            'background-color': '#28a745',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer',
            'font-size': '14px'
          }}
        >
          Another Button
        </button>
      </div>

      <div style={{
        padding: '15px',
        'background-color': isOpen() ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isOpen() ? '#c3e6cb' : '#f5c6cb'}`,
        'border-radius': '4px',
        color: isOpen() ? '#155724' : '#721c24'
      }}>
        <strong>Tooltip Status:</strong> {isOpen() ? 'OPEN' : 'CLOSED'}
      </div>

      {isOpen() && (
        <div
          ref={setFloatingEl}
          style={`
            ${floating.floatingStyles};
            background-color: #333;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 200px;
          `}
        >
          Focus-triggered tooltip!
          <FloatingArrow
            ref={setArrowEl}
            context={floating.context}
            fill="#333"
            stroke="#333"
            strokeWidth={1}
          />
        </div>
      )}
    </div>
  );
}