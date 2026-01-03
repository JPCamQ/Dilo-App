// Jest Setup - Global Mocks
// These mocks prevent React Native modules from being loaded

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
}));

// Mock axios for API calls
jest.mock('axios', () => ({
    get: jest.fn(() => Promise.resolve({ data: { dollar: 301.37 } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ data: {} })),
        post: jest.fn(() => Promise.resolve({ data: {} })),
    })),
}));

// Silence console during tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});
