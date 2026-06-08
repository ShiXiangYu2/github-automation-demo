const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('待办事项应用', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${path.join(__dirname, '..', 'index.html')}`);
  });

  test('页面加载成功', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('待办事项列表');
  });

  test('可以添加待办事项', async ({ page }) => {
    await page.fill('#todoInput', '测试任务');
    await page.click('button:has-text("添加")');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-item')).toContainText('测试任务');
  });

  test('可以删除待办事项', async ({ page }) => {
    await page.fill('#todoInput', '要删除的任务');
    await page.click('button:has-text("添加")');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await page.click('.delete-btn');
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  test('可以标记完成/未完成', async ({ page }) => {
    await page.fill('#todoInput', '可切换的任务');
    await page.click('button:has-text("添加")');
    await page.check('input[type="checkbox"]');
    await expect(page.locator('.todo-item')).toHaveClass(/completed/);
    await page.uncheck('input[type="checkbox"]');
    await expect(page.locator('.todo-item')).not.toHaveClass(/completed/);
  });
});