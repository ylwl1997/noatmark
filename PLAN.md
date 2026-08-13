# NoAtMark 完整开发计划

> 更新：2026-08-13 v2 · Humanize 降级为「语气改写」辅助功能，优先真空词市场

## 一、关键决策

| 项 | 决策 | 理由 |
|---|---|---|
| 邮箱 | Cloudflare Email Routing | 免费，`hello@noatmark.com` 转发到个人邮箱 |
| 账号系统 | Clerk | 独立开发者最省事，免费 10k MAU |
| 计费 | Lemon Squeezy (Merchant of Record) | 出海免税务，webhook 发 API Key |
| 配额 | CF KV 按 user_id 计数 | 复用现有 KV |
| 语气改写 | CF Workers AI 免费 LLM 或已有 LLM API | wslc 验证过 CF 免费模型 |
| MCP | `@modelcontextprotocol/sdk` | 独立 npm 包 |
| 批量打包 | JSZip | 前端打包 |

## 二、核心战略：打真空词，不打红海

**我们的优势战场（真空/低竞争）**：
- unicode cleaning 10.7 · text cleaning api 19.9 · text hygiene api 25.5 · ai content compliance 27.4
- 隐形字符/清洗/防注入/文件处理 —— 确定性、可验证、诚实

**避开红海**：
- ai text humanizer 73.7 · humanize ai text 82.2 · ai detector api 72.4

## 三、Humanize 的定位（关键调整）

**降级**：不做主打产品，降级为「语气改写（Tone Rewriting）」辅助功能。

| 维度 | 原方案 | 调整后 |
|---|---|---|
| 定位 | Humanize 躲检测 | **语气改写**（academic/business/casual）|
| 目标词 | ai text humanizer（红海）| rewrite in casual tone（长尾）|
| 差异化 | 无 | **「改写后保证干净」**（输出必过 clean 引擎，QuillBot/WriteHuman 都没有）|
| 卖点 | 躲检测 | 调整语气 + 输出干净、可直接发布 |
| 优先级 | P1 | 降到 P3 之后，或 Inspector 附属 |

**技术**：`humanize.js` → Workers AI 改写 → 强制过 clean 引擎（Artifact-Free Rewriting）。

## 四、三条红线（不变）

1. ❌ 去 Claude 统计水印（密钥私有，谁都无法做）
2. ❌ 「保证通过 Turnitin/GPTZero」（检测器不可靠，虚假承诺）
3. ❌ 去 C2PA 溯源（违透明机制）

**Humanize 边界**：做「让文本更自然/调整语气」，**绝不**写「绕过检测器」。

## 五、客户群（四个变现引擎）

| 客户群 | 痛点 | 切入 | 定价锚点 |
|---|---|---|---|
| 程序员 | 喂 AI 防注入、代码/CSV 隐形字符 | MCP + sanitize API | $29/月 |
| 数据工作者 | 批量文件清洗 | 批量 + zip | $19-29/月 |
| 自媒体/创作者 | ChatGPT→CMS 格式乱 | WP/Ghost 插件 | $9/月 |
| 企业内容团队 | AI 内容合规、发布把关 | Inspector 团队版 | $149/月 + Sales |

（学生群体：不主攻「躲检测」，只做「格式干净」的免费/低价层，守住诚实边界。）

## 六、价格基准（调研，2026-08）
- QuillBot Premium $4.17/月 · Copyleaks Pro $75/月 · Originality.ai Pro $15/月
- Sapling API $0.005/千字符

## 七、阶段计划（调整后顺序）

### P0 — 基础设施（邮箱 + 账号 + 定价页）
- [ ] CF Email Routing：`hello@noatmark.com` → 转发
- [ ] Clerk 账号 + 应用 + 前端登录/注册
- [ ] `/account/` 页（API Key / 用量 / 订阅）
- [ ] `/pricing/` 页（Free / Creator $9 / API Pro $29 / Team $149 + Sales）
- 验收：邮箱收信；注册登录；定价页上线

### P1 — MCP + sanitize API（程序员，真空市场）
- [ ] `noatmark-mcp` npm 包（sanitize_text / scan_text / clean_format）
- [ ] `/api/sanitize` 端点（喂 AI 前剥隐形字符 + 防注入）
- [ ] `/mcp/` 配置文档页
- 验收：Claude Code 配置 MCP → 调用 sanitize_text 清洗零宽字符

### P2 — 批量文件清洗（数据工作者）
- [ ] file-cleaner 升级：多文件 + 批量扫描报告 + zip 打包下载
- 验收：10 个 CSV 批量清洗 + zip 下载

### P3 — WP/Ghost 插件（创作者，已验证需求）
- [ ] WP 插件完善：Gutenberg 侧栏「粘贴即清」+ 发布前警告
- [ ] Ghost 集成（差异化，MarkuClean 没做）
- [ ] 发布 wordpress.org
- 验收：WP 保存自动剥隐形字符 + 编辑器一键清理

### P4 — 批量文章体检（Inspector 批量）
- [ ] Inspector 多篇上传 → 批量 GEO 评分 → 一键修复 → 导出 CSV
- 验收：5 篇批量评分 + 导出报告

### P5 — 语气改写（Tone Rewriting，Humanize 降级版）
- [ ] `humanize.js`：Workers AI 改写 + 语气切换 + 强制 clean
- [ ] `/tools/rewrite/` 工具页
- [ ] 诚实文案：「调整语气，输出干净文本」
- 验收：AI 文本改写 → 输出自然 + 无隐形字符

### P6 — 收费闭环
- [ ] Clerk + Lemon Squeezy + webhook 发 API Key
- [ ] 配额计量（KV 按 user_id）
- [ ] 改写字数、API 调用、批量配额分档
- 验收：付费 → 拿 Pro → API Key 可用 → 配额扣减

## 八、定价阶梯

| 档位 | 价格 | 目标 | 核心功能 |
|---|---|---|---|
| Free | $0 | 引流 | 单文件清洗 + 基础扫描 + 限流 API |
| Creator | $9/月 | 创作者 | 批量 + WP 插件 + 语气改写 |
| API Pro | $29/月 | 开发者 | sanitize/scan/clean 高配额 + MCP |
| Team | $149/月 | 内容团队 | Inspector 团队版 + 批量审计 |
| Enterprise | Talk to Sales | 企业 | 合规报告 + 私有部署 + SLA |

## 九、启动顺序
P0 → P1(MCP) → P2(批量) → P3(WP/Ghost) → P4(Inspector批量) → P5(语气改写) → P6(收费)

**核心逻辑**：先打真空词（MCP/清洗/防注入），再做已验证需求（WP 插件），Humanize 降级为语气改写排后面，最后接收费。
