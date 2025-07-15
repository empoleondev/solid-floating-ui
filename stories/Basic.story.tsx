import { createSignal } from 'solid-js';
import { offset, arrow, autoUpdate, flip, shift } from '@floating-ui/dom';
import {default as FloatingArrowComponent} from '../src/components/floating-arrow';
import { useFloating } from '../src/hooks/use-floating';

export default { title: 'All/FloatingArrow' };

export const FloatingArrow = () => {
  const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
  const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
  const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    placement: 'top',
    open: isOpen,
    elements: () => ({
      reference: referenceEl(),
      floating: floatingEl()
    }),
    middleware: () => [
      offset(10),
      flip(),
      shift({ padding: 5 }),
      ...(arrowEl() ? [arrow({ element: arrowEl()! })] : [])
    ],
    whileElementsMounted: autoUpdate
  });

  return (
    <div style={{ padding: '50px', display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
      <button
        ref={setReferenceEl}
        onClick={() => setIsOpen(!isOpen())}
        style={{
          padding: '10px 20px',
          'background-color': '#007bff',
          color: 'white',
          border: 'none',
          'border-radius': '4px',
          cursor: 'pointer',
          width: 'fit-content'
        }}
      >
        Toggle Tooltip
      </button>

      {isOpen() && (
        <div
          ref={setFloatingEl}
          style={`
            ${floating.floatingStyles};
            background-color: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
          `}
        >
          Basic tooltip with arrow
          <FloatingArrowComponent
            ref={setArrowEl}
            context={floating.context}
            fill="#333"
          />
        </div>
      )}
    </div>
  );
};