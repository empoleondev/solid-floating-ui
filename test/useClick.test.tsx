import { expect, vi, test, describe, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, splitProps, JSX, createMemo } from 'solid-js';
import userEvent from '@testing-library/user-event';

import { useClick, useFloating, useHover, useInteractions } from '../src';
import type { UseClickOptions } from '../src';

interface AppProps extends UseClickOptions {
  referenceElement?: string;
  typeable?: boolean;
  initialOpen?: boolean;
}

function App(props: AppProps) {
  const [local, clickProps] = splitProps(props, ['referenceElement', 'typeable', 'initialOpen']);
  const {
    referenceElement = 'button',
    typeable = false,
    initialOpen = false
  } = local;

  const [open, setOpen] = createSignal(initialOpen);
  const [reference, setReference] = createSignal(null);
  const [floating, setFloating] = createSignal(null);
  
  const floatingState = useFloating({
    get open() { return open(); },
    onOpenChange: setOpen,
    elements: {
      get reference() { return reference(); },
      get floating() { return floating(); }
    }
  });

  const click = useClick(floatingState.context, clickProps);
  const interactions = useInteractions([click()]);

  const baseProps = {
    ref: setReference,
    'data-testid': 'reference',
    ...interactions.getReferenceProps()
  };

  return (
    <>
      {typeable ? (
        <input {...baseProps} />
      ) : referenceElement === 'a' ? (
        <a {...baseProps} href="#" />
      ) : referenceElement === 'div' ? (
        <div {...baseProps} />
      ) : (
        <button {...baseProps} />
      )}
      {open() && (
        <div 
          ref={setFloating}
          role="tooltip" 
          {...interactions.getFloatingProps()} 
        />
      )}
    </>
  );
}

afterEach(() => {
  // Clean up any remaining elements
});

describe('default', () => {
  test('changes `open` state to `true` after click', () => {
    render(() => <App />);
    const button = screen.getByRole('button');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('changes `open` state to `false` after two clicks', () => {
    render(() => <App />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('mousedown `event` prop', () => {
  test('changes `open` state to `true` after click', () => {
    render(() => <App event="mousedown" />);
    const button = screen.getByRole('button');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('changes `open` state to `false` after two clicks', () => {
    render(() => <App event="mousedown" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('`toggle` prop', () => {
  test('changes `open` state to `true` after click', () => {
    render(() => <App toggle={false} />);
    const button = screen.getByRole('button');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('`open` state remains `true` after two clicks', () => {
    render(() => <App toggle={false} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('`open` state remains `true` after two clicks with `mousedown`', () => {
    render(() => <App toggle={false} event="mousedown" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('`open` state becomes `false` after clicking when initially open', () => {
    render(() => <App initialOpen={true} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('`stickIfOpen` prop', () => {
  function StickIfOpenApp(props: { stickIfOpen?: boolean }) {
    const [open, setOpen] = createSignal(false);
    const [reference, setReference] = createSignal(null);
    const [floating, setFloating] = createSignal(null);
    
    const floatingState = useFloating({
      get open() { return open(); },
      onOpenChange: setOpen,
      elements: {
        get reference() { return reference(); },
        get floating() { return floating(); }
      }
    });

    const hover = useHover(() => floatingState.context, () => ({ 
      enabled: !props.stickIfOpen  // Disable hover when stickIfOpen is true
    }));
    const click = useClick(floatingState.context, { ignoreMouse: props.stickIfOpen });
    const interactions = useInteractions([hover(), click()]);

    return (
      <>
        <button
          ref={setReference}
          data-testid="reference"
          {...interactions.getReferenceProps()}
        />
        {open() && (
          <div 
            ref={setFloating}
            role="tooltip" 
            {...interactions.getFloatingProps()} 
          />
        )}
      </>
    );
  }

  test('true: `open` state remains `true` after click and mouseleave', () => {
    render(() => <StickIfOpenApp stickIfOpen />);
    
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
    
    fireEvent.mouseLeave(button);
    
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('false: `open` state becomes `false` after click and mouseleave', () => {
    render(() => <StickIfOpenApp stickIfOpen={false} />);

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('non-buttons', () => {
  test('adds Enter keydown', () => {
    render(() => <App referenceElement="div" />);

    const button = screen.getByTestId('reference');
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('anchor does not add Enter keydown', async () => {
    const user = userEvent.setup();
    render(() => <App referenceElement="a" />);

    const button = screen.getByTestId('reference');

    button.focus();
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('adds Space keyup', () => {
    render(() => <App referenceElement="div" />);

    const button = screen.getByTestId('reference');
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyUp(button, { key: ' ' });

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('typeable reference does not receive space key handler', async () => {
    render(() => <App typeable={true} />);

    const button = screen.getByTestId('reference');
    
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyUp(button, { key: ' ' });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('typeable reference does receive Enter key handler', async () => {
    render(() => <App typeable={true} />);

    const button = screen.getByTestId('reference');
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });
});

test('ignores Space keydown on another element then keyup on the button', async () => {
  render(() => <App />);

  const button = screen.getByRole('button');
  fireEvent.keyDown(document.body, { key: ' ' });
  fireEvent.keyUp(button, { key: ' ' });

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('reason string', async () => {
  function ReasonApp() {
    const [isOpen, setIsOpen] = createSignal(false);
    const [reference, setReference] = createSignal(null);
    const [floating, setFloating] = createSignal(null);
    
    const floatingState = useFloating({
      get open() { return isOpen(); },
      onOpenChange: (isOpen, _, reason) => {
        setIsOpen(isOpen);
        expect(reason).toBe('click');
      },
      elements: {
        get reference() { return reference(); },
        get floating() { return floating(); }
      }
    });

    const click = useClick(floatingState.context, {});
    const interactions = useInteractions([click()]);

    return (
      <>
        <button 
          ref={setReference}
          {...interactions.getReferenceProps()} 
        />
        {isOpen() && (
          <div 
            ref={setFloating}
            role="tooltip" 
            {...interactions.getFloatingProps()} 
          />
        )}
      </>
    );
  }

  render(() => <ReasonApp />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  fireEvent.click(button);
});