import { createSignal, createMemo } from 'solid-js';
import { offset, flip, shift, arrow, hide, size, limitShift, autoUpdate } from '@floating-ui/dom';
import FloatingArrow from '../src/components/floating-arrow';
import { useFloating } from '../src/hooks/use-floating';

export default { title: 'All/Middleware Offset Test' };

export const MiddlewareOffsetTest = () => {
  const [referenceEl, setReferenceEl] = createSignal<HTMLElement>();
  const [floatingEl, setFloatingEl] = createSignal<HTMLElement>();
  const [arrowEl, setArrowEl] = createSignal<SVGSVGElement>();

  const [offsetValue, setOffsetValue] = createSignal(10);
  const [placementValue, setPlacementValue] = createSignal<'top' | 'right' | 'bottom' | 'left'>('top');
  const [enableFlip, setEnableFlip] = createSignal(true);
  const [enableShift, setEnableShift] = createSignal(true);
  const [enableArrow, setEnableArrow] = createSignal(true);
  const [enableHide, setEnableHide] = createSignal(false);

  // Test: Creating middleware with createMemo (like your code)
  const middlewares = createMemo(() => {
    const mw = [];
    
    // Always add offset
    mw.push(offset(offsetValue()));
    
    if (enableHide()) {
      mw.push(hide());
    }
    
    if (enableShift()) {
      mw.push(shift({ limiter: limitShift(), padding: 5 }));
    }
    
    if (enableFlip()) {
      mw.push(flip());
    }
    
    const arrowElement = arrowEl();
    if (enableArrow() && arrowElement) {
      mw.push(arrow({ element: arrowElement, padding: 4 }));
    }

    console.log('Middlewares recreated with offset:', offsetValue());
    return mw;
  });

  const floating = useFloating({
    placement: placementValue,
    open: true,
    elements: () => ({
      reference: referenceEl(),
      floating: floatingEl()
    }),
    middleware: () => middlewares(),
    whileElementsMounted: autoUpdate
  });

  const CheckboxControl = (props: { label: string; checked: boolean; onChange: (val: boolean) => void }) => (
    <label style={{ display: 'flex', 'align-items': 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span style={{ 'font-size': '14px' }}>{props.label}</span>
    </label>
  );

  return (
    <div style={{ padding: '50px', display: 'flex', gap: '50px', 'min-height': '200vh', 'min-width': '200vw' }}>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px', 'min-width': '350px', position: 'sticky', top: '50px', left: '50px', height: 'fit-content' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Middleware Controls</h3>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '5px' }}>
          <label style={{ 'font-weight': 'bold', 'font-size': '12px' }}>Placement</label>
          <select
            value={placementValue()}
            onChange={(e) => setPlacementValue(e.target.value as any)}
            style={{
              padding: '6px 8px',
              'border-radius': '4px',
              border: '1px solid #ccc',
              'font-size': '14px'
            }}
          >
            <option value="top">Top</option>
            <option value="right">Right</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
          </select>
        </div>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '5px' }}>
          <label style={{ 'font-weight': 'bold', 'font-size': '12px' }}>Offset Value</label>
          <input
            type="range"
            min="0"
            max="50"
            value={offsetValue()}
            onInput={(e) => setOffsetValue(Number(e.target.value))}
          />
          <span style={{ 'font-size': '12px' }}>{offsetValue()}px</span>
        </div>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px', 'margin-top': '10px' }}>
          <CheckboxControl
            label="Enable Flip"
            checked={enableFlip()}
            onChange={setEnableFlip}
          />
          <CheckboxControl
            label="Enable Shift"
            checked={enableShift()}
            onChange={setEnableShift}
          />
          <CheckboxControl
            label="Enable Arrow"
            checked={enableArrow()}
            onChange={setEnableArrow}
          />
          <CheckboxControl
            label="Enable Hide"
            checked={enableHide()}
            onChange={setEnableHide}
          />
        </div>

        <div style={{ 'margin-top': '20px', padding: '12px', 'background-color': '#f5f5f5', 'border-radius': '4px' }}>
          <div style={{ 'font-weight': 'bold', 'margin-bottom': '8px', 'font-size': '12px' }}>Position Data:</div>
          <div style={{ 'font-size': '11px', 'font-family': 'monospace' }}>
            <div>x: {floating.x.toFixed(2)}</div>
            <div>y: {floating.y.toFixed(2)}</div>
            <div>placement: {floating.placement}</div>
            <div>isPositioned: {floating.isPositioned ? 'true' : 'false'}</div>
            {enableHide() && floating.middlewareData.hide && (
              <>
                <div style={{ 'margin-top': '8px', 'font-weight': 'bold' }}>Hide Data:</div>
                <div>referenceHidden: {floating.middlewareData.hide.referenceHidden ? 'true' : 'false'}</div>
                <div>escaped: {floating.middlewareData.hide.escaped ? 'true' : 'false'}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ 'flex-grow': '1' }}>
        <div
          ref={setReferenceEl}
          style={{
            padding: '15px',
            'background-color': '#6f42c1',
            color: 'white',
            'border-radius': '4px',
            'text-align': 'center',
            width: 'fit-content',
            margin: '100px auto'
          }}
        >
          Reference Element
        </div>

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
          {enableArrow() && (
            <FloatingArrow
              ref={setArrowEl}
              context={floating.context}
              fill="#333"
            />
          )}
        </div>
      </div>
    </div>
  );
};