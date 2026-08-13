# NoAtMark 商业化战略（2026-08-13 定稿）

> 从「免费工具站」跨到「商业 SaaS」，广告做漏斗，订阅做变现。放弃 Humanize（红海 + 碰红线）。

## 变现模型

免费工具 + **少量广告** → 订阅**永久去广告** + 解锁 tier 能力。

| 档位 | 价格 | 对象 | 内容 |
|---|---|---|---|
| Free | $0 | 所有人 | 网页工具（少量广告）+ 限量 API |
| Creator | $9/月 | 创作者/学生 | 永久去广告 + 插件/扩展 + 批量 + GEO 评分 |
| API Pro | $29/月 | 开发者 | 永久去广告 + API/MCP/SDK 高配额 + CSV/RAG 净化 |
| Team | $149/月 | 内容团队 | 永久去广告 + 多席位 + 批量审计 + 合规报告 |

三条铁律：①「永久去广告」统一锚点；② 广告只放网页工具（开发者的 API/插件不放广告）；③ 付费壁垒是「复发性能力」，广告只是诱因。

## 三人群 + 主攻方向

1. **开发者（主攻）**：AI 输入侧净化/防注入 ——「不信任文本进 LLM/RAG/Agent 前清干净」
2. **创作者**：发布前内容干净/安全/AI 可见
3. **学生教师（网页优先）**：AI 产出保持干净 —— 红线：不做躲检测/代写/去水印

## 需求地图

### 开发者（8 项，按优先级）
| # | 需求 | 优先级 |
|---|---|---|
| 1 | CSV/公式注入转义（导出数据被 Excel 执行） | P0 最快落地 |
| 2 | RAG/文档间接注入防御（不可信文档投毒） | P1 旗舰 |
| 3 | 嵌入前 Unicode 规范化 | P1 |
| 4 | 日志/终端注入（ANSI/控制字符） | P2 |
| 5 | 输出校验（AI 回写代码/DB 前） | P2 |
| 6 | 密钥/PII 脱敏 | P3 |
| 7 | token 省钱 | 营销角度 |
| 8 | Prompt 泄漏防护 | 并入 #2 |

### 创作者（6 项）
复制粘贴格式崩溃✅ / GEO 评分✅ / 品牌安全自查🟡 / 多平台发布🟡 / 历史批量清理✅ / 发布前合规报告❌

### 学生教师（4 项，诚实）
提交前格式清洁 / 引用格式清洁 / 教师侧审计隐藏文本 / 语气改写（降级版）

## 交付型式

- **开发者（9）**：LangChain/LlamaIndex 集成⭐、API✅、MCP✅、GitHub Action⭐、SDK🟡、CLI、VSCode✅、Worker🟡、WAF 中间件
- **创作者（7）**：扩展✅、WP 插件✅、Ghost✅、Notion⭐、Google Docs、Zapier/Make、网页✅
- **学生教师**：网页优先 + 轻量扩展

## 优先级排序

🥇 CSV/公式注入 → 🥈 RAG 防注入 + LangChain → 🥉 GitHub Action/CI → 4 Notion/Docs → 5 教师审计 + Team

## 落地路线

| 阶段 | 任务 | 依赖 | 产出 |
|---|---|---|---|
| P0 验证词 | 哥飞 KD + SimilarWeb + GSC 跑新词簇 | api-credentials | KD 表 |
| P1 CSV 净化 | `/api/sanitize-csv` + 落地页 + SDK | P0 | 首个可收费端点 |
| P2 RAG 防御 | `/api/rag-sanitize` + LangChain + GitHub Action | P1 | 旗舰产品线 |
| P3 创作者扩张 | Notion + Google Docs | — | 创作者付费入口 |
| P4 计费闭环 | Lemon Squeezy + KV 配额 | P1 | 付费→去广告→扣量 |
| P5 学生教师 | 批量文档 + 教师审计 | — | 网页优先变现 |

## 待拍板阻塞项

1. 订阅模型：统一订阅（去广告统一锚点）—— 建议不拆消费/B2B
2. CSV/公式注入纳入开发者段第一优先 —— 建议纳入
3. 学生段红线边界 + 教师侧审计要不要做

## 调研证据（2026-08-13）

- CSV/公式注入：OWASP CSV Injection + WSTG 指南（确定性问题，零 SaaS 竞争）
- 嵌入前净化：OWASP AISVS C08-02 官方章 + FINOS AI 治理要求
- 间接提示注入/RAG 投毒：2026 最热融资恐惧，手法就是藏隐形文本（本行）
- 创作者复制粘贴崩溃：pactify.io / degpt.app / OpenAI 官方讨论串验证真实痛点

## P0 验证结果（2026-08-13 哥飞 KD 实测，17/20 词）

| 得分 | 难度 | 词 |
|---|---|---|
| 11.5 | 极易 | clean text before publishing |
| 13.7 | 极易 | csv injection prevention / rag sanitization |
| 17.6 | 极易 | remove invisible characters |
| 21.5–25.3 | 容易 | sanitize untrusted text / formula injection / sanitize llm input / llm input sanitization |
| 28.1–34.1 | 容易 | csv formula injection / prompt injection scanner / ai prompt sanitizer / llm sanitizer / prompt injection api |
| 39.2–41.3 | 中等 | prompt sanitizer / prompt sanitization |
| 48.1–51.3 | 中等 | csv injection / indirect prompt injection |

**结论**：
1. **泛话题词是中等**（csv injection 48.1 / indirect prompt injection 51.3）——OWASP/学术文章盘，别抢。
2. **动作词才是真空**：`csv injection prevention` 13.7、`rag sanitization` 13.7、`sanitize llm input` 23.1、`sanitize untrusted text` 21.5。
3. **全簇无红海**（≤51.3），对比 Humanize 73-87，转型从红海跨到易/真空，定量验证成立。
4. **创作者词全场最低**：`clean text before publishing` 11.5。

**构建顺序（修正）**：
1. `csv injection prevention`（13.7）→ CSV sanitize 工具页 + API —— 第一优先
2. `rag sanitization`（13.7）+ `sanitize llm input`（23.1）→ RAG 净化 API + LangChain 集成 —— 旗舰
3. `clean text before publishing`（11.5）→ 创作者发布前工具（复用 pre-publish-inspector）
