import fs from "fs"
import path from "path"
import puppeteer from "puppeteer"

import { loginToFilmarks } from "./filmarks/login"
import { findDetailUrlForTitle } from "./filmarks/search"
import { markTitleAsWatched } from "./filmarks/watch"
import { prepareFilmarksWindow } from "./filmarks/window"
import { delay } from "./filmarks/utils"
import type { FilmarksCredentials } from "./filmarks/types"

interface CliOptions {
  chromePath: string
  titlesPath: string
  credentialsPath: string
  dryRun: boolean
  limit?: number
}

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2)
  const options: Partial<CliOptions> = {}

  for (const arg of args) {
    const [rawKey, rawValue] = arg.split("=")
    if (!rawKey.startsWith("--")) continue
    const key = rawKey.slice(2)
    const value = rawValue ?? ""

    switch (key) {
      case "chrome-path":
        if (value) options.chromePath = value
        break
      case "titles-path":
        if (value) options.titlesPath = value
        break
      case "credentials-path":
        if (value) options.credentialsPath = value
        break
      case "dry-run":
        options.dryRun = value === "false" ? false : true
        break
      case "limit":
        if (value) options.limit = Number(value)
        break
      default:
        break
    }
  }

  const chromePath =
    options.chromePath ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  const titlesPath =
    options.titlesPath ?? path.join(process.cwd(), "export/check-in-watched.json")
  const credentialsPath =
    options.credentialsPath ?? path.join(process.cwd(), "credential.json")

  return {
    chromePath,
    titlesPath,
    credentialsPath,
    dryRun: options.dryRun ?? false,
    limit: options.limit,
  }
}

const loadTitles = (titlesPath: string, limit?: number): string[] => {
  const raw = fs.readFileSync(titlesPath, "utf8")
  const parsed: unknown = JSON.parse(raw)

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array in ${titlesPath}`)
  }

  const deduped = parsed.reduce<string[]>((acc, title) => {
    if (typeof title !== "string") return acc
    if (acc.includes(title)) return acc
    acc.push(title)
    return acc
  }, [])

  return typeof limit === "number" ? deduped.slice(0, limit) : deduped
}

const loadCredentials = (credentialsPath: string): FilmarksCredentials => {
  const buffer = fs.readFileSync(credentialsPath, "utf8")
  const parsed: unknown = JSON.parse(buffer)

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("email" in parsed) ||
    !("password" in parsed)
  ) {
    throw new Error(`${credentialsPath} must include email and password`)
  }

  const { email, password } = parsed as {
    email: unknown
    password: unknown
  }

  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error(`Invalid credential format in ${credentialsPath}`)
  }

  return { email, password }
}

const run = async () => {
  const options = parseArgs()
  const titles = loadTitles(options.titlesPath, options.limit)
  const credentials = loadCredentials(options.credentialsPath)

  console.log(`Processing ${titles.length} titles`)

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: options.chromePath,
    defaultViewport: null,
    args: ["--disable-crash-reporter"],
  })

  const page = await prepareFilmarksWindow(browser)

  console.log("Logging in to Filmarks...")
  await loginToFilmarks(page, credentials)
  console.log("Logged in successfully")

  for (const [index, title] of titles.entries()) {
    console.log(`\n[${index + 1}/${titles.length}] ${title}`)

    if (options.dryRun) {
      console.log("Dry-run mode: skipping Filmarks navigation")
      continue
    }

    const detailUrl = await findDetailUrlForTitle(page, title)

    if (!detailUrl) {
      console.warn("  × Could not find matching result")
      continue
    }

    await page.goto(detailUrl, { waitUntil: "domcontentloaded" })
    await delay(8000)

    const result = await markTitleAsWatched(page)
    if (result === "missing") {
      console.warn("  × Could not find watch button")
    } else if (result === "already") {
      console.log("  ✓ Already marked as watched")
    } else {
      console.log("  ✓ Marked as watched")
    }

    await delay(2000)
  }

  await page.close()
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
