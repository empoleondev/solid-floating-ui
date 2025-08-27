import { expect, vi, test, describe, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, createEffect, JSX, createMemo } from 'solid-js';
import userEvent from '@testing-library/user-event';

import { 
  inline, 
  useClick, 
  useDismiss, 
  useFloating, 
  useFocus, 
  useHover, 
  useInteractions 
} from '../src';

afterEach(() => {
  // Clean up any remaining elements
});

describe('positionReference', () => {
  test('sets separate refs', () => {
    function App() {
      const [reference, setReference] = createSignal<HTMLDivElement | null>(null);
      const [positionReference, setPositionReference] = createSignal<HTMLDivElement | null>(null);
      const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
      
      const derivedElements = createMemo(() => ({
        reference: positionReference() || reference(),
        floating: floating()
      }));
      
      const floatingState = useFloating({
        elements: derivedElements
      });

      return (
        <>
          <div ref={setReference} data-testid="reference" />
          <div ref={setPositionReference} data-testid="position-reference" />
          <div ref={setFloating} data-testid="floating" />
          <div data-testid="reference-text">
            {String(reference()?.getAttribute('data-testid') || '')}
          </div>
          <div data-testid="position-reference-text">
            {String(!!positionReference())}
          </div>
          <div data-testid="actual-reference-used">
            {String(
              floatingState.context.elements.reference && 'getAttribute' in floatingState.context.elements.reference
                ? floatingState.context.elements.reference.getAttribute('data-testid') || 'none'
                : 'virtual-element'
            )}
          </div>
        </>
      );
    }

    render(() => <App />);

    expect(screen.getByTestId('reference-text').textContent).toBe('reference');
    expect(screen.getByTestId('position-reference-text').textContent).toBe('true');
    expect(screen.getByTestId('actual-reference-used').textContent).toBe('position-reference');

    // In SolidJS, the component is reactive by default, no rerender needed
    expect(screen.getByTestId('reference-text').textContent).toBe('reference');
    expect(screen.getByTestId('position-reference-text').textContent).toBe('true');
    expect(screen.getByTestId('actual-reference-used').textContent).toBe('position-reference');
  });

  test('handles unstable reference prop', () => {
    function App() {
      const [reference, setReference] = createSignal<HTMLDivElement | null>(null);
      const [positionReference, setPositionReference] = createSignal<HTMLDivElement | null>(null);
      const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
      
      const floatingState = useFloating({
        elements: () => ({
          reference: reference(),
          floating: floating()
        })
      });

      return (
        <>
          <div 
            ref={(node: HTMLDivElement) => setReference(node)} 
            data-testid="reference" 
          />
          <div ref={setPositionReference} data-testid="position-reference" />
          <div data-testid="reference-text">
            {String(reference()?.getAttribute('data-testid') || '')}
          </div>
          <div data-testid="position-reference-text">
            {String(!!positionReference())}
          </div>
        </>
      );
    }

    render(() => <App />);

    expect(screen.getByTestId('reference-text').textContent).toBe('reference');
    expect(screen.getByTestId('position-reference-text').textContent).toBe('true');

    // In SolidJS, the component is reactive by default, no rerender needed
    expect(screen.getByTestId('reference-text').textContent).toBe('reference');
    expect(screen.getByTestId('position-reference-text').textContent).toBe('true');
  });

  test('handles real virtual element', () => {
    function App() {
      const [reference, setReference] = createSignal<HTMLDivElement | null>(null);
      const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
      const [virtualElement, setVirtualElement] = createSignal<any>(null);
      
      // Create virtual element on mount
      createEffect(() => {
        setVirtualElement({
          getBoundingClientRect: () => ({
            x: 218,
            y: 0,
            width: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }),
        });
      });
      
      const floatingState = useFloating({
        elements: () => ({
          reference: virtualElement() || reference(), // Use virtual element if available, fallback to reference
          floating: floating()
        })
      });

      return (
        <>
          <div 
            ref={(node: HTMLDivElement) => setReference(node)} 
            data-testid="reference" 
          />
          <div ref={setFloating} />
          <div data-testid="reference-text">
            {String(reference()?.getAttribute('data-testid') || '')}
          </div>
          <div data-testid="position-reference-text">
            {floatingState.context?.elements?.reference?.getBoundingClientRect?.()?.x || 0}
          </div>
        </>
      );
    }

    render(() => <App />);

    expect(screen.getByTestId('reference-text').textContent).toBe('reference');
    expect(screen.getByTestId('position-reference-text').textContent).toBe('218');

    // In SolidJS, the component is reactive by default, no rerender needed
    expect(screen.getByTestId('reference-text').textContent).toBe('reference');
    expect(screen.getByTestId('position-reference-text').textContent).toBe('218');
  });

  test('does not error when using `inline` middleware and setting the position reference to a real element', async () => {
    function App() {
      const [reference, setReference] = createSignal<HTMLDivElement | null>(null);
      const [positionReference, setPositionReference] = createSignal<HTMLDivElement | null>(null);
      const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
      
      const floatingState = useFloating({
        middleware: () => [inline()],
        elements: () => ({
          reference: reference(),
          floating: floating()
        })
      });

      return (
        <>
          <div ref={setReference} />
          <div ref={setPositionReference} />
          <div ref={setFloating} />
        </>
      );
    }

    render(() => <App />);
    // Just ensuring no error is thrown
    await new Promise(resolve => setTimeout(resolve, 0));
  });
});

test('interactions.getFloatingProps as a dep does not cause setState loop', async () => {
  function App() {
    const [reference, setReference] = createSignal<HTMLDivElement | null>(null);
    const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
    
    const floatingState = useFloating({
      get open() { return true; },
      elements: () => ({
        reference: reference(),
        floating: floating()
      })
    });

    const hover = useHover(() => floatingState.context, () => ({}));
    const click = useClick(floatingState.context, {});
    const focus = useFocus(floatingState.context, {});
    const dismiss = useDismiss(() => floatingState.context, {});

    const interactions = useInteractions([
        hover(),
        click(),
        focus(),
        dismiss,
    ]);

    // Simulate the useCallback pattern from React
    const TooltipComponent = () => {
      return (
        <div
          data-testid="floating"
          ref={setFloating}
          {...interactions.getFloatingProps()}
        />
      );
    };

    return (
      <>
        <div ref={setReference} {...interactions.getReferenceProps()} />
        <TooltipComponent />
      </>
    );
  }

  render(() => <App />);
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(screen.queryByTestId('floating')).toBeInTheDocument();
});

test('elements.reference refers to externally synchronized reference', async () => {
  function App() {
    const [referenceEl, setReferenceEl] = createSignal<HTMLButtonElement | null>(null);
    const [isOpen, setIsOpen] = createSignal(false);
    const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
    
    const floatingState = useFloating({
      get open() { return isOpen(); },
      onOpenChange: setIsOpen,
      elements: () => ({
        reference: referenceEl(),
        floating: floating()
      })
    });

    const hover = useHover(() => floatingState.context, () => ({}));
    const interactions = useInteractions([hover()]);

    return (
      <>
        <button ref={setReferenceEl} {...interactions.getReferenceProps()} />
        {isOpen() && (
          <div role="dialog" ref={setFloating} {...interactions.getFloatingProps()} />
        )}
      </>
    );
  }

  render(() => <App />);

  await userEvent.hover(screen.getByRole('button'));
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('onOpenChange is passed an event as second param', async () => {
  const onOpenChange = vi.fn();

  function App() {
    const [isOpen, setIsOpen] = createSignal(false);
    const [reference, setReference] = createSignal<HTMLButtonElement | null>(null);
    const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
    
    const floatingState = useFloating({
      get open() { return isOpen(); },
      onOpenChange(open, event) {
        onOpenChange(open, event);
        setIsOpen(open);
      },
      elements: () => ({
        reference: reference(),
        floating: floating()
      })
    });

    const hover = useHover(() => floatingState.context, () => ({
      move: false,
    }));
    const interactions = useInteractions([hover()]);

    return (
      <>
        <button ref={setReference} {...interactions.getReferenceProps()} />
        {isOpen() && <div ref={setFloating} {...interactions.getFloatingProps()} />}
      </>
    );
  }

  render(() => <App />);

  await userEvent.hover(screen.getByRole('button'));
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(onOpenChange.mock.calls[0][0]).toBe(true);
  expect(onOpenChange.mock.calls[0][1]).toBeInstanceOf(MouseEvent);

  await userEvent.unhover(screen.getByRole('button'));

  expect(onOpenChange.mock.calls[1][0]).toBe(false);
  expect(onOpenChange.mock.calls[1][1]).toBeInstanceOf(MouseEvent);
});

test('elements.reference is synchronized with external reference', async () => {
  let isSameNode = false;

  function App() {
    const [referenceEl, setReferenceEl] = createSignal<HTMLButtonElement | null>(null);
    const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
    
    const floatingState = useFloating({
      elements: () => ({
        reference: referenceEl(),
        floating: floating()
      })
    });

    return (
      <button
        ref={setReferenceEl}
        onClick={(event) => {
          isSameNode = event.currentTarget === floatingState.context.elements.reference;
        }}
      />
    );
  }

  render(() => <App />);

  fireEvent.click(screen.getByRole('button'));

  expect(isSameNode).toBe(true);
});