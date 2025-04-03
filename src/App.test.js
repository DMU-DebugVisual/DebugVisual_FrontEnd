import { render, screen } from '@testing-library/react';
import App from './App';
//푸시 시험
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
