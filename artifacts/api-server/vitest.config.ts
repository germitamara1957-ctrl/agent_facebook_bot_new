import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals:         true,
    environment:     "node",
    include:         ["tests/**/*.test.ts"],
    // تشغيل الملفات بالتسلسل لتجنب تعارض بيانات الاختبار
    fileParallelism: false,
    maxWorkers:      1,
    testTimeout:     15000,
    hookTimeout:     15000,
    reporter:        "verbose",
    globalSetup:     "./tests/globalSetup.ts",
  },
});
