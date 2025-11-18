const isDevelopment = process.env.NODE_ENV !== 'production'

class Logger {
  log(...args) {
    if (isDevelopment) {
      console.log(...args)
    }
  }

  error(...args) {
    // Always log errors, even in production
    console.error(...args)
  }

  warn(...args) {
    if (isDevelopment) {
      console.warn(...args)
    }
  }
}

export const logger = new Logger()
