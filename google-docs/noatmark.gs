/**
 * NoAtMark for Google Docs — strip invisible characters from your document.
 *
 * Install: Extensions → Apps Script → paste this whole file → Save → run
 * `onOpen` once (authorize it) → reload the doc. A "NoAtMark" menu appears.
 *
 * Uses editAsText() so bold / links / other formatting is preserved.
 */

var INVISIBLE_CP = [0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF, 0x00AD, 0x200E, 0x200F, 0x034F, 0x00A0];

function isInvisibleChar(ch) {
  var cp = ch.codePointAt(0);
  if (INVISIBLE_CP.indexOf(cp) !== -1) return true;
  if (cp >= 0xFE00 && cp <= 0xFE0F) return true;
  if (cp >= 0xE0100 && cp <= 0xE01EF) return true;
  if (cp >= 0x2000 && cp <= 0x200A) return true;
  return false;
}

function onOpen() {
  DocumentApp.getUi()
    .createMenu('NoAtMark')
    .addItem('Clean invisible characters', 'cleanInvisibleCharacters')
    .addToUi();
}

/** Remove invisible characters from one text element; returns count removed. */
function cleanTextElement(el) {
  var text = el.getText();
  var positions = [];
  for (var i = 0; i < text.length; i++) {
    if (isInvisibleChar(text[i])) positions.push(i);
  }
  if (!positions.length) return 0;
  var editor = el.editAsText();
  for (var j = positions.length - 1; j >= 0; j--) {
    editor.deleteText(positions[j], positions[j]);
  }
  return positions.length;
}

function cleanInvisibleCharacters() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var removed = 0;
  var total = body.getNumChildren();
  for (var i = 0; i < total; i++) {
    var child = body.getChild(i);
    var type = child.getType();
    if (type === DocumentApp.ElementType.PARAGRAPH || type === DocumentApp.ElementType.LIST_ITEM) {
      removed += cleanTextElement(child);
    } else if (type === DocumentApp.ElementType.TABLE) {
      var table = child;
      for (var r = 0; r < table.getNumRows(); r++) {
        var row = table.getRow(r);
        for (var c = 0; c < row.getNumCells(); c++) {
          var cell = row.getCell(c);
          for (var k = 0; k < cell.getNumChildren(); k++) {
            var cc = cell.getChild(k);
            if (cc.getType() === DocumentApp.ElementType.PARAGRAPH) {
              removed += cleanTextElement(cc);
            }
          }
        }
      }
    }
  }
  DocumentApp.getUi().alert('NoAtMark: removed ' + removed + ' invisible character(s).');
}
