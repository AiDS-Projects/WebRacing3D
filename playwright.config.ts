import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 端到端测试配置
 * 目标：游戏基础 UI（速度表、当前圈数、计时器、开始/重置界面）
 * 验收方式：真实浏览器渲染 + 截图比对
 */
export default defineConfig({
  // 测试文件目录
  testDir: "./tests/e2e",

  // 单个测试超时（截图 + 断言）
  timeout: 30_000,

  // 允许并行运行的 worker 数
  fullyParallel: true,

  // 仅当测试失败时保留截图/trace 等产物，CI 下强制保留
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],

  use: {
    // 本地游戏服务地址
    baseURL: process.env.BASE_URL ?? "http://localhost:4173",

    // 游戏画布视口
    viewport: { width: 1280, height: 720 },

    // 失败时自动截图（用于验收留档）
    screenshot: "only-on-failure",
    trace: "retain-on-failure",

    // 截图验收目录
    ...(process.env.UPDATE_SNAPSHOTS === "1"
      ? {}
      : {
          // 默认读取基线截图做比对
        }),
  },

  // 基线截图目录
  snapshotDir: "./tests/e2e/__screenshots__",

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 统一截图尺寸，保证基线可比对
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // 测试前自动拉起静态服务（游戏 UI 前端）
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // 服务就绪后再开始测试
    stdout: "pipe",
    stderr: "pipe",
  },

  // 全局期望超时（DOM 状态断言，如等待计时器、圈数更新）
  expect: {
    timeout: 10_000,
    // 截图比对容差
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
});