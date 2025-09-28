import type { Page } from "puppeteer"
import { delay, findFirstSelector } from "./utils"
import { logInfo, logWarn } from "./logger"
import { logPageState } from "./dom"
import type { FilmarksCredentials } from "./types"

const emailSelectors = [
  "input[name='user[email]']",
  "input[name='email']",
  "input#user_email",
  "input[type='email']",
]

const passwordSelectors = [
  "input[name='user[password]']",
  "input[name='password']",
  "input#user_password",
  "input[type='password']",
]

const submitSelectors = [
  "button[type='submit']",
  "input[type='submit']",
  "button[name='commit']",
]

export const loginToFilmarks = async (
  page: Page,
  credentials: FilmarksCredentials
): Promise<void> => {
  await page.goto("https://filmarks.com/login", {
    waitUntil: "networkidle2",
    timeout: 60000,
  })
  await logPageState(page, "after login page load")

  await page.waitForSelector("form#js-login", { timeout: 15000 })

  const emailSelector = await findFirstSelector(page, emailSelectors)
  const passwordSelector = await findFirstSelector(page, passwordSelectors)

  if (!emailSelector || !passwordSelector) {
    throw new Error("Filmarks login form fields were not found")
  }

  await page.click(emailSelector, { clickCount: 3 })
  await page.type(emailSelector, credentials.email, { delay: 20 })
  await page.click(passwordSelector, { clickCount: 3 })
  await page.type(passwordSelector, credentials.password, { delay: 20 })

  const submitSelector = await findFirstSelector(page, submitSelectors, {
    disposeHandle: false,
  })
  if (!submitSelector) {
    throw new Error("Filmarks login submit button was not found")
  }

  logInfo("  submitting login form")
  const navigationPromise = page
    .waitForNavigation({ waitUntil: "networkidle2", timeout: 40000 })
    .catch(() => null)

  const loginResponsePromise = page
    .waitForResponse(
      (response) =>
        response.url().includes("/login") &&
        response.request().method() === "POST",
      { timeout: 20000 }
    )
    .catch(() => null)

  await page.click(submitSelector)
  const [navigationResult, loginResponse] = await Promise.all([
    navigationPromise,
    loginResponsePromise,
  ])
  await logPageState(page, "after login submit")

  await delay(1500)

  const stillOnLogin = page.url().includes("/login")
  const formStillExists = Boolean(await page.$(emailSelector))

  if (stillOnLogin && formStillExists) {
    const errorText = await page
      .evaluate(() => {
        const node = document.querySelector(
          ".p-login__error, .c-alert, .c-Form__error, .alert"
        )
        return node?.textContent?.trim() ?? null
      })
      .catch(() => null)

    const detail = errorText ? `: ${errorText}` : ""
    throw new Error(`Failed to log in to Filmarks${detail}`)
  }

  if (loginResponse) {
    const status = loginResponse.status()
    const responseUrl = loginResponse.url()
    logWarn(`  login POST responded with status ${status} at ${responseUrl}`)
    throw new Error(
      `Filmarks login did not complete (status ${status} from ${responseUrl})`
    )
  }

  if (!navigationResult) {
    logWarn("  login navigation promise timed out")
    throw new Error("Filmarks login did not navigate to a new page")
  }

  logInfo("  login success (form dismissed)")
}
