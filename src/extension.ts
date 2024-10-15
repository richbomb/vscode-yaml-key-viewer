// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { parseYaml } from './yaml-parser';

let localeFiles : vscode.Uri[];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "yamlKeyViewer" is now active!');
  vscode.workspace.findFiles('config/locales/**/*.yml').then(uris => {
    localeFiles = uris
  })
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('yamlKeyViewer.copyKeyPath', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage("Error: no editor!")
      return;
    }
    const parsed = parseYaml(editor);
    const res = Object.keys(parsed).reduce((result, key) => {
      result += !result ? parsed[key] : '.' + parsed[key];
      return result;
    })
    vscode.env.clipboard.writeText(res);
    vscode.window.showInformationMessage("Key copied to clipboard!")
	});

	const disposable2 = vscode.commands.registerCommand('yamlKeyViewer.goToKey', () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage("Error: no editor!")
      return;
    }
    const searchValue = regexStringFromSelection(editor)
    if (!searchValue) {
      vscode.window.showInformationMessage("Error: no selection!")
      return;
    }
    let numberOfFilesWithoutKey = 0
    const totalFiles = localeFiles.length
    localeFiles.forEach(uri => {
      vscode.workspace.openTextDocument(uri).then((document) => {
        const foundSelection = findLocaleSelection(document, searchValue)
        if (foundSelection) {
          displayDocumentAtSelection(document, foundSelection)
        } else {
          numberOfFilesWithoutKey++
          if (numberOfFilesWithoutKey == totalFiles) {
            vscode.window.showInformationMessage("Locale key not found")
          }
        }
      })
    })
	});

  function displayDocumentAtSelection(document:vscode.TextDocument, selection:vscode.Selection) {
    const cursorPosition = selection.end
    const cursorOnly = new vscode.Selection(cursorPosition, cursorPosition)
    const showOptions: vscode.TextDocumentShowOptions = { preserveFocus: false, preview: false, selection: cursorOnly }
    vscode.window.showTextDocument(document, showOptions)
  }

  function findLocaleSelection(document:vscode.TextDocument, searchValue:RegExp):vscode.Selection|undefined {
    let fullText = document.getText();
    let matches = [...fullText.matchAll(searchValue)];
    if (matches.length <= 0) {
      return undefined
    }
    const match = matches[0]
    let startPos = document.positionAt(match.index);
    let endPos = document.positionAt(match.index + match[0].length);
    return new vscode.Selection(startPos, endPos);
  }

  function getLocaleKeyFromSelection(editor:vscode.TextEditor):string|undefined {
    const rangeWord = editor.document.getWordRangeAtPosition(
      editor.selection.active,
      /[a-zA-Z]+/
    );
    const rangeSentence = editor.document.getWordRangeAtPosition(
      editor.selection.active,
      /([a-zA-Z]+.)*[a-zA-Z]+/
    );
    if (rangeSentence && rangeWord) {
      const selectionRange = new vscode.Range(rangeSentence.start, rangeWord.end)
      return editor.document.getText(selectionRange);
    } else {
      return undefined
    }
  }

  function regexStringFromSelection(editor : vscode.TextEditor) : RegExp | undefined {
    const localeKey = getLocaleKeyFromSelection(editor)
    if (!localeKey) {
      return undefined
    }
    const localeParts = localeKey.split(".")
    const indentSize = typeof editor.options.indentSize === 'number' ? editor.options.indentSize : 2
    let regexString = "^"
    localeParts.forEach((part, index) => {
      const numberOfSpaces = (index + 1) * indentSize
      if (index == localeParts.length - 1) {
        regexString += " ".repeat(numberOfSpaces) + part + ":"
      } else {
        regexString += " ".repeat(numberOfSpaces) + part + ':\n[\\S\\s]*?'
      }
    })
    return new RegExp(regexString, "gm")
  }

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
  context
}

// This method is called when your extension is deactivated
export function deactivate() {}
