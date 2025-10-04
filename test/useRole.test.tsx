import { expect, test, describe, afterEach } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@solidjs/testing-library';
import { createMemo, createSignal } from 'solid-js';

import {
  useClick,
  useFloating,
  useId,
  useInteractions,
  useRole,
} from '../src';
import type { UseRoleOptions } from '../src/hooks/use-role';

function App(props: UseRoleOptions & {
  initiallyOpen?: boolean;
  referenceId?: string;
  floatingId?: string;
}) {
  const { initiallyOpen = false, referenceId, floatingId, ...roleProps } = props;
  const [open, setOpen] = createSignal(initiallyOpen);
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

  if (floatingId) {
    floatingState.context.floatingId = floatingId;
  }

  const role = useRole(floatingState.context, roleProps);
  const interactions = createMemo(() => useInteractions([role()]));

  return (
    <>
      <button
        ref={setReference}
        {...interactions().getReferenceProps({
          ...(referenceId && { id: referenceId }),
          onClick() {
            setOpen(!open());
          },
        })}
      />
      {open() && (
        <div
          ref={setFloating}
          {...interactions().getFloatingProps({
            ...(floatingId && { id: floatingId }),
          })}
        />
      )}
    </>
  );
}

function AppWithExternalRef(props: UseRoleOptions & { initiallyOpen?: boolean }) {
  const { initiallyOpen = false, ...roleProps } = props;
  const [open, setOpen] = createSignal(initiallyOpen);
  const [reference, setReference] = createSignal(null);
  const [floating, setFloating] = createSignal(null);
  const nodeId = useId();

  const floatingState = useFloating({
    nodeId: () => nodeId,
    get open() { return open(); },
    onOpenChange: setOpen,
    elements: () => ({
      reference: reference(),
      floating: floating()
    })
  });

  // External ref can use its own set of interactions hooks, but share context
  const floatingRole = useRole(floatingState.context, roleProps);
  const referenceRole = useRole(floatingState.context, roleProps);
  const floatingInteractions = createMemo(() => useInteractions([floatingRole()]));
  const referenceInteractions = createMemo(() => useInteractions([referenceRole()]));

  return (
    <>
      <button
        {...referenceInteractions().getReferenceProps({
          ref: setReference,
          onClick() {
            setOpen(!open());
          },
        })}
      />
      {open() && (
        <div
          {...floatingInteractions().getFloatingProps({
            ref: setFloating,
          })}
        />
      )}
    </>
  );
}

afterEach(() => {
  cleanup();
});

describe('tooltip', () => {
  test('has correct role', () => {
    render(() => <App role="tooltip" initiallyOpen />);
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });

  test('sets correct aria attributes based on the open state', () => {
    render(() => <App role="tooltip" />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(button.hasAttribute('aria-describedby')).toBe(true);
    
    fireEvent.click(button);
    
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('label', () => {
  test('sets correct aria attributes based on the open state', () => {
    const { container } = render(() => <App role="label" initiallyOpen />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-labelledby]')).toBeInTheDocument();
  });
});

describe('dialog', () => {
  test('sets correct aria attributes based on the open state', () => {
    render(() => <App role="dialog" />);

    const button = screen.getByRole('button');

    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);

    expect(screen.queryByRole('dialog')).toBeInTheDocument();
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('dialog').getAttribute('id'),
    );
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(button);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  test('sets correct aria attributes with external ref, multiple useRole calls', () => {
    render(() => <AppWithExternalRef role="dialog" />);

    const button = screen.getByRole('button');

    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);

    expect(screen.queryByRole('dialog')).toBeInTheDocument();
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('dialog').getAttribute('id'),
    );
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(button);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('menu', () => {
  test('sets correct aria attributes based on the open state', () => {
    render(() => <App role="menu" />);

    const button = screen.getByRole('button');

    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);

    expect(screen.queryByRole('menu')).toBeInTheDocument();
    expect(button.getAttribute('id')).toBe(
      screen.getByRole('menu').getAttribute('aria-labelledby'),
    );
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('menu').getAttribute('id'),
    );
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(button);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('listbox', () => {
  test('sets correct aria attributes based on the open state', () => {
    render(() => <App role="listbox" />);

    const button = screen.getByRole('combobox');

    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);

    expect(screen.queryByRole('listbox')).toBeInTheDocument();
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('listbox').getAttribute('id'),
    );
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(button);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('select', () => {
  test('sets correct aria attributes based on the open state', () => {
    function Select() {
      const [isOpen, setIsOpen] = createSignal(false);
      const [reference, setReference] = createSignal(null);
      const [floating, setFloating] = createSignal(null);

      const floatingState = useFloating({
        get open() { return isOpen(); },
        onOpenChange: setIsOpen,
        elements: () => ({
          reference: reference(),
          floating: floating()
        })
      });

      const click = useClick(floatingState.context, {});
      const role = useRole(floatingState.context, { role: 'select' });
      const interactions = createMemo(() => useInteractions([click(), role()]));

      return (
        <>
          <button ref={setReference} {...interactions().getReferenceProps()} />
          {isOpen() && (
            <div ref={setFloating} {...interactions().getFloatingProps()}>
              {[1, 2, 3].map((i) => (
                <div
                  data-testid={`item-${i}`}
                  {...interactions().getItemProps({ active: i === 2, selected: i === 2 })}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    render(() => <Select />);

    const button = screen.getByRole('combobox');

    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);

    expect(screen.queryByRole('listbox')).toBeInTheDocument();
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('listbox').getAttribute('id'),
    );
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-autocomplete')).toBe('none');
    expect(screen.getByTestId('item-1').getAttribute('aria-selected')).toBe(
      'false',
    );
    expect(screen.getByTestId('item-2').getAttribute('aria-selected')).toBe(
      'true',
    );

    fireEvent.click(button);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('combobox', () => {
  test('sets correct aria attributes based on the open state', () => {
    function Select() {
      const [isOpen, setIsOpen] = createSignal(false);
      const [reference, setReference] = createSignal(null);
      const [floating, setFloating] = createSignal(null);

      const floatingState = useFloating({
        get open() { return isOpen(); },
        onOpenChange: setIsOpen,
        elements: () => ({
          reference: reference(),
          floating: floating()
        })
      });

      const click = useClick(floatingState.context, {});
      const role = useRole(floatingState.context, { role: 'combobox' });
      const interactions = createMemo(() => useInteractions([click(), role()]));

      return (
        <>
          <input ref={setReference} {...interactions().getReferenceProps()} />
          {isOpen() && (
            <div ref={setFloating} {...interactions().getFloatingProps()}>
              {[1, 2, 3].map((i) => (
                <div
                  data-testid={`item-${i}`}
                  {...interactions().getItemProps({ active: i === 2, selected: i === 2 })}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    render(() => <Select />);

    const button = screen.getByRole('combobox');

    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);

    expect(screen.queryByRole('listbox')).toBeInTheDocument();
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('listbox').getAttribute('id'),
    );
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-autocomplete')).toBe('list');
    expect(screen.getByTestId('item-1').getAttribute('aria-selected')).toBe(
      'false',
    );
    expect(screen.getByTestId('item-2').getAttribute('aria-selected')).toBe(
      'true',
    );

    fireEvent.click(button);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

test('automatically handles custom id attributes', async () => {
  render(() => <App role="tooltip" floatingId="test" initiallyOpen />);
  
  expect(screen.getByRole('button')).toHaveAttribute(
    'aria-describedby',
    'test',
  );
  expect(screen.getByRole('tooltip')).toHaveAttribute('id', 'test');
});