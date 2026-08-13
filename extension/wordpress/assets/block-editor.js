// NoAtMark Gutenberg editor sidebar.
// Shows a live count of invisible characters in the post and a "Clean now"
// button that strips them from the editor content in place.
// Uses React.createElement (no JSX) so it's plain, transpiler-free JS.
(function (wp) {
  "use strict";
  if (!wp || !wp.plugins || !wp.editPost || !wp.element) return;

  var el = wp.element.createElement;
  var registerPlugin = wp.plugins.registerPlugin;
  var PluginSidebar = wp.editPost.PluginSidebar;
  var useSelect = wp.data.useSelect;
  var useDispatch = wp.data.useDispatch;
  var PanelBody = wp.components.PanelBody;
  var Button = wp.components.Button;

  // Build the invisible-character regex from code points (no literal invisible chars).
  function buildRegex() {
    var pts = [0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF, 0x00AD, 0x200E, 0x200F, 0x034F, 0x00A0];
    var ranges = [[0xFE00, 0xFE0F], [0xE0100, 0xE01EF], [0x2000, 0x200A]];
    var cls = "";
    pts.forEach(function (cp) { cls += "\\u{" + cp.toString(16) + "}"; });
    ranges.forEach(function (r) { cls += "\\u{" + r[0].toString(16) + "}-\\u{" + r[1].toString(16) + "}"; });
    return new RegExp("[" + cls + "]", "gu");
  }
  var RX = buildRegex();

  function countInvisible(text) {
    var m = String(text || "").match(RX);
    return m ? m.length : 0;
  }
  function stripInvisible(text) {
    return String(text || "").replace(RX, "");
  }

  function NoAtMarkPanel() {
    var content = useSelect(function (select) {
      return select("core/editor").getEditedPostContent();
    }, []);
    var editPost = useDispatch("core/editor").editPost;
    var count = countInvisible(content);

    return el(
      PanelBody,
      { title: "NoAtMark Text Hygiene", initialOpen: true },
      el(
        "p",
        { style: { fontSize: "13px", color: count ? "#8a6d3b" : "#3c763d" } },
        count
          ? "⚠ " + count + " invisible character" + (count === 1 ? "" : "s") + " detected"
          : "✅ No invisible characters — clean"
      ),
      count > 0
        ? el(
            Button,
            {
              variant: "primary",
              onClick: function () { editPost({ content: stripInvisible(content) }); },
            },
            "Clean now"
          )
        : null,
      el(
        "p",
        { style: { fontSize: "11px", color: "#666", marginTop: "8px" } },
        "Auto-clean also runs on every save. Learn more at noatmark.com"
      )
    );
  }

  registerPlugin("noatmark-hygiene", {
    render: function () {
      return el(
        PluginSidebar,
        { name: "noatmark-hygiene", title: "NoAtMark" },
        el(NoAtMarkPanel)
      );
    },
  });
})(window.wp);
