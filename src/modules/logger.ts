import {createLogger, format, transports, Logger} from 'winston'
const {combine, timestamp, align, label, colorize, printf} = format

const logFormat = printf(({level, message, label, timestamp}) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

export function logger(name: string): Logger {
  return createLogger({
    level: 'info',
    format: combine(
      colorize(),
      label({label: name}),
      timestamp(),
      align(),
      logFormat,
    ),
    transports: [
      new transports.Console(),
      // - Write all logs with importance level of `error` or less to `error.log`
      new transports.File({filename: 'app-error.log', level: 'error'}),
      // - Write all logs with importance level of `info` or less to `combined.log`
      new transports.File({filename: 'app-debug.log'}),
    ],
  })
}
