# NoAtMark 详细开发计划（2026-08-13）

> 依据 STRATEGY.md 战略 + P0 KD 实测数据。前端重设计前置，再做商业化功能。

## 总览

| 阶段 | 主题 | 依赖 | 核心产出 | 工作量 |
|---|---|---|---|---|
| P0 | 前端重构 + 重定位 | — | 新导航/首页/定价 + 模板化 | 大 |
| P1 | CSV 注入净化（KD 13.7） | P0 | csv sanitize 工具页 + API | 中 |
| P2 | RAG 净化 + LangChain（KD 13.7） | P1 | rag-sanitize API + 集成 + GitHub Action | 大 |
| P3 | 创作者扩张（KD 11.5） | P0 | Notion/Docs + pre-publish 强化 | 中 |
| P4 | 计费闭环 | P1 | Lemon Squeezy + KV + 去广告 | 中 |
| P5 | 学生教师（网页优先） | P0 | 批量文档 + 教师审计 | 小 |

## P0 — 前端重构 + 重定位

### 诊断（根因，不是视觉）

视觉设计系统 v2（暗色玻璃拟态 + mint tokens）本身是好的，**不推翻**。真正问题是 4 点：

1. **信息架构**：导航按 feature（Tools/API/MCP/C2PA/Humanize），不按人群/场景
2. **定位**：首页 H1 还是「隐形字符扫描器」，pricing 还挂着「Humanize coming soon $9」
3. **架构**：header/footer 每页复制粘贴（~30 文件），改一处要改 30 处
4. **缺开发者段**：主攻的 CSV/RAG 净化在首页零体现

### 任务

| # | 任务 | 产出 | 工作量 |
|---|---|---|---|
| 0.1 | build.py 模板化：提取 HEAD/NAV/FOOT 模板（复用 ibaneasy 已验证模式） | 单一事实来源 | 中 |
| 0.2 | 导航重构：Developers / Creators / Students / Tools / Pricing / Docs，移除 Humanize | 新导航 | 小 |
| 0.3 | 首页重写：新价值主张 + 三人群分叉 + 旗舰工具入口 + 新定价 + OWASP 背书 | 新首页 | 中 |
| 0.4 | 定价页（Free/Creator $9/API Pro $29/Team $149 + 永久去广告锚点） | /pricing/ | 小 |
| 0.5 | 移除 Humanize（nav/footer/pricing/learn/FAQ 全清理） | 清理 | 小 |
| 0.6 | 广告位预留（免费层 1-2 个 Adsterra 槽） | 广告槽 | 小 |

**验收**：改导航只改一处；三人群各 1 步找到入口；全站无 Humanize 残留；定价页上线。

## P1 — CSV 注入净化（KD 13.7）

| # | 任务 | 产出 |
|---|---|---|
| 1.1 | `/tools/csv-injection-sanitizer/` 工具页（粘贴 CSV → 转义 `=` `+` `-` `@` 前导） | 工具页 |
| 1.2 | `/api/sanitize-csv` 端点（CF Worker） | API |
| 1.3 | SDK 加 `escapeFormula`（npm/Python） | SDK |
| 1.4 | 落地页 SEO：csv injection prevention / formula injection / csv formula injection | 落地页 |

**验收**：粘贴含 `=cmd` 的 CSV → 输出前导 `'` 转义；API 返回转义后 cell。

## P2 — RAG 净化 + LangChain（KD 13.7）

| # | 任务 | 产出 |
|---|---|---|
| 2.1 | `/api/rag-sanitize` 端点（去不可信指令/隐藏文本/注入模式） | API |
| 2.2 | LangChain/LlamaIndex 文档加载器（`sanitize_document`） | 集成 |
| 2.3 | GitHub Action（CI 门禁：不可信文档含注入 → fail） | CI |
| 2.4 | 落地页：rag sanitization / sanitize llm input / sanitize untrusted text | 落地页 |

## P3 — 创作者扩张（KD 11.5）

Notion 集成 / Google Docs 附加组件 / pre-publish inspector 批量。词：`clean text before publishing`。

## P4 — 计费闭环

Clerk + Lemon Squeezy + KV 配额 + 去广告（付费 flag = 永久去广告）。

## P5 — 学生教师（网页优先）

批量文档清洁 + 教师侧审计隐藏文本。

## 依赖关系

```
P0 ─┬─ P1 ── P2 ── P4
    ├─ P3
    └─ P5
```

## 阻塞项（需拍板）

1. **前端模板化**：是否引入 build.py（建议引入，复用 ibaneasy 已验证模式）——否则改导航永远要改 30 处
2. **视觉方向**：保留现有暗色玻璃拟态（我的建议），还是换全新视觉（如浅色 SaaS 专业风）
3. **账号/计费时机**：P4 的 Clerk+LemonSqueezy 是否后置，先做静态定价页（建议后置，先验证免费→转化）
