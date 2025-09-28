import type { Page } from "puppeteer"
import { delay } from "./utils"

const watchButtonXPath = "//button[contains(., '鑑賞済み') or contains(., '観た')]"

export const markTitleAsWatched = async (page: Page): Promise<"already" | "clicked" | "missing"> => {
  const buttons = await page.$x(watchButtonXPath)
  const target = buttons[0]
  if (!target) return "missing"

  const alreadyMarked = await page.evaluate((element) => {
    if (element.getAttribute("aria-pressed") === "true") return true
    if (element.classList.contains("is-active")) return true
    return element.textContent?.includes("済") ?? false
  }, target)

  if (alreadyMarked) return "already"

  await target.click()
  await delay(2000)
  return "clicked"
}
