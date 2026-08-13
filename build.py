#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""NoAtMark build.py — 把共享 nav/footer 模板注入每个页面。

单一事实来源：templates/nav.html + templates/footer.html。
改模板后跑 `python build.py`，会把每个页面的 <header class="top">
和 <footer class="foot"> 重写为模板内容（幂等）。

页面 = 项目根下所有 index.html，排除非页面目录。
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
TPL = ROOT / "templates"

NAV = (TPL / "nav.html").read_text(encoding="utf-8").strip()
FOOT = (TPL / "footer.html").read_text(encoding="utf-8").strip()

NAV_RE = re.compile(r'<header class="top">.*?</header>', re.S)
FOOT_RE = re.compile(r'<footer class="foot">.*?</footer>', re.S)

EXCLUDE = {
    "templates", "node_modules", "functions", "js", "pypkg", "npm",
    "research", "wordpress-org", "test-files",
}


def pages():
    for p in ROOT.rglob("index.html"):
        rel = p.relative_to(ROOT).parts[:-1]  # directory parts only
        if any(part in EXCLUDE for part in rel):
            continue
        yield p


def main():
    built = 0
    changed = 0
    for p in sorted(pages()):
        html = p.read_text(encoding="utf-8")
        new = NAV_RE.sub(lambda m: NAV, html)
        new = FOOT_RE.sub(lambda m: FOOT, new)
        if new != html:
            p.write_text(new, encoding="utf-8")
            changed += 1
        built += 1
    print(f"built {built} pages, {changed} changed")


if __name__ == "__main__":
    main()
