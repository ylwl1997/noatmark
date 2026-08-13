// NoAtMark VS Code extension — clean / scan invisible characters.
const vscode = require("vscode");

// Build the invisible-character regex from code points (no literal invisible chars).
const BS = "\\";
function invisibleRegex() {
  const pts = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x00ad, 0x200e, 0x200f, 0x034f, 0x00a0];
  const ranges = [[0xfe00, 0xfe0f], [0xe0100, 0xe01ef], [0x2000, 0x200a]];
  let cls = "";
  for (const cp of pts) cls += BS + "u{" + cp.toString(16) + "}";
  for (const r of ranges) cls += BS + "u{" + r[0].toString(16) + "}-" + BS + "u{" + r[1].toString(16) + "}";
  return new RegExp("[" + cls + "]", "gu");
}

const RX = invisibleRegex();

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("noatmark.scanSelection", () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) return;
      const sel = ed.selection.isEmpty ? ed.document.getText() : ed.document.getText(ed.selection);
      const m = sel.match(RX);
      const n = m ? m.length : 0;
      vscode.window.showInformationMessage(
        n === 0 ? "NoAtMark: No invisible characters found" : "NoAtMark: " + n + " invisible character(s) found"
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("noatmark.cleanSelection", () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) return;
      const sel = ed.selection;
      if (sel.isEmpty) {
        vscode.window.showWarningMessage("NoAtMark: select text first");
        return;
      }
      const original = ed.document.getText(sel);
      const cleaned = original.replace(RX, "");
      const n = original.length - cleaned.length;
      if (n === 0) {
        vscode.window.showInformationMessage("NoAtMark: no invisible characters to clean");
        return;
      }
      ed.edit((builder) => builder.replace(sel, cleaned));
      vscode.window.showInformationMessage("NoAtMark: stripped " + n + " invisible character(s)");
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
