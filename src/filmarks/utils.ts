import type { Page } from "puppeteer"

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const findFirstSelector = async (
  page: Page,
  selectors: string[],
  options: { disposeHandle?: boolean } = {}
): Promise<string | null> => {
  for (const selector of selectors) {
    const handle = await page.$(selector)
    if (handle) {
      if (options.disposeHandle !== false) await handle.dispose()
      return selector
    }
  }
  return null
}

export const getTrimmedText = async (
  page: Page,
  selector: string
): Promise<string | null> => {
  return page.$eval(
    selector,
    (element) => element.textContent?.trim() ?? null
  ).catch(() => null)
}
