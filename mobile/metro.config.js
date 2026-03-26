const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

// Allow Metro to resolve files imported from the repo-level shared folder.
config.watchFolders = [...new Set([...(config.watchFolders ?? []), workspaceRoot])];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Exclude test files from the production bundle.
// Without this, *.test.* files inside app/ are treated as Expo Router routes
// and Metro attempts to bundle test-only packages (e.g. @testing-library/react-native)
// that import Node built-ins unavailable in the native runtime.
config.resolver.blockList = [
  /.*\.test\.[jt]sx?$/,
  /.*\.spec\.[jt]sx?$/,
];

module.exports = withNativeWind(config, { input: './global.css' });
