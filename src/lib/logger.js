const isDevelopment = import.meta.env.DEV

class Logger {
  log(...args) {
    if (isDevelopment) {
      console.log(...args)
    }
  }

  error(...args) {
    if (isDevelopment) {
      console.error(...args)
    }
  }

  warn(...args) {
    if (isDevelopment) {
      console.warn(...args)
    }
  }
}

export const logger = new Logger()
