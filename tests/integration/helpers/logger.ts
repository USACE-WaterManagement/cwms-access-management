const VERBOSE = process.env.TEST_VERBOSE === 'true';

export const testLogger = {
  debug(message: string): void {
    if (VERBOSE) {
      process.stderr.write(`  [debug] ${message}\n`);
    }
  },

  info(message: string): void {
    if (VERBOSE) {
      process.stderr.write(`  [info] ${message}\n`);
    }
  },

  warn(message: string): void {
    process.stderr.write(`  [warn] ${message}\n`);
  },
};
