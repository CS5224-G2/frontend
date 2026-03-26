// Jest mock for expo-crypto.
// Uses Node.js built-in crypto so SHA-256 output is identical to the real module.
const { createHash } = require('crypto');

module.exports = {
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(async (_algorithm, data) =>
    createHash('sha256').update(data).digest('hex'),
  ),
};
