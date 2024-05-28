module.exports = {
  istanbulReporter: ["html", "lcov", "text"],
  providerOptions: {
    mnemonic: process.env.PRIVATE_KEY,
  },
  skipFiles: ["test"],
};
