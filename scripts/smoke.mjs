import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5173'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const consoleErrors = []
const pageErrors = []

const browser = await chromium.launch({ executablePath: edge, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => pageErrors.push(error.message))

try {
  await page.goto(`${base}/#/`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /让每一次好奇/ }).waitFor()

  await page.goto(`${base}/#/new/knowledge`, { waitUntil: 'networkidle' })
  await page.locator('#record-title').fill('影子的方向与光源有关')
  await page.locator('#record-date').fill('2026-11-07')
  await page.locator('#knowledge-takeaway').fill('当光源在左边时，影子会落在右边。改变光源位置，影子的方向和长短也会变化。')
  await page.getByRole('button', { name: '保存知识' }).click()
  await page.waitForURL(/#\/record\/[^/]+$/)
  await page.getByRole('heading', { name: '影子的方向与光源有关' }).waitFor()

  await page.goto(`${base}/#/new/question`, { waitUntil: 'networkidle' })
  await page.locator('#record-title').fill('为什么影子总是跟着我跑？')
  await page.locator('#question-scene').fill('晚饭后散步，路灯把影子拉得很长')
  const relation = page.locator('.relation-result').filter({ hasText: '影子的方向与光源有关' }).first()
  await relation.waitFor()
  await relation.click()

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0n8AAAAASUVORK5CYII=',
    'base64',
  )
  await page.locator('input[type=file][accept="image/*"]').setInputFiles({
    name: '路灯下的影子.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await page.locator('.attachment-edit-item.pending').waitFor()
  await page.getByRole('button', { name: '保存问题' }).click()
  await page.waitForURL(/#\/record\/[^/]+$/)
  await page.getByRole('heading', { name: '为什么影子总是跟着我跑？' }).waitFor()
  assert.equal(await page.locator('.linked-record-row').count(), 1)
  assert.match(await page.locator('.linked-record-row').innerText(), /影子的方向与光源有关/)
  assert.equal(await page.locator('.gallery-image').count(), 1)

  await page.waitForTimeout(500)
  await page.screenshot({ path: 'artifacts/desktop-detail.png', fullPage: true })

  await page.locator('.linked-record-row').filter({ hasText: '影子的方向与光源有关' }).click()
  await page.waitForURL(/#\/record\/[^/]+$/)
  await page.getByRole('heading', { name: '影子的方向与光源有关' }).waitFor()
  assert.match(await page.locator('.linked-record-row').innerText(), /为什么影子总是跟着我跑？/)
  assert.match(await page.locator('.linked-record-row').innerText(), /反向关联/)

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: '影子的方向与光源有关' }).waitFor()
  assert.match(await page.locator('.linked-record-row').innerText(), /为什么影子总是跟着我跑？/)

  await page.goto(`${base}/#/new/tool`, { waitUntil: 'networkidle' })
  await page.locator('#record-title').fill('观察记录表')
  await page.locator('#tool-scenarios').fill('做长期观察、比较前后变化，或者整理实验证据时使用。')
  await page.getByRole('button', { name: '基本掌握' }).click()
  await page.getByRole('button', { name: '保存工具' }).click()
  await page.waitForURL(/#\/record\/[^/]+$/)
  await page.getByRole('heading', { name: '观察记录表' }).waitFor()
  assert.match(await page.locator('.detail-main').innerText(), /基本掌握/)

  await page.goto(`${base}/#/new/project`, { waitUntil: 'networkidle' })
  await page.locator('#record-title').fill('阳台上的四季观察计划')
  await page.locator('#project-end').fill('2027-02-28')
  await page.locator('#project-goal').fill('持续观察一株植物在四季中的变化，并形成自己的自然笔记。')
  await page.locator('#project-outcome').fill('一本包含照片、手绘和观察记录的四季自然笔记。')
  await page.locator('#project-reflection').fill('先从一个容易坚持的小观察开始，每周固定记录一次。')
  await page.locator('.relation-result').filter({ hasText: '为什么影子总是跟着我跑？' }).click()
  await page.locator('.relation-result').filter({ hasText: '观察记录表' }).click()
  await page.getByRole('button', { name: '保存项目' }).click()
  await page.waitForURL(/#\/record\/[^/]+$/)
  await page.getByRole('heading', { name: '阳台上的四季观察计划' }).waitFor()
  assert.equal(await page.locator('.linked-record-row').count(), 2)

  await page.goto(`${base}/#/search?q=影子`, { waitUntil: 'networkidle' })
  await page.locator('.record-card').first().waitFor()
  assert.ok((await page.locator('.record-card').count()) >= 2)

  await page.goto(`${base}/#/`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /让每一次好奇/ }).waitFor()
  assert.equal(await page.locator('.stat-card').count(), 4)
  assert.match(await page.locator('.connection-overview').innerText(), /3 条跨模块关联/)
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'artifacts/desktop-home.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/#/`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /让每一次好奇/ }).waitFor()
  assert.equal(await page.locator('.mobile-nav').isVisible(), true)
  assert.equal(await page.locator('.mobile-fab').isVisible(), true)
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'artifacts/mobile-home.png', fullPage: true })

  await page.goto(`${base}/#/settings`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: '设置与备份' }).waitFor()
  assert.match(await page.locator('.storage-figures').innerText(), /4\s*条记录/)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /导出完整备份/ }).click()
  const download = await downloadPromise
  const backupPath = 'artifacts/backup.json'
  await download.saveAs(backupPath)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '清空全部数据' }).click()
  await page.getByText('所有本地数据已清空。').waitFor()

  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('input[accept="application/json,.json"]').setInputFiles(backupPath)
  await page.getByText('备份导入完成，当前数据已恢复。').waitFor()

  await page.goto(`${base}/#/`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /让每一次好奇/ }).waitFor()
  assert.match(await page.locator('.connection-overview').innerText(), /3 条跨模块关联/)
  assert.equal(await page.locator('.record-card').count(), 4)

  assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join('\n')}`)
  assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join('\n')}`)
  console.log('SMOKE_OK records=4 links=3 attachment=1 persistence=ok mobile=ok backup=ok')
} finally {
  await browser.close()
}





