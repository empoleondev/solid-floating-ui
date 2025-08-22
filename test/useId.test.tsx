import { render, screen } from '@solidjs/testing-library';
import { expect, test } from 'vitest';

import { useId } from '../src';

function App() {
  const id = useId();
  return <div data-testid="useId">{id}</div>;
}

test('generates a random string', () => {
  render(() => <App />);
  expect(screen.getByTestId('useId').textContent).not.toBe('');
});