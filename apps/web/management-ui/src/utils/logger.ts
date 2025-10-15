import pino from 'pino';

export const logger = pino({
  browser: {
    asObject: true,
  },
  level: import.meta.env.VITE_LOG_LEVEL || 'info',
  transport:
    import.meta.env.MODE === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default logger;
