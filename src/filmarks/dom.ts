import type { Page } from "puppeteer"

export const waitForSelectorWithTimeout = async (
  page: Page,
  selector: string,
  timeout: number
) => {
  return page.waitForSelector(selector, { timeout }).catch(() => null)
}

export const elementsExist = async (
  page: Page,
  selector: string
): Promise<boolean> => {
  return Boolean(await page.$(selector))
}

export const logPageState = async (page: Page, context: string) => {
  const url = page.url()
  const title = await page.title().catch(() => "(no title)")
  console.log(`  [${context}] url=${url} title=${title}`)
}
