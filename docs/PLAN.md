# LIFE.d MONITOR - 项目开发计划 (精细版)

本文档根据 `design.md` 的规范，制定了详细的、可执行的开发任务清单。

## 第一阶段：项目初始化与核心逻辑

- [ ] **1. 项目基础设置**
    - [ ] 执行 `pnpm create next-app@latest life-clock --typescript --eslint --app --src-dir --tailwind --import-alias "@/*"` 初始化项目。
    - [ ] 建立目录结构: `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/styles`。
    - [ ] 安装并配置 `Prettier`，确保与 `ESLint` 协同工作，统一代码风格。

- [ ] **2. 核心状态管理 (`useLifeMonitorState` Hook)**
    - [ ] 创建 `src/hooks/useLifeMonitorState.ts` 文件。
    - [ ] **状态定义**:
        - [ ] `perspective`: `'ELAPSED' | 'REMAINING'`
        - [ ] `birthDate`: `Date | null`
        - [ ] `lifeExpectancy`: `number | null`
        - [ ] `now`: `Date`
        - [ ] `isEditing`: `boolean` (用于控制浮窗显示)
    - [ ] **副作用 (Side Effects)**:
        - [ ] `useEffect` (on mount): 从 `localStorage` 读取 `birthDate` 和 `lifeExpectancy` 并初始化状态。如果无数据，则设置 `isEditing` 为 `true`。
        - [ ] `useEffect` (on `birthDate`, `lifeExpectancy` change): 将更新后的数据持久化到 `localStorage`。
        - [ ] `useEffect` (on mount/unmount): 设置一个 `setInterval` (例如 100ms) 来持续更新 `now` 状态，并在组件卸载时清除定时器。
    - [ ] **暴露接口**:
        - [ ] 封装并返回状态值。
        - [ ] 封装并返回更新函数: `togglePerspective`, `setUserData`, `setIsEditing`。

- [ ] **3. 数据模型与计算逻辑**
    - [ ] 安装 `date-fns` 库 (`pnpm add date-fns`) 用于精确的日期计算。
    - [ ] 创建 `src/lib/time.ts` 工具模块。
    - [ ] **计算函数**:
        - [ ] `calculateDerivedData(state)`: 接收核心状态，返回一个包含所有计算数据的对象 (`eolDate`, `elapsed`, `remaining`, `lifeDurationInSeconds`, etc.)。
        - [ ] `formatDuration(duration)`: 将 `date-fns` 的 `Duration` 对象转换为 `35y 11m 21d 18:31:52` 格式的字符串。
    - [ ] **校验逻辑**:
        - [ ] 添加单元测试，确保 `elapsed + remaining` 的总时长精确等于 `lifeExpectancy`。

## 第二阶段：UI 渲染引擎

- [ ] **1. 核心渲染引擎 (`lib/renderer.ts`)**
    - [ ] 创建 `render(state, overlay?)` 函数，其返回值为 `string[]` (屏幕缓冲)。
    - [ ] **布局绘制**:
        - [ ] 实现 `drawContainer(width, height)` 函数，生成 `+`, `-`, `|` 构成的边框。
        - [ ] 实现 `drawHeader(state)`，根据 `perspective` 动态渲染头部信息。
        - [ ] 实现 `drawDateAndClock(state)`，渲染日期和 ASCII 时钟。
        - [ ] 实现 `drawProgressBars(state)`，渲染所有时间单位的进度条。
        - [ ] 实现 `drawFooter(state)`，渲染交互提示和视角指示器。
    - [ ] 将上述绘制函数组合进 `render` 主函数，生成完整的界面帧。

- [ ] **2. ASCII 艺术组件渲染**
    - [ ] 创建 `src/components/AsciiClock.tsx` 组件。
    - [ ] 该组件接收 `now: Date` 作为 prop。
    - [ ] 实现一个从数字到 ASCII 字符矩阵的映射。
    - [ ] 根据当前时间（时、分、秒）生成对应的 ASCII 艺术字符串数组。
    - [ ] 在 `lib/renderer.ts` 中调用此逻辑。

