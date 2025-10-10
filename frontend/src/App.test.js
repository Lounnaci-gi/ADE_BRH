import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ADE BRH title on login page', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /ADE BRH/i, level: 1 });
  expect(heading).toBeInTheDocument();
});
