import path from "path"
import fs from "fs"
import puppeteer, { Browser, Page } from "puppeteer"

const eigaDotComDomain = "https://eiga.com"

// TODO: ts, node?環境で range.ts モジュールが読み込めない
const range = (from: number, to: number): number[] => {
  const range: number[] = []
  for (let i = from; i <= to; i++) {
    range.push(i)
  }
  return range
}

const openDetailPages = async (
  paginatedPage: Page,
  browser: Browser
): Promise<Page[]> => {
  const titleLinks = await paginatedPage.$x("//div[@class='data-img']/a")
  return Promise.all(
    titleLinks.map(async (link) => {
      const detailPage = await browser.newPage()
      const detailUrl = await (await link.getProperty("href")).jsonValue()
      detailPage.goto(`${detailUrl}`, { waitUntil: "domcontentloaded" })
      return detailPage
    })
  )
}

const main = async (userId: string, email: string, password: string) => {
  const viewPort = { width: 1000, height: 2000 }
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: viewPort,
  })
  const page = await browser.newPage()

  await page.goto(`${eigaDotComDomain}/login`, {
    waitUntil: "domcontentloaded",
  })

  await page.type("#email", email)
  await page.type("#password", password)
  // ログインセッションの保存はオフに
  const checkBox = await page.$("#remember_me")
  const isStoringSession = await (
    await checkBox?.getProperty("checked")
  )?.jsonValue()
  if (isStoringSession) await checkBox?.click()

  const loginButtons = await page.$x("//button[text()='ログインする']")
  await loginButtons[0].click()
  page.close()

  const targetUrl = `${eigaDotComDomain}/user/${userId}/movie`

  let titles: string[] = []
  const getTitles = async (pageNumber: number) => {
    const paginatedPage = await browser.newPage()
    if (pageNumber === 1) {
      await paginatedPage.goto(targetUrl, { waitUntil: "domcontentloaded" })
    } else {
      await paginatedPage.goto(`${targetUrl}/new/${String(pageNumber)}`, {
        waitUntil: "domcontentloaded",
      })
    }

    const detailPages = await openDetailPages(paginatedPage, browser)

    detailPages.map(async (page) => {
      const selector = ".movie-details > .data"
      const tmpTitle = await page.$$eval(
        selector,
        (elements) => elements[0].textContent ?? ""
      )
      console.log(tmpTitle)
      titles = [...titles, tmpTitle]
      page.close()
    })

    // if (pageNumber === 103)
    fs.writeFileSync(
      path.join(process.cwd(), "export/check-in.json"),
      JSON.stringify(titles)
    )
    await paginatedPage.waitFor(1000)
  }

  range(1, 1).forEach(async (i) => await getTitles(i))

  // ここでファイルを書き込むと titles が空配列
  // fs.writeFileSync(
  //   path.join(process.cwd(), "export/check-in.json"),
  //   JSON.stringify(titles)
  // )

  // 書き込み前にプログラム終了してしまう
  // await browser.close()
}

const buffer = fs.readFileSync(path.join(process.cwd(), "credential.json"))
const { userId, email, password } = JSON.parse(buffer.toString())

main(userId, email, password).catch((e) => {
  console.error(e)
})
