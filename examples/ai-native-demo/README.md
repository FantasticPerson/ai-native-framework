# AI-Native 管理系统 Demo

一个演示 **AI-native 能力**的 HR/OA 管理系统：传统操作需要「进模块 → 点新增 → 填表 → 提交」逐步点击，这里你只需说一句话，AI 自动帮你完成——并且**看得见**它在移动光标、逐字填表、点击提交。

## 它能做什么

在页面底部的 AI 输入条说一句话，例如：

- 「帮我提个明天的事假，一天，事由家里有事」
- 「新增员工赵敏，技术部，职位后端工程师，手机 13900001111」
- 「把报销按差旅筛选」
- 「审批通过最新的请假」
- 「切换到全年数据」

AI 会自动切换页面、打开表单、逐字填写、点击提交，全程可见。

## 核心亮点：能力自动收集

不需要为每条操作路径写死逻辑。开发时只要给页面元素贴上 `data-ai-*` 语义标注，构建时的 AST 扫描器会自动生成全量「能力清单」，AI 从清单里选择该操作哪个元素。**新增模块、新增按钮，AI 逻辑一行都不用改。**

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 LLM key（使用 DeepSeek）
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY

# 3. 启动
npm run dev
```

打开 http://localhost:5088 ，在底部输入条说话即可。

## 构建与部署

dev 用的 `/api/chat` 代理是 Vite 中间件，只在 `npm run dev` 生效；`vite build` 产出的 `dist/` 是纯静态资源，没有后端。所以生产用一个 Koa 服务（`server/prod-server.mjs`）同时托管静态资源和 `/api/chat` 代理。

```bash
# 1. 准备生产环境变量（与 dev 的 .env.development 分开）
cp .env.example .env
# 编辑 .env，填入真实 DEEPSEEK_API_KEY

# 2. 构建 + 启动（一条命令）
npm run serve        # = npm run build && npm run start
```

- 默认端口 5088，自定义：`PORT=8080 npm run start`
- 也可分两步：`npm run build` 产出 `dist/`，再 `npm run start` 起服务
- 上线建议再套 Nginx（HTTPS）+ pm2/systemd（进程守护）

### 用 pm2 守护

项目已带 `ecosystem.config.cjs`。构建 + 建好 `.env` 后：

```bash
npm install -g pm2                  # 首次安装 pm2
pm2 start ecosystem.config.cjs     # 启动
pm2 logs ai-native-demo            # 看日志
pm2 restart ai-native-demo         # 改代码后重启
pm2 startup && pm2 save            # 开机自启（按提示执行输出的命令）
```

端口在 `ecosystem.config.cjs` 的 `env.PORT` 改。

## 技术栈

React + TypeScript + Vite · zustand · DeepSeek（deepseek-chat）· @babel/parser · Vitest

## 架构

```
构建时: scripts/ai-scanner 扫 data-ai-* → src/ai-manifest.json（能力清单）
运行时: src/ai (AIBar → useAIAgent → executor) 读清单 + 调 LLM → 逐步演出
代理:   vite.config.ts 挂 /api/chat → DeepSeek（key 走 .env，不入前端）
业务:   src/modules（员工/请假/报销/仪表盘），只写 CRUD + 贴标注
```

`ai/` 与 `modules/` 通过 `data-ai-*` 标注契约彻底解耦。详见 `CLAUDE.md` 与 `docs/superpowers/`。

## 运行测试

```bash
npm run test
```
