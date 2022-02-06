import path from "path"
import fs from "fs"
import puppeteer from "puppeteer"
import minimist from "minimist"

const eigaDotComDomain = "https://eiga.com"

const main = async (userId: string, email: string, password: string) => {
  const viewPort = { width: 2000, height: 3000 }
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

  const targetUrl = `${eigaDotComDomain}/user/${userId}/movie`

  await page.goto(targetUrl)

  // get title texts
  const selector = ".list-my-data > .data-txt > .title"
  const titleTexts = await page.$$eval(selector, (elements) =>
    elements.map((element) => element.textContent)
  )
  fs.writeFileSync(
    path.join(process.cwd(), "result.txt"),
    JSON.stringify(titleTexts)
  )

  await browser.close()
}

const args = minimist(process.argv.slice(2))

main(args.userId, args.email, args.password).catch((e) => {
  if (args.length !== 3) {
    console.error("引数は3つ入力してください")
    process.exit(1)
  }
  console.error(e)
})
