import { expect, vi, test } from "vitest";
import { fireEvent, render, screen } from "@solidjs/testing-library";

import {
  FloatingDelayGroup,
  useDelayGroup,
  useFloating,
  useHover,
  useInteractions,
} from '../src';
import { createSignal, JSX, splitProps, createMemo, createEffect } from "solid-js";

vi.useFakeTimers();

interface Props {
  label: string;
  children: JSX.Element;
}

export const Tooltip = (props: Props) => {
  const [open, setOpen] = createSignal(false);
  const [reference, setReference] = createSignal(null);
  const [floating, setFloating] = createSignal(null);
  const [local, others] = splitProps(props, ['children', 'label']);

  const floatingState = useFloating({
    open,
    onOpenChange: (newOpen, event, reason) => {
      setOpen(newOpen);
    },
    elements: () => ({
      reference: reference(),
      floating: floating()
    })
  });

  // Create a reactive accessor for the floating context
  const floatingContext = createMemo(() => floatingState.context);
  
  // Get delay group and make delay reactive
  const delayGroup = useDelayGroup(floatingContext, {id: local.label});
  const reactiveDelay = createMemo(() => {
    const delay = delayGroup.delay;
    return delay;
  });
  
  // Create hover with reactive delay
  const hover = useHover(
    floatingContext, 
    () => {
      const options = { 
        delay: reactiveDelay(), 
        move: false 
      };
      return options;
    }
  );
  
  const interactions = useInteractions([hover()]);

  return (
    <>
      <span
        ref={setReference}
        {...interactions.getReferenceProps({
          ...others,          
        })}
      >
        {local.children}
      </span>

      {open() && (
        <div
          ref={setFloating}
          data-testid={`floating-${local.label}`}
          {...interactions.getFloatingProps({
            style: {
              position: floatingState.strategy,
              top: `${floatingState.y ?? 0}px`,
              left: `${floatingState.x ?? 0}px`,
            }
          })}
        >
          {local.label}
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <FloatingDelayGroup delay={{open: 1000, close: 200}}>
      <Tooltip label="one">
        <button data-testid="reference-one" />
      </Tooltip>
      <Tooltip label="two">
        <button data-testid="reference-two" />
        Two
      </Tooltip>
      <Tooltip label="three">
        <button data-testid="reference-three" />
        Three
      </Tooltip>
    </FloatingDelayGroup>
  );
}

test('groups delays correctly', async () => {
  render(() => <App />);

  const referenceOne = screen.getByTestId('reference-one');
  const referenceTwo = screen.getByTestId('reference-two');
  const referenceThree = screen.getByTestId('reference-three');
  
  // Get the parent spans which have the hover handlers
  const spanOne = referenceOne.parentElement!;
  const spanTwo = referenceTwo.parentElement!;
  const spanThree = referenceThree.parentElement!;

  fireEvent.mouseEnter(spanOne);

  vi.advanceTimersByTime(1);

  const floating1After1ms = screen.queryByTestId('floating-one');
  expect(floating1After1ms).not.toBeInTheDocument();

  vi.advanceTimersByTime(999);

  const floating1After1000ms = screen.queryByTestId('floating-one');
  expect(floating1After1000ms).toBeInTheDocument();

  fireEvent.mouseLeave(spanOne); // Leave the first tooltip
  fireEvent.mouseEnter(spanTwo); // Enter the second tooltip

  vi.advanceTimersByTime(1);

  const floating1AfterSecond = screen.queryByTestId('floating-one');
  const floating2AfterSecond = screen.queryByTestId('floating-two');
  
  expect(floating1AfterSecond).not.toBeInTheDocument();
  expect(floating2AfterSecond).toBeInTheDocument();

  fireEvent.mouseLeave(spanTwo);
  fireEvent.mouseEnter(spanThree);

  vi.advanceTimersByTime(1);

  const floating2AfterThird = screen.queryByTestId('floating-two');
  const floating3AfterThird = screen.queryByTestId('floating-three');
  
  expect(floating2AfterThird).not.toBeInTheDocument();
  expect(floating3AfterThird).toBeInTheDocument();

  fireEvent.mouseLeave(spanThree);

  vi.advanceTimersByTime(1);

  const floating3AfterLeave1ms = screen.queryByTestId('floating-three');
  expect(floating3AfterLeave1ms).toBeInTheDocument();

  vi.advanceTimersByTime(199);

  const floating3AfterLeave200ms = screen.queryByTestId('floating-three');
  expect(floating3AfterLeave200ms).not.toBeInTheDocument();
  
});

test('timeoutMs', async () => {
  function App() {
    return (
      <FloatingDelayGroup delay={{open: 1000, close: 100}} timeoutMs={500}>
        <Tooltip label="one">
          <button data-testid="reference-one" />
        </Tooltip>
        <Tooltip label="two">
          <button data-testid="reference-two" />
        </Tooltip>
        <Tooltip label="three">
          <button data-testid="reference-three" />
        </Tooltip>
      </FloatingDelayGroup>
    );
  }

  render(() => <App />);

  // Get the parent spans which have the hover handlers
  const spanOne = screen.getByTestId('reference-one').parentElement!;
  const spanTwo = screen.getByTestId('reference-two').parentElement!;
  const spanThree = screen.getByTestId('reference-three').parentElement!;

  fireEvent.mouseEnter(spanOne);

  vi.advanceTimersByTime(1000);

  fireEvent.mouseLeave(spanOne);

  vi.advanceTimersByTime(100);

  expect(screen.queryByTestId('floating-one')).not.toBeInTheDocument();

  vi.advanceTimersByTime(399);

  fireEvent.mouseEnter(spanTwo);

  vi.advanceTimersByTime(1);

  expect(screen.queryByTestId('floating-two')).toBeInTheDocument();

  fireEvent.mouseLeave(spanTwo);
  fireEvent.mouseEnter(spanThree);

  vi.advanceTimersByTime(1);

  expect(screen.queryByTestId('floating-two')).not.toBeInTheDocument();
  expect(screen.queryByTestId('floating-three')).toBeInTheDocument();

  fireEvent.mouseLeave(spanThree);

  vi.advanceTimersByTime(1);

  expect(screen.queryByTestId('floating-three')).toBeInTheDocument();

  vi.advanceTimersByTime(99);

  expect(screen.queryByTestId('floating-three')).not.toBeInTheDocument();
});