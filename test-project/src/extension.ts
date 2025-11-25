// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { time } from 'console';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloextension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('helloextension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from HelloExtension!');
		
	});

	
	const greetCommand = vscode.commands.registerCommand(
		'helloextension.greet',
		(name: string) => {
			vscode.window.showInformationMessage(`Hello ${name}!`);
		}
	);
	
	
	const callGreetCommand = vscode.commands.registerCommand(
		'helloextension.callGreet',
		async () => {
			await vscode.commands.executeCommand('helloextension.greet', 'Kuma');
		}
	);

	const disposable2 = vscode.commands.registerCommand(
		'helloextension.greet2',
		greet2Handler
	);

	async function greet2Handler(){
		const name = await vscode.window.showInputBox({
			prompt: "Exnter name"
		});
		await vscode.commands.executeCommand('helloextension.greet', name);
	}

	const timeStamp = vscode.commands.registerTextEditorCommand(
		'helloextension.timeStamp',
		async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
			const timeStr = new Date().toISOString();
			edit.insert(textEditor.selection.active, timeStr);
		}
	);

	const saveAsCommand = vscode.commands.registerCommand(
		'helloextension.fileSaveAs',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if(!editor){
				vscode.window.showErrorMessage('アクティブなテキストエディタがありません');
				return;
			}
			const doc = editor.document;
			const targetUri = await vscode.window.showSaveDialog({
				defaultUri: doc.uri.scheme === 'file' ? doc.uri : undefined,
				saveLabel: '保存'
			});

			if(!targetUri){
				return;
			}
			try{
				const text = doc.getText();
				const encoder = new TextEncoder();
				const bytes = encoder.encode(text);

				await vscode.workspace.fs.writeFile(targetUri, bytes);

				const newDoc = await vscode.workspace.openTextDocument(targetUri);
				await vscode.window.showTextDocument(newDoc, editor.viewColumn);

				vscode.window.showInformationMessage('ファイルを別名で保存しました');
			}catch(err){
				vscode.window.showErrorMessage('保存に失敗しました:{err}');
			}


		}
	);
	const saveCommand = vscode.commands.registerCommand(
		'helloextension.fileSave',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if(!editor){
				vscode.window.showErrorMessage('アクティブなテキストエディタがありません')
				return;
			}

			const doc = editor.document;

			if(doc.isUntitled){
				vscode.window.showErrorMessage('このファイルは未保存のファイルです。保存先を指定してください');
				//saveASコマンド呼び出し
				vscode.commands.executeCommand('helloextension.fileSaveAs');
				return;
			}

			const selection = await vscode.window.showInformationMessage(
				'ファイルを保存しますか？',
				'保存',
				'キャンセル'
			);
			if(selection === '保存'){
				try{
					await vscode.workspace.save(doc.uri);
					vscode.window.showWarningMessage('この操作は元に戻せません');
				}catch(err){
					vscode.window.showErrorMessage('保存に失敗しました:{err}');
				}
			}
		}
	);

	

	context.subscriptions.push(
		disposable, 
		greetCommand, 
		callGreetCommand, 
		disposable2,
		timeStamp,
		saveAsCommand,
		saveCommand,
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
