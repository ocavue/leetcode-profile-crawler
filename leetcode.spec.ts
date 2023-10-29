import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'

import { test, type Page, type Response } from '@playwright/test'

// Sleep a while after each request to avoid 429 Too Many Requests error.
// Increase this value if you see this error.
const SLEEP_MILLISECONDS = 2000

test('Leetcode user profile', async ({ page }) => {
  const userIds = (process.env.LEETCODE_USER_ID_LIST ?? '')
    .split(',')
    .map((userId) => userId.toLowerCase().trim())
    .filter(Boolean)

  if (userIds.length === 0) {
    throw new Error(
      'Cannot find environment variable LEETCODE_USER_ID_LIST. Please set it to a comma-separated list of LeetCode user IDs.',
    )
  }

  const username = process.env.LEETCODE_USERNAME
  if (!username) {
    throw new Error('Cannot find environment variable LEETCODE_USERNAME')
  }

  const password = process.env.LEETCODE_PASSWORD
  if (!password) {
    throw new Error('Cannot find environment variable LEETCODE_PASSWORD')
  }

  await warmUp(page)

  await login(page, username, password)

  const cwd = process.cwd()
  const dataDir = path.join(cwd, 'data')

  const dateString = new Date()
    .toISOString()
    .replace('T', '-')
    .replace(':', '-')
    .replace('.', '-')
    .replace('Z', '')
  const dataFilePath = path.join(dataDir, `submission-data-${dateString}.json`)

  const fileWriter = async (data: unknown) => {
    await fs.mkdir('data', { recursive: true })
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2))
  }

  await getAllSubmissionList(page, userIds, fileWriter)
  console.log(
    `Data writting finished. You can find the data file at ${dataFilePath}`,
  )
})

// leetcode.com would re-direct to leetcode.cn if the request is from China. The
// workaround is to visit leetcode.com twice.
async function warmUp(page: Page) {
  await page.goto(`https://leetcode.com/ocavue/`)
  await sleep(SLEEP_MILLISECONDS * 2)
  await page.goto(`https://leetcode.com/ocavue/`)
  await sleep(SLEEP_MILLISECONDS * 2)
}

async function login(page: Page, username: string, password: string) {
  await page.goto('https://leetcode.com/accounts/login/')
  await page.getByPlaceholder('Username or E-mail').click()
  await page.getByPlaceholder('Username or E-mail').fill(username)
  await page.getByPlaceholder('Password').click()
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await sleep(SLEEP_MILLISECONDS)
}

async function getAllSubmissionList(
  page: Page,
  userIds: string[],
  dataWritter: (data: unknown) => Promise<void>,
) {
  const result: { [userId: string]: Submission[] } = {}

  let count = 0
  const totalCount = userIds.length
  for (const userId of userIds) {
    try {
      count++
      console.log(
        `Fetching submission list [${count}/${totalCount}]: ${userId}`,
      )
      result[userId] = await getUserSubmissionList(page, userId)
      await dataWritter(result)
      await sleep(SLEEP_MILLISECONDS)
    } catch (error) {
      console.warn(`Failed to get submission list for user ${userId}`)
    }
  }
}

async function getUserSubmissionList(page: Page, userId: string) {
  await page.goto(`https://leetcode.com/${userId}/`)

  const response = await page.waitForResponse(waitForSubmissionListResponse)
  return await extractSubmissionList(response)
}

type Submission = {
  id: string | number
  title: string
  titleSlug: string
  timestamp: string | number
}

type SubmissionListResponse = {
  data: {
    recentAcSubmissionList: Submission[]
  }
}

async function waitForSubmissionListResponse(response: Response) {
  try {
    await extractSubmissionList(response)
    return true
  } catch (error) {
    return false
  }
}

async function extractSubmissionList(response: Response) {
  await response.finished()
  const json = (await response.json()) as SubmissionListResponse
  const recentAcSubmissionList = json.data.recentAcSubmissionList

  if (
    Array.isArray(recentAcSubmissionList) &&
    recentAcSubmissionList.length > 0 &&
    recentAcSubmissionList[0].id &&
    recentAcSubmissionList[0].timestamp
  ) {
    return recentAcSubmissionList
  }

  throw new Error(
    `Failed to extract submission list from response of ${response.url()}`,
  )
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
