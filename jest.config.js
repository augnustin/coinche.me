// This project ships as native ESM ("type": "module" in package.json), and
// nothing in app/js, server/ or shared/ needs JSX or TypeScript transformed —
// so tests run under Node's native ESM support instead of a Babel transform.
// That's why "transform" is empty: adding one back (e.g. babel-jest) would
// require reintroducing a project-wide Babel config purely for tests, which
// this codebase deliberately doesn't otherwise carry.
// Native ESM in Jest is still gated behind a Node flag, which is why the
// "test" script in package.json sets NODE_OPTIONS=--experimental-vm-modules.
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/.parcel-cache/'],
};
