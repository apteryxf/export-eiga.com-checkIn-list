export const logInfo = (message: string) => {
  console.log(message)
}

export const logWarn = (message: string) => {
  console.warn(message)
}

export const logError = (message: string, error?: unknown) => {
  console.error(message)
  if (error) console.error(error)
}