- [ ] **3. 进度条组件渲染**
    - [ ] 在 `lib/renderer.ts` 中创建 `renderProgressBar(options)` 函数。
    - [ ] **参数 (`options`)**: `label`, `currentValue`, `totalValue`, `perspective`, `barWidth`。
    - [ ] **实现细节**:
        - [ ] 精确计算 `ELAPSED` 和 `REMAINING` 两种模式下的百分比。
        - [ ] 根据百分比和 `barWidth` 计算 `▓`, `░`, `█` 字符的数量和位置。
        - [ ] 为 `SECOND` 进度条单独处理 `>` 和 `<` 的移动轨迹逻辑。
        - [ ] 返回一个完整的、格式化的进度条字符串，例如 `HOUR[18/24] HR | |...| 75%`。

- [ ] **4. 主页面组件 (`src/app/page.tsx`)**
    - [ ] 在组件中调用 `useLifeMonitorState` Hook 获取最新状态。
    - [ ] 将状态传递给 `render` 引擎函数，获取屏幕缓冲。
    - [ ] 使用 `<pre>` 标签和 `join('\n')` 将字符串数组渲染到页面。
    - [ ] 在 `src/styles/globals.css` 中为渲染容器应用 `font-family: monospace` 和 `white-space: pre` 等样式。

## 第三阶段：交互与浮窗实现

- [ ] **1. 全局键盘交互**
    - [ ] 在主页面组件中使用 `useEffect` 添加 `window.addEventListener('keydown', ...)`。
    - [ ] **事件处理 (`handleKeyDown`)**:
        - [ ] 使用 `switch (event.key)` 处理不同按键。
        - [ ] `case 's'`, `case ' '`: 调用 `togglePerspective()`。
        - [ ] `case 'e'`: 调用 `setIsEditing(true)`。
        - [ ] 如果 `isEditing` 为 `true`，则额外处理 `Enter` 和 `Escape` 键。
    - [ ] 确保在 `useEffect` 的清理函数中调用 `removeEventListener`。

- [ ] **2. 设置/编辑浮窗 (Overlay)**
    - [ ] **渲染逻辑**:
        - [ ] 创建 `drawOverlay(screenBuffer, overlayContent)` 函数。
        - [ ] 该函数接收主屏幕缓冲和浮窗内容（字符串数组），根据预设坐标将浮窗内容“绘制”到主屏幕缓冲上，覆盖原有字符。
        - [ ] 在 `render` 主函数中，当 `state.isEditing` 为 `true` 时，调用此逻辑。
    - [ ] **浮窗组件 (`components/SetupOverlay.tsx`)**:
        - [ ] 创建一个组件，负责管理浮窗内部的表单输入状态 (`birthDate` 字符串, `lifeExpectancy` 字符串)。
        - [ ] 接收当前值和 `onConfirm`, `onCancel` 回调函数作为 props。
        - [ ] 实现 `Enter` 键触发表单验证和 `onConfirm`。
        - [ ] 实现 `Esc` 键触发 `onCancel`。
    - [ ] **状态集成**:
        - [ ] 在主页面组件中，当 `isEditing` 为 `true` 时，渲染浮窗组件（逻辑上，非视觉上），并将其输出传递给 `render` 引擎。

## 第四阶段：优化、部署与文档

- [ ] **1. 性能优化**
    - [ ] 使用 `React.memo` 包装纯展示性组件，例如 `AsciiClock`，如果它被拆分为独立组件。
    - [ ] 使用 `useMemo` 缓存 `render` 函数的计算结果，仅在依赖的状态变化时才重新计算。
    - [ ] 评估 `setInterval` 的频率，在保证流畅性的前提下，避免不必要的 CPU 消耗。

- [ ] **2. 项目收尾**
    - [ ] 编写 `README.md`，详细说明项目背景、如何启动、技术选型和交互方式。
    - [ ] **测试**:
        - [ ] 在主流浏览器 (Chrome, Firefox, Safari) 中测试显示效果。
        - [ ] 确保在不同分辨率下，布局依然保持完整。
        - [ ] 测试所有交互逻辑（键盘输入、数据存储、视角切换）。

- [ ] **3. 部署**
    - [ ] 确保所有环境变量已正确配置。
    - [ ] 通过 Vercel 的 Git 集成进行自动部署。
    - [ ] 部署后，访问线上 URL，进行最终验证。