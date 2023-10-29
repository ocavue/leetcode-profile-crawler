import fs from 'node:fs/promises'
import path from 'node:path'

import { test, type Page, type Response } from '@playwright/test'

// Sleep a while after each request to avoid 429 Too Many Requests error.
const SLEEP_MILLISECONDS = 1000

test('test', async ({ page }) => {
  const userIds = (process.env.LEETCODE_USER_ID_LIST ?? '')
    .split(',')
    .map((userId) => userId.toLowerCase().trim())
    .filter(Boolean)

  if (userIds.length === 0) {
    throw new Error(
      'Cannot find environment variable LEETCODE_USER_ID_LIST. Please set it to a comma-separated list of LeetCode user IDs.',
    )
  }

  await warmUpLeetcode(page)

  const submissionData = await getAllSubmissionList(page, userIds)

  const cwd = process.cwd()
  const dataDir = path.join(cwd, 'data')
  const dateString = new Date()
    .toISOString()
    .replace('T', '-')
    .replace(':', '-')
    .replace('.', '-')
    .replace('Z', '')
  const dataFilePath = path.join(dataDir, `submission-data-${dateString}.json`)

  await fs.mkdir('data', { recursive: true })
  await fs.writeFile(dataFilePath, JSON.stringify(submissionData, null, 2))
})

// leetcode.com would re-direct to leetcode.cn if the request is from China. The
// workaround is to visit leetcode.com twice.
async function warmUpLeetcode(page: Page) {
  await page.goto(`https://leetcode.com/ocavue/`)
  await sleep(2000)
  await page.goto(`https://leetcode.com/ocavue/`)
  await sleep(2000)
}

async function getAllSubmissionList(page: Page, userIds: string[]) {
  const result: { [userId: string]: Submission[] } = {}

  for (const userId of userIds) {
    try {
      result[userId] = await getUserSubmissionList(page, userId)

      await sleep(SLEEP_MILLISECONDS)
    } catch (error) {
      console.warn(`Failed to get submission list for user ${userId}`)
    }
  }

  return result
}

async function getUserSubmissionList(page: Page, userId: string) {
  console.log("fetching user's submission list", userId)

  await sleep(100000)

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
