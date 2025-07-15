import { createSignal } from 'solid-js';
import { offset, arrow, autoUpdate } from '@floating-ui/dom';
import FloatingArrow from '../src/components/floating-arrow';
import { useFloating } from '../src/hooks/use-floating';

export default { title: 'All/CustomStyling' };

export const CustomStyling = () => {
  const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
  const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
  const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();

  const floating = useFloating({
    placement: 'top',
    open: true,
    elements: () => ({
      reference: referenceEl(),
      floating: floatingEl()
    }),
    middleware: () => [
      offset(15),
      ...(arrowEl() ? [arrow({ element: arrowEl()! })] : [])
    ],
    whileElementsMounted: autoUpdate
  });

  return (
    <div style={{ padding: '50px', display: 'flex', gap: '50px', 'flex-wrap': 'wrap' }}>
      {/* Large arrow */}
      <div>
        <div
          ref={setReferenceEl}
          style={{
            padding: '15px',
            'background-color': '#007bff',
            color: 'white',
            'border-radius': '8px',
            'text-align': 'center',
            'margin-bottom': '20px'
          }}
        >
          Large Arrow
        </div>

        <div
          ref={setFloatingEl}
          style={`
            ${floating.floatingStyles};
            background-color: #28a745;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 1000;
          `}
        >
          Custom large arrow
          <FloatingArrow
            ref={setArrowEl}
            context={floating.context}
            width={24}
            height={12}
            fill="#28a745"
          />
        </div>
      </div>
    </div>
  );
};