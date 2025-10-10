// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Mock axios to avoid importing ESM build during Jest tests
jest.mock('axios', () => {
  const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    create: jest.fn(function create() { return mockAxios; })
  };
  return {
    __esModule: true,
    default: mockAxios
  };
});
