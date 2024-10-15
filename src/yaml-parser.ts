import * as vscode from 'vscode';

import { FIND_KEY_REGEX, Error } from "./constants";
import {
    isKey,
    isCommentLine,
    textIndentations,
    isUnnecessaryLine,
} from "./util";

function parseYaml({
    document,
    selection,
}: vscode.TextEditor): {} {
    const selectedLine = document.lineAt(selection.active);
    console.log(selectedLine)
    const range = new vscode.Range(
        0,
        0,
        selection.end.line,
        selectedLine.text.length
    );

    const lines = document.getText(range).split('\n');
    console.log(lines)
    // Remove the first line containing `---`
    lines.shift();

    const expectedLineSpace = textIndentations(selectedLine.text);
    console.log(expectedLineSpace)
    console.log(lines.filter(isUnnecessaryLine))
    return lines.filter(isUnnecessaryLine).reduce((result, line) => {
      const spaces = textIndentations(line);

      if (expectedLineSpace.length >= spaces.length) {
          result[spaces] = line.replace(FIND_KEY_REGEX, '$1').trim();
      }

      return result;
        }, {})
}

export { parseYaml };