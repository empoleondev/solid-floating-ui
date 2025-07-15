import { createSignal, For } from 'solid-js';
import { offset, arrow, autoUpdate } from '@floating-ui/dom';
import FloatingArrow from '../src/components/floating-arrow';
import { useFloating } from '../src/hooks/use-floating';

export default { title: 'All/MultipleArrows' };

export const MultipleArrows = () => {
  const examples = [
    { placement: 'top' as const, color: '#007bff', label: 'Blue Top' },
    { placement: 'right' as const, color: '#28a745', label: 'Green Right' },
    { placement: 'bottom' as const, color: '#ffc107', label: 'Yellow Bottom' },
    { placement: 'left' as const, color: '#dc3545', label: 'Red Left' }
  ];

  return (
    <div style={{ padding: '100px', display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '100px' }}>
      <For each={examples}>
        {(example) => {
          const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
          const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
          const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();

          const floating = useFloating({
            placement: example.placement,
            open: true,
            elements: () => ({
              reference: referenceEl(),
              floating: floatingEl()
            }),
            middleware: () => [
              offset(10),
              ...(arrowEl() ? [arrow({ element: arrowEl()! })] : [])
            ],
            whileElementsMounted: autoUpdate
          });

          return (
            <div>
              <div
                ref={setReferenceEl}
                style={{
                  padding: '15px',
                  'background-color': '#f8f9fa',
                  border: '2px solid #dee2e6',
                  'border-radius': '4px',
                  'text-align': 'center',
                  'font-weight': 'bold'
                }}
              >
                {example.label}
              </div>

              <div
                ref={setFloatingEl}
                style={{
                  position: floating.strategy,
                  top: `${floating.y ?? 0}px`,
                  left: `${floating.x ?? 0}px`,
                  'background-color': example.color,
                  color: 'white',
                  padding: '10px 15px',
                  'border-radius': '4px',
                  'font-size': '13px',
                  'z-index': '1000'
                }}
              >
                {example.placement} tooltip
                <FloatingArrow
                  ref={setArrowEl}
                  context={floating.context}
                  fill={example.color}
                />
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};