# GitHub 自动化开发完整指南

本文档描述如何使用 GitHub Issues + Projects + Actions 实现**完全自动化**的开发流程。

---

## 核心流程概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        完整自动化开发流程                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ 创建 Issue (功能需求/Bug)                                      │
│           ↓                                                          │
│  2️⃣ Triage 分类 (打标签: needs-triage → ready-for-agent)           │
│           ↓                                                          │
│  3️⃣ 拆分为垂直切片 (to-issues skill)                               │
│           ↓                                                          │
│  4️⃣ 创建功能分支 (git checkout -b feature/xxx)                     │
│           ↓                                                          │
│  5️⃣ 编写代码 + 单元测试                                             │
│           ↓                                                          │
│  6️⃣ 推送分支并创建 PR (git push -u origin feature/xxx)              │
│           ↓                                                          │
│  7️⃣ GitHub Actions 自动运行 CI 测试 (远程)                         │
│           ↓                                                          │
│       ┌────────────────────────────────┐                           │
│       │  GitHub Actions CI (远程)       │                           │
│       │  - npm ci (安装依赖)            │                           │
│       │  - npm run test:unit (Jest)    │                           │
│       │  - npm run test:e2e (Playwright)│                          │
│       └────────────────────────────────┘                           │
│           ↓                                                          │
│       测试失败 ❌ → PR 被阻止合并，修复代码重新推送                  │
│           ↓                                                          │
│       测试成功 ✅ → 合并 PR (gh pr merge)                          │
│           ↓                                                          │
│  8️⃣ PR 合并后 Issue 自动关闭                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 第一步：项目初始化

### 1.1 创建 GitHub 仓库

```bash
# 方法一：使用 GitHub CLI (推荐)
gh repo create <repo-name> --public --description "项目描述" --clone

# 示例
gh repo create my-project --public --description "我的自动化项目" --clone
cd my-project
```

### 1.2 配置 Git 代理 (如需)

```bash
# 如果你在中国大陆，需要配置代理才能访问 GitHub
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897

# 端口号 7897 是 Clash 的默认端口，请根据实际情况修改
```

### 1.3 初始化 Agent Skills 配置

在项目中创建以下配置文件：

```bash
# 创建目录结构
mkdir -p docs/agents .github/ISSUE_TEMPLATE

# 创建 CLAUDE.md (Agent 配置文件)
cat > CLAUDE.md << 'EOF'
# CLAUDE.md

This file provides guidance to AI assistants that help with this repository.

## Agent skills

### Issue tracker

GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Standard triage labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout at repo root. See `docs/agents/domain.md`.
EOF

# 创建 docs/agents/issue-tracker.md
cat > docs/agents/issue-tracker.md << 'EOF'
# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`
- **Read an issue**: `gh issue view <number> --comments`
- **List issues**: `gh issue list --state open`
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply labels**: `gh issue edit <number> --add-label "..."`
- **Close**: `gh issue close <number> --comment "..."`
EOF

# 创建 docs/agents/triage-labels.md
cat > docs/agents/triage-labels.md << 'EOF'
# Triage Labels

| Label | Meaning |
| ----- | ------- |
| `needs-triage` | Maintainer needs to evaluate this issue |
| `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | Fully specified, ready for an AFK agent |
| `ready-for-human` | Requires human implementation |
| `wontfix` | Will not be actioned |
EOF

# 创建 docs/agents/domain.md
cat > docs/agents/domain.md << 'EOF'
# Domain Docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root.
EOF

# 创建 CONTEXT.md
cat > CONTEXT.md << 'EOF'
# Context

## Project Overview

<!-- 项目简介 -->

## Domain Language

<!-- 项目特定术语表 -->
EOF
```

### 1.4 创建 GitHub Triage 标签

```bash
gh label create "needs-triage" --description "Maintainer needs to evaluate this issue" --color "fbca04"
gh label create "needs-info" --description "Waiting on reporter for more information" --color "ff9800"
gh label create "ready-for-agent" --description "Fully specified, ready for an AFK agent" --color "0e8a16"
gh label create "ready-for-human" --description "Requires human implementation" --color "1d76db"
gh label create "bug" --description "Something is broken" --color "d73a4a"
gh label create "enhancement" --description "New feature or improvement" --color "a2eeef"
```

### 1.5 提交并推送初始配置

```bash
git add -A
git commit -m "feat: initial project setup with agent skills configuration"
git push origin main
```

---

## 第二步：配置 GitHub Actions CI

### 2.1 初始化 npm 项目

```bash
npm init -y
```

### 2.2 安装测试依赖

```bash
# 安装 Jest (单元测试)
npm install --save-dev jest@29.7.0

# 安装 Playwright (E2E 浏览器测试)
npm install --save-dev @playwright/test
```

### 2.3 创建目录结构

```bash
mkdir -p .github/workflows tests
```

### 2.4 创建单元测试

```bash
cat > tests/example.test.js << 'EOF'
// 示例单元测试
describe('功能模块', () => {
  test('基本测试', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF
```

### 2.5 创建 E2E 测试 (可选，如不需要可跳过)

```bash
cat > playwright.config.js << 'EOF'
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    headless: true,
  },
});
EOF

cat > tests/example.spec.js << 'EOF'
const { test, expect } = require('@playwright/test');

test.describe('示例测试', () => {
  test('页面加载', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../index.html');
    await expect(page.locator('body')).toBeVisible();
  });
});
EOF
```

### 2.6 创建 GitHub Actions 工作流

```bash
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
EOF
```

### 2.7 更新 package.json scripts

```bash
cat > package.json << 'EOF'
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "jest tests/*.test.js",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@playwright/test": "^1.60.0"
  }
}
EOF
```

### 2.8 创建 .gitignore

```bash
echo "node_modules/" > .gitignore
```

### 2.9 提交并推送

```bash
git add -A
git commit -m "feat: 配置 GitHub Actions CI"
git push origin main
```

### 2.10 验证 CI 运行

```bash
# 查看 CI 运行状态
gh run list --workflow=ci.yml

# 查看 CI 详情
gh run view <run-id>
```

---

## 第三步：日常开发流程

### 3.1 创建 Issue (需求/Bug)

```bash
# 通过 GitHub CLI 创建
gh issue create --title "实现用户登录功能" --body "$(cat <<'EOF'
## 问题描述

用户需要登录功能。

## 验收标准

- [ ] 用户可以输入用户名和密码
- [ ] 验证成功后跳转到首页
- [ ] 验证失败显示错误提示

## 附加信息

<!-- 任何其他信息 -->
EOF
)" --label "enhancement"

# 或通过 GitHub 网页创建
# https://github.com/<owner>/<repo>/issues/new/choose
```

### 3.2 Triage 分类

Issue 创建后，AI Agent 进行分类：

```bash
# 查看所有未分类的 issues
gh issue list --state open --label "enhancement"

# 为 issue 添加分类标签
gh issue edit <number> --add-label "ready-for-agent"

# 添加 triage 注释
gh issue comment <number> --body "$(cat <<'EOF'
> *This was generated by AI during triage.*

## Triage Notes

**Category:** enhancement

**State:** ready-for-agent

此 Issue 已完全规格化，可以直接被 AI Agent 领取执行。
EOF
)"
```

### 3.3 拆分为垂直切片

将复杂需求拆分为多个独立的垂直切片：

```bash
# 创建子 Issue (Slice 1)
gh issue create --title "[Slice 1] 实现登录表单 UI" \
  --body "$(cat <<'EOF'
## Parent

#<parent-issue-number>

## What to build

实现登录表单界面。

## Acceptance criteria

- [ ] 显示用户名输入框
- [ ] 显示密码输入框
- [ ] 显示登录按钮

## Blocked by

None
EOF
)" --label "enhancement" --label "ready-for-agent"

# 创建子 Issue (Slice 2)
gh issue create --title "[Slice 2] 实现登录验证逻辑" \
  --body "$(cat <<'EOF'
## Parent

#<parent-issue-number>

## What to build

实现登录验证逻辑。

## Acceptance criteria

- [ ] 验证用户名密码
- [ ] 验证成功返回 token
- [ ] 验证失败返回错误

## Blocked by

#<slice-1-issue-number>
EOF
)" --label "enhancement" --label "ready-for-agent"
```

### 3.4 开始实现

```bash
# 创建功能分支
git checkout main
git pull origin main
git checkout -b feature/login-form

# 编写代码
# ... 实现功能 ...

# 编写测试
# ... 编写测试用例 ...

# 提交代码
git add -A
git commit -m "feat: 实现登录表单 UI"
```

### 3.5 推送并创建 PR

```bash
# 推送分支
git push -u origin feature/login-form

# 创建 PR
gh pr create --title "feat: 实现登录表单 UI" \
  --body "$(cat <<'EOF'
完成 Issue #<issue-number>:
- 实现登录表单 UI
- 添加单元测试

Closes #<issue-number>
EOF
)"
```

### 3.6 GitHub Actions 自动测试

PR 创建后，GitHub Actions 会自动运行：

```
┌─────────────────────────────────────┐
│         GitHub Actions CI           │
├─────────────────────────────────────┤
│ ✓ Set up job                        │
│ ✓ Checkout code                     │
│ ✓ Setup Node.js                     │
│ ✓ Install dependencies (npm ci)     │
│ ✓ Run unit tests (npm run test:unit)│
│ ✓ Install Playwright browsers       │
│ ✓ Run E2E tests (npm run test:e2e) │
│ ✓ Post job                          │
└─────────────────────────────────────┘
              ↓
         测试通过 ✅
              ↓
         可以合并
```

### 3.7 合并 PR

```bash
# 合并 PR (squash 合并)
gh pr merge <pr-number> --squash --delete-branch

# 合并后，关联的 Issue 会自动关闭
```

---

## 第四步：完整命令速查表

### GitHub CLI 基础命令

```bash
# 仓库操作
gh repo create <name> --public --clone      # 创建仓库
gh repo clone <owner>/<repo>                  # 克隆仓库

# Issue 操作
gh issue create --title "标题" --body "内容"  # 创建 Issue
gh issue list --state open                    # 列出 open 的 issues
gh issue view <number>                        # 查看 Issue
gh issue edit <number> --add-label "xxx"      # 添加标签
gh issue comment <number> --body "内容"       # 评论
gh issue close <number>                       # 关闭 Issue

# PR 操作
gh pr create --title "标题" --body "内容"    # 创建 PR
gh pr list                                    # 列出 PRs
gh pr view <number>                           # 查看 PR
gh pr merge <number> --squash --delete-branch # 合并 PR
gh pr close <number>                          # 关闭 PR

# Actions 操作
gh run list                                   # 列出运行记录
gh run view <id>                              # 查看运行详情
gh run watch <id>                             # 实时监控运行
```

### Git 基础命令

```bash
git checkout -b <branch-name>                 # 创建并切换分支
git add -A                                    # 暂存所有更改
git commit -m "message"                       # 提交
git push -u origin <branch>                   # 推送并设置上游分支
git pull origin main                          # 拉取 main 分支
git branch -d <branch>                        # 删除本地分支
```

---

## 第五步：项目结构示例

```
my-project/
├── .github/
│   ├── ISSUE_TEMPLATE/                     # Issue 模板
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── workflows/
│       └── ci.yml                           # CI 工作流
├── docs/
│   └── agents/                              # Agent 配置
│       ├── issue-tracker.md
│       ├── triage-labels.md
│       └── domain.md
├── tests/                                   # 测试文件
│   ├── *.test.js                            # 单元测试 (Jest)
│   └── *.spec.js                            # E2E 测试 (Playwright)
├── CLAUDE.md                                # Agent 配置文件
├── CONTEXT.md                               # 项目上下文
├── package.json                             # npm 配置
├── playwright.config.js                     # Playwright 配置
├── .gitignore
└── README.md
```

---

## 常见问题

### Q: 如何跳过本地测试，直接推送到 GitHub Actions？

A: 不需要本地测试。流程是：
1. 在本地写代码和测试
2. 推送代码到 GitHub
3. GitHub Actions 在远程自动运行测试
4. 测试通过后再合并 PR

### Q: 本地测试环境如何配置？

A: 本地测试是可选的。如需配置：
```bash
npm install
npm run test:unit    # 运行单元测试
npx playwright install chromium  # 安装 Playwright
npm run test:e2e     # 运行 E2E 测试
```

### Q: 如何确保测试在 GitHub Actions 上通过？

A: 确保：
1. `package.json` 中的 `scripts.test` 能正确执行
2. 所有测试文件在 `tests/` 目录下
3. 没有平台特定的测试代码

### Q: 测试失败怎么办？

A: GitHub Actions 会显示失败详情：
```bash
gh run view <run-id> --log
```
根据错误信息修复代码，重新推送即可。

---

## 下一步

- 学习使用 TDD 开发流程 (`/tdd` skill)
- 学习使用 Projects 管理多个 Issues
- 学习使用 GitHub Actions 实现 CI/CD 部署

---

**文档版本**: 1.0
**最后更新**: 2026-06-08