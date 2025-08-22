import { expect, vi, test, describe, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import userEvent from '@testing-library/user-event';

import { useFloating, useHover, useInteractions } from '../src';
import type { UseHoverOptions } from '../src/hooks/use-hover';

vi.useFakeTimers();

function App(props: UseHoverOptions & { showReference?: boolean }) {
  const { showReference = true, ...hoverProps } = props;
  const [open, setOpen] = createSignal(false);
  const [reference, setReference] = createSignal(null);
  const [floating, setFloating] = createSignal(null);

  const floatingState = useFloating({
    get open() { return open(); },
    onOpenChange: setOpen,
    elements: () => ({
      reference: reference(),
      floating: floating()
    })
  });

  const hover = useHover(() => floatingState.context, () => hoverProps);
  const interactions = useInteractions([hover()]);

  return (
    <>
      {showReference && (
        <button ref={setReference} {...interactions.getReferenceProps()} />
      )}
      {open() && (
        <div role="tooltip" ref={setFloating} {...interactions.getFloatingProps()} />
      )}
    </>
  );
}

afterEach(() => {
  cleanup();
});

test('opens on mouseenter', () => {
  render(() => <App />);

  fireEvent.mouseEnter(screen.getByRole('button'));
  expect(screen.queryByRole('tooltip')).toBeInTheDocument();
});

test('closes on mouseleave', () => {
  render(() => <App />);

  fireEvent.mouseEnter(screen.getByRole('button'));
  fireEvent.mouseLeave(screen.getByRole('button'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

describe('delay', () => {
  test('symmetric number', async () => {
    render(() => <App delay={1000} />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    vi.advanceTimersByTime(999);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    vi.advanceTimersByTime(1);
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('open', async () => {
    render(() => <App delay={{ open: 500 }} />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    vi.advanceTimersByTime(499);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    vi.advanceTimersByTime(1);
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('close', async () => {
    render(() => <App delay={{ close: 500 }} />);

    fireEvent.mouseEnter(screen.getByRole('button'));
    fireEvent.mouseLeave(screen.getByRole('button'));

    vi.advanceTimersByTime(499);
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();

    vi.advanceTimersByTime(1);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('open with close 0', async () => {
    render(() => <App delay={{ open: 500 }} />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    vi.advanceTimersByTime(499);
    fireEvent.mouseLeave(screen.getByRole('button'));

    vi.advanceTimersByTime(1);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('restMs + nullish open delay should respect restMs', async () => {
    render(() => <App restMs={100} delay={{ close: 100 }} />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    vi.advanceTimersByTime(99);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

test('restMs', async () => {
  render(() => <App restMs={100} />);

  const button = screen.getByRole('button');

  const originalDispatchEvent = button.dispatchEvent;
  const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
    Object.defineProperty(event, 'movementX', { value: 10 });
    Object.defineProperty(event, 'movementY', { value: 10 });
    return originalDispatchEvent.call(button, event);
  });

  fireEvent.mouseMove(button);

  vi.advanceTimersByTime(99);
  fireEvent.mouseMove(button);

  vi.advanceTimersByTime(1);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

  fireEvent.mouseMove(button);

  vi.advanceTimersByTime(100);
  expect(screen.queryByRole('tooltip')).toBeInTheDocument();

  spy.mockRestore();
});

test('restMs is always 0 for touch input', async () => {
  render(() => <App restMs={100} />);

  fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' });
  fireEvent.mouseMove(screen.getByRole('button'));

  expect(screen.queryByRole('tooltip')).toBeInTheDocument();
});

test('restMs does not cause floating element to open if mouseOnly is true', async () => {
  render(() => <App restMs={100} mouseOnly />);

  fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' });
  fireEvent.mouseMove(screen.getByRole('button'));

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('restMs does not reset timer for minor mouse movement', async () => {
  render(() => <App restMs={100} />);

  const button = screen.getByRole('button');

  const originalDispatchEvent = button.dispatchEvent;
  const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
    Object.defineProperty(event, 'movementX', { value: 1 });
    Object.defineProperty(event, 'movementY', { value: 0 });
    return originalDispatchEvent.call(button, event);
  });

  fireEvent.mouseMove(button);

  vi.advanceTimersByTime(99);
  fireEvent.mouseMove(button);

  vi.advanceTimersByTime(1);
  expect(screen.queryByRole('tooltip')).toBeInTheDocument();

  spy.mockRestore();
});

test('mouseleave on the floating element closes it (mouse)', async () => {
  render(() => <App />);

  fireEvent.mouseEnter(screen.getByRole('button'));

  fireEvent(
    screen.getByRole('button'),
    new MouseEvent('mouseleave', {
      relatedTarget: screen.getByRole('tooltip'),
    }),
  );

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('does not show after delay if domReference changes', async () => {
 const [showReference, setShowReference] = createSignal(true);

 function TestApp() {
   const [open, setOpen] = createSignal(false);
   const [reference, setReference] = createSignal(null);
   const [floating, setFloating] = createSignal(null);

   const floatingState = useFloating({
     get open() { return open(); },
     onOpenChange: setOpen,
     elements: () => ({ reference: reference(), floating: floating() })
   });

   const hover = useHover(() => floatingState.context, () => ({ delay: 1000 }));
   const interactions = useInteractions([hover()]);

   return (
     <>
       {showReference() && <button ref={setReference} {...interactions.getReferenceProps()} />}
       {open() && <div role="tooltip" ref={setFloating} {...interactions.getFloatingProps()} />}
     </>
   );
 }

 render(() => <TestApp />);

 fireEvent.mouseEnter(screen.getByRole('button'));
 vi.advanceTimersByTime(1);
 setShowReference(false);
 vi.advanceTimersByTime(999);

 expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('reason string', async () => {
  function TestApp() {
    const [isOpen, setIsOpen] = createSignal(false);
    const [reference, setReference] = createSignal(null);
    const [floating, setFloating] = createSignal(null);

    const floatingState = useFloating({
      get open() { return isOpen(); },
      onOpenChange(isOpen, _, reason) {
        setIsOpen(isOpen);
        expect(reason).toBe('hover');
      },
      elements: () => ({
        reference: reference(),
        floating: floating()
      })
    });

    const hover = useHover(() => floatingState.context, () => ({}));
    const interactions = useInteractions([hover()]);

    return (
      <>
        <button ref={setReference} {...interactions.getReferenceProps()} />
        {isOpen() && (
          <div role="tooltip" ref={setFloating} {...interactions.getFloatingProps()} />
        )}
      </>
    );
  }

  render(() => <TestApp />);
  const button = screen.getByRole('button');
  fireEvent.mouseEnter(button);
  fireEvent.mouseLeave(button);
});