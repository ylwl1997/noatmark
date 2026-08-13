=== NoAtMark Text Hygiene ===
Contributors: noatmark
Tags: invisible characters, zero-width space, unicode, text hygiene, cleanup, ai content, chatgpt
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Strip invisible characters (zero-width spaces, BOMs, soft hyphens) from your content automatically on save.

== Description ==

NoAtMark Text Hygiene removes invisible Unicode characters from your posts, titles, and excerpts automatically when you save — so text pasted from ChatGPT, Claude, or any web page never leaves hidden characters behind.

= Features =

* Auto-clean on save — content, excerpt, and title are stripped the moment you save.
* Gutenberg sidebar — a live count of invisible characters plus a one-click "Clean now" button.
* Bulk clean — a Tools page scans and cleans every post at once.
* 100% local — all processing happens inside your own WordPress install. No data ever leaves your server.

= What gets stripped =

* Zero-width space (U+200B), joiner (U+200D), non-joiner (U+200C)
* Word joiner (U+2060), BOM (U+FEFF), soft hyphen (U+00AD)
* Direction marks (U+200E / U+200F), combining grapheme joiner (U+034F)
* Variation selectors, special spaces, non-breaking space

Companion to the free web tools and API at https://noatmark.com/.

== Installation ==

1. Download the plugin zip.
2. In WordPress, go to Plugins → Add New → Upload Plugin and upload the zip.
3. Activate "NoAtMark Text Hygiene".

That's it — cleaning is on. The sidebar appears in the block editor automatically. For a full-site sweep, open Tools → NoAtMark Text Hygiene and click "Scan & clean all posts".

== Frequently Asked Questions ==

= Does it send my content anywhere? =

No. Everything runs locally in your WordPress install. No text, data, or API keys leave your server.

= Will it change the meaning of my text? =

No. It only removes invisible formatting characters (zero-width spaces, BOMs, soft hyphens). Visible text, links, images, and formatting are untouched.

= Does it work with the Classic Editor? =

The auto-clean on save works everywhere (including the Classic Editor). The live sidebar is for the block (Gutenberg) editor.

== Changelog ==

= 0.1.0 =
* Initial release: auto-clean on save, Gutenberg sidebar, and bulk-clean Tools page.

== Upgrade Notice ==

= 0.1.0 =
Initial release.
