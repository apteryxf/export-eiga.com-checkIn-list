import path from "path"
import fs from "fs"
import puppeteer from "puppeteer"
import minimist from "minimist"

const eigaDotComDomain = "https://eiga.com"

// TODO: ts, node?環境で range.ts モジュールが読み込めない
const range = (from: number, to: number): number[] => {
  const range: number[] = []
  for (let i = from; i <= to; i++) {
    range.push(i)
  }
  return range
}

const main = async (userId: string, email: string, password: string) => {
  const viewPort = { width: 1000, height: 2000 }
  const browser = await puppeteer.launch({
    // headless: false,
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
    const newPage = await browser.newPage()
    if (pageNumber === 1) {
      await newPage.goto(targetUrl, { waitUntil: "domcontentloaded" })
    } else {
      await newPage.goto(`${targetUrl}/new/${String(pageNumber)}`, {
        waitUntil: "domcontentloaded",
      })
    }

    const selector = ".list-my-data > .data-txt > .title"
    const tmpTitles = await newPage.$$eval(selector, (elements) =>
      elements.map((element) => element.textContent ?? "")
    )
    titles = [...titles, ...tmpTitles]

    if (pageNumber === 103)
      fs.writeFileSync(
        path.join(process.cwd(), "result.json"),
        JSON.stringify(titles)
      )
  }

  range(1, 103).forEach(async (i) => {
    setTimeout(async () => await getTitles(i), 3000)
  })

  // ここでファイルを書き込むと titles が空配列
  // fs.writeFileSync(
  //   path.join(process.cwd(), "result.txt"),
  //   JSON.stringify(titles)
  // )

  // 書き込み前にプログラム終了してしまう
  // await browser.close()
}

const args = minimist(process.argv.slice(2))

main(args.userId, args.email, args.password).catch((e) => {
  if (args.length !== 3) {
    console.error("引数は3つ入力してください")
    process.exit(1)
  }
  console.error(e)
})
