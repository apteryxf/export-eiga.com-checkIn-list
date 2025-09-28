import type { Browser, Page } from "puppeteer"
import { delay } from "./utils"

export const prepareFilmarksWindow = async (browser: Browser): Promise<Page> => {
  const pages = await browser.pages()
  if (pages.length > 0) {
    await Promise.all(pages.map((p) => p.close().catch(() => undefined)))
  }

  const page = await browser.newPage()

  try {
    const { width: screenWidth, height: screenHeight } = await page.evaluate(() => ({
      width: window.screen.availWidth ?? window.innerWidth,
      height: window.screen.availHeight ?? window.innerHeight,
    }))

    const targetWidth = Math.floor(screenWidth / 2)
    const targetHeight = screenHeight
    const targetLeft = Math.floor((screenWidth - targetWidth) / 2)
    const targetTop = 0

    await page.setViewport({ width: targetWidth, height: targetHeight })

    const session = await page.target().createCDPSession()
    const { windowId } = await session.send("Browser.getWindowForTarget")
    await session.send("Browser.setWindowBounds", {
      windowId,
      bounds: {
        width: targetWidth,
        height: targetHeight,
        left: targetLeft,
        top: targetTop,
        windowState: "normal",
      },
    })
  } catch (error) {
    console.warn("Could not resize/position the Filmarks window", error)
  }

  await delay(300)
  return page
}
