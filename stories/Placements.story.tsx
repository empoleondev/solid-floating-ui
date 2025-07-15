import { createSignal } from 'solid-js';
import { offset, arrow, autoUpdate, flip, shift } from '@floating-ui/dom';
import FloatingArrow from '../src/components/floating-arrow';
import { useFloating } from '../src/hooks/use-floating';

export default { title: 'All/Placements' };

export const Placements = () => {
  const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
  const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
  const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();
  const [placement, setPlacement] = createSignal<any>('top');
  const [isOpen, setIsOpen] = createSignal(true);

  const floating = useFloating({
    placement: () => placement(),
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

  const placements = [
    'top', 'top-start', 'top-end',
    'right', 'right-start', 'right-end',
    'bottom', 'bottom-start', 'bottom-end',
    'left', 'left-start', 'left-end'
  ] as const;

  return (
    <div style={{ padding: '100px', display: 'flex', 'flex-direction': 'column', gap: '20px', 'align-items': 'center' }}>
      <div style={{ display: 'flex', gap: '10px', 'flex-wrap': 'wrap', 'justify-content': 'center' }}>
        {placements.map(p => (
          <button
            onClick={() => setPlacement(p)}
            style={{
              padding: '5px 10px',
              'background-color': placement() === p ? '#007bff' : '#f8f9fa',
              color: placement() === p ? 'white' : 'black',
              border: '1px solid #dee2e6',
              'border-radius': '4px',
              cursor: 'pointer',
              'font-size': '12px'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div
        ref={setReferenceEl}
        style={{
          padding: '20px',
          'background-color': '#e9ecef',
          'border-radius': '4px',
          'text-align': 'center'
        }}
      >
        Reference Element
      </div>

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
          Placement: {placement()}
          <FloatingArrow
            ref={setArrowEl}
            context={floating.context}
            fill="#333"
          />
        </div>
      )}
    </div>
  );
};