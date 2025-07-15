import { createSignal } from 'solid-js';
import { offset, arrow, autoUpdate } from '@floating-ui/dom';
import FloatingArrow from '../src/components/floating-arrow';
import { useFloating } from '../src/hooks/use-floating';

export default { title: 'All/RoundedTip' };

export const RoundedTip = () => {
  const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
  const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
  const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();

  const floating = useFloating({
    placement: 'bottom',
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
    <div style={{ padding: '50px' }}>
      <div
        ref={setReferenceEl}
        style={{
          padding: '15px',
          'background-color': '#17a2b8',
          color: 'white',
          'border-radius': '8px',
          'text-align': 'center',
          width: 'fit-content'
        }}
      >
        Rounded Arrow
      </div>

      <div
        ref={setFloatingEl}
        style={{
          position: floating.strategy,
          top: `${floating.y ?? 0}px`,
          left: `${floating.x ?? 0}px`,
          'background-color': '#f8f9fa',
          color: '#333',
          padding: '12px 16px',
          'border-radius': '8px',
          'font-size': '14px',
          'z-index': '1000',
          border: '1px solid #dee2e6'
        }}
      >
        Arrow with rounded tip
        <FloatingArrow
          ref={setArrowEl}
          context={floating.context}
          fill="#f8f9fa"
          stroke="#dee2e6"
          strokeWidth={1}
          tipRadius={2}
        />
      </div>
    </div>
  );
};