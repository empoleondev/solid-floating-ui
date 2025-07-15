import { createSignal } from 'solid-js';
import { offset, arrow, autoUpdate } from '@floating-ui/dom';
import FloatingArrow from '../src/components/floating-arrow';
import { useFloating } from '../src/hooks/use-floating';

export default { title: 'All/Interactive' };

export const Interactive = () => {
  const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
  const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
  const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();

  const [width, setWidth] = createSignal(14);
  const [height, setHeight] = createSignal(7);
  const [tipRadius, setTipRadius] = createSignal(0);
  const [strokeWidth, setStrokeWidth] = createSignal(0);
  const [fill, setFill] = createSignal('#333');
  const [stroke, setStroke] = createSignal('#666');

  const floating = useFloating({
    placement: 'top',
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

  const ControlGroup = (props: { label: string; children: any }) => (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '5px' }}>
      <label style={{ 'font-weight': 'bold', 'font-size': '12px' }}>{props.label}</label>
      {props.children}
    </div>
  );

  return (
    <div style={{ padding: '50px', display: 'flex', gap: '50px' }}>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px', 'min-width': '200px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Controls</h3>

        <ControlGroup label="Width">
          <input
            type="range"
            min="8"
            max="30"
            value={width()}
            onInput={(e) => setWidth(Number(e.target.value))}
          />
          <span style={{ 'font-size': '12px' }}>{width()}px</span>
        </ControlGroup>

        <ControlGroup label="Height">
          <input
            type="range"
            min="4"
            max="20"
            value={height()}
            onInput={(e) => setHeight(Number(e.target.value))}
          />
          <span style={{ 'font-size': '12px' }}>{height()}px</span>
        </ControlGroup>

        <ControlGroup label="Tip Radius">
          <input
            type="range"
            min="0"
            max="8"
            value={tipRadius()}
            onInput={(e) => setTipRadius(Number(e.target.value))}
          />
          <span style={{ 'font-size': '12px' }}>{tipRadius()}</span>
        </ControlGroup>

        <ControlGroup label="Stroke Width">
          <input
            type="range"
            min="0"
            max="4"
            value={strokeWidth()}
            onInput={(e) => setStrokeWidth(Number(e.target.value))}
          />
          <span style={{ 'font-size': '12px' }}>{strokeWidth()}px</span>
        </ControlGroup>

        <ControlGroup label="Fill Color">
          <input
            type="color"
            value={fill()}
            onInput={(e) => setFill(e.target.value)}
          />
        </ControlGroup>

        <ControlGroup label="Stroke Color">
          <input
            type="color"
            value={stroke()}
            onInput={(e) => setStroke(e.target.value)}
          />
        </ControlGroup>
      </div>

      <div>
        <div
          ref={setReferenceEl}
          style={{
            padding: '15px',
            'background-color': '#6f42c1',
            color: 'white',
            'border-radius': '4px',
            'text-align': 'center',
            width: 'fit-content'
          }}
        >
          Interactive Arrow
        </div>

        <div
          ref={setFloatingEl}
          style={{
            position: floating.strategy,
            top: `${floating.y ?? 0}px`,
            left: `${floating.x ?? 0}px`,
            'background-color': fill(),
            color: fill() === '#ffffff' || fill() === '#fff' ? '#333' : 'white',
            padding: '12px 16px',
            'border-radius': '6px',
            'font-size': '14px',
            'z-index': '1000',
            border: strokeWidth() > 0 ? `${strokeWidth()}px solid ${stroke()}` : 'none'
          }}
        >
          Customizable arrow
          <FloatingArrow
            ref={setArrowEl}
            context={floating.context}
            width={width()}
            height={height()}
            tipRadius={tipRadius()}
            strokeWidth={strokeWidth()}
            fill={fill()}
            stroke={stroke()}
          />
        </div>
      </div>
    </div>
  );
};