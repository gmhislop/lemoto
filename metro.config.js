const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude old Next.js _legacy/ directory from Metro bundling
config.resolver.blockList = [new RegExp(`${path.resolve(__dirname, '_legacy')}.*`)];

module.exports = withNativeWind(config, { input: './global.css' });
