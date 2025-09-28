import type { Page } from "puppeteer"
import { delay } from "./utils"

const normalize = (text: string) => text.replace(/\s+/g, "").toLowerCase()

export const findDetailUrlForTitle = async (
  page: Page,
  title: string
): Promise<string | null> => {
  const searchUrl = `https://filmarks.com/movies?q=${encodeURIComponent(title)}`
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" })
  await delay(1000)

  return page.evaluate((needle) => {
    const normalize = (text: string) => text.replace(/\s+/g, "").toLowerCase()
    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a[href^='/movies/']")
    )

    const normalizedNeedle = normalize(needle)
    let best: string | null = null
    let bestScore = Number.NEGATIVE_INFINITY

    for (const anchor of anchors) {
      const text = normalize(anchor.textContent ?? "")
      if (!text) continue
      if (!text.includes(normalizedNeedle)) continue

      const score = -Math.abs(text.length - normalizedNeedle.length)
      if (score > bestScore) {
        bestScore = score
        best = anchor.href
      }
    }

    return best
  }, title)
}
