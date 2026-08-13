#!/usr/bin/env node
// NoAtMark MCP server — text hygiene for AI agents.
// Tools: sanitize_text (strip invisible chars + flag prompt injection),
//        scan_text (report hidden text), clean_format (LLM formatting hygiene).
// Reuses the same engines behind noatmark.com.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import scan from "./lib/scan.cjs";
import clean from "./lib/clean.cjs";

const { scanHidden, stripInvisible, detectPromptInjection, detectHiddenHtml } = scan;
const { cleanLLMText } = clean;

const server = new McpServer({
  name: "noatmark",
  version: "0.1.0",
});

server.tool(
  "sanitize_text",
  "Clean text before feeding it to an LLM. Strips invisible/zero-width characters (U+200B, BOM, ZWJ, etc.) and flags prompt-injection patterns. Use this whenever you paste untrusted or copied content into a prompt, tool call, or context. Returns the cleaned text plus a risk report — injection risks are FLAGGED, not auto-deleted, because removing natural-language injection would corrupt legitimate content.",
  { text: z.string().describe("The text to sanitize") },
  async ({ text }) => {
    const cleaned = stripInvisible(text);
    const removed = text.length - cleaned.length;
    const injections = detectPromptInjection(text);
    const htmlFlags = detectHiddenHtml(text);
    const result = {
      cleaned,
      removed_invisible_chars: removed,
      injection_risks: injections,
      hidden_html_signals: htmlFlags,
      needs_review: injections.length > 0 || htmlFlags.length > 0,
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "scan_text",
  "Scan text for invisible characters, prompt-injection patterns, and hidden-text HTML signals. Reports counts and details by type without modifying anything.",
  { text: z.string().describe("The text to scan") },
  async ({ text }) => {
    const hidden = scanHidden(text);
    const result = {
      invisible_count: hidden.total,
      invisible_by_group: hidden.counts,
      invisible_details: hidden.matches.slice(0, 50).map((m) => ({
        code_point: "U+" + m.cp.toString(16).toUpperCase().padStart(4, "0"),
        name: m.name,
        index: m.index,
      })),
      injection_risks: detectPromptInjection(text),
      hidden_html_signals: detectHiddenHtml(text),
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "clean_format",
  "Clean LLM formatting artifacts: normalize line endings, collapse blank lines, strip trailing spaces, fix stray code fences, normalize over-deep headings, and remove empty list markers. Does NOT rewrite content or change meaning.",
  { text: z.string().describe("The text to format-clean") },
  async ({ text }) => {
    const r = cleanLLMText(text);
    const result = { cleaned: r.cleaned, changed: r.changed, stats: r.stats };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
