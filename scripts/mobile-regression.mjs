import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const base = process.env.MOBILE_TEST_BASE_URL ?? 'http://127.0.0.1:5174'
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (error) => errors.push(`PAGE: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`CONSOLE: ${message.text()}`)
})

try {
  await page.goto(`${base}/#/`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /让每一次好奇/ }).waitFor()

  const routes = [
    ['知识', '知识图谱库'],
    ['工具', '工具库'],
    ['项目', '项目库'],
    ['问题', '问题库'],
  ]

  for (const [navLabel, heading] of routes) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.locator('.mobile-nav-link').filter({ hasText: navLabel }).click()
    await page.getByRole('heading', { name: heading, exact: true }).waitFor()
    assert.equal(await page.evaluate(() => window.scrollY), 0, `${navLabel}页面未回到顶部`)
  }

  await page.screenshot({ path: 'artifacts/mobile-knowledge-fixed.png', fullPage: true })

  await page.goto(`${base}/#/new/question`, { waitUntil: 'networkidle' })
  await page.locator('#record-title').fill('为什么影子会跟着我走？')
  await page.locator('#question-scene').fill('晚饭后散步时观察路灯下的影子。'.repeat(45))
  await page.getByRole('button', { name: '保存问题' }).click()
  await page.waitForURL(/#\/record\/[^/]+$/)
  const backButton = page.getByRole('link', { name: '返回问题库' })
  await backButton.waitFor()
  assert.equal(await backButton.isVisible(), true)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(200)
  const buttonBox = await backButton.boundingBox()
  assert.ok(buttonBox && buttonBox.y >= 0 && buttonBox.y < 140, '返回按钮未固定在移动端可视区域')
  await page.screenshot({ path: 'artifacts/mobile-detail-back-fixed.png', fullPage: false })

  await backButton.click()
  await page.getByRole('heading', { name: '问题库', exact: true }).waitFor()
  await page.locator('.record-card').first().click()
  await page.waitForURL(/#\/record\/[^/]+$/)
  await page.getByRole('link', { name: '返回问题库' }).waitFor()

  assert.deepEqual(errors, [], errors.join('\n'))
  console.log('MOBILE_ROUTES_OK knowledge=ok tools=ok projects=ok back-button=ok scroll-reset=ok')
} finally {
  await browser.close()
}
