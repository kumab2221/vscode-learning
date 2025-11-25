# VSCode 拡張機能 API 完全リファレンス

> VSCode Extension API の全カテゴリを網羅した実例付きガイド

## 目次

- [概要](#概要)
- [15個の主要 Namespace](#15個の主要-namespace)
  - [1. commands](#1-commands-namespace)
  - [2. window](#2-window-namespace)
  - [3. workspace](#3-workspace-namespace)
  - [4. languages](#4-languages-namespace)
  - [5. env](#5-env-namespace)
  - [6. debug](#6-debug-namespace)
  - [7. tasks](#7-tasks-namespace)
  - [8. extensions](#8-extensions-namespace)
  - [9. notebooks](#9-notebooks-namespace)
  - [10. scm](#10-scm-namespace)
  - [11. authentication](#11-authentication-namespace)
  - [12. l10n](#12-l10n-namespace)
  - [13. tests](#13-tests-namespace)
  - [14. chat](#14-chat-namespace)
  - [15. lm](#15-lm-namespace)
- [主要なクラス](#主要なクラス)
- [主要なインターフェイス](#主要なインターフェイス)
- [主要な Enum](#主要な-enum)
- [Provider パターン](#provider-パターン)
- [ベストプラクティス](#ベストプラクティス)

---

## 概要

VSCode Extension API は、Visual Studio Code の機能を拡張するための包括的なAPIセットです。

### 統計情報

- **総行数**: 21,123行
- **Namespace**: 15個
- **Interface**: 301個
- **Class**: 122個
- **Enum**: 63個
- **Provider**: 50種類以上

### 基本構造

```typescript
import * as vscode from 'vscode';

// 拡張機能のアクティベーション
export function activate(context: vscode.ExtensionContext) {
    console.log('拡張機能がアクティベートされました');

    // ここにコマンド、プロバイダ等を登録
    // すべての Disposable を context.subscriptions に追加
}

// 拡張機能の非アクティベーション
export function deactivate() {
    console.log('拡張機能が非アクティベートされました');
}
```

---

## 15個の主要 Namespace

### 1. commands Namespace

コマンドの登録と実行を管理します。

#### 主要な API

- `registerCommand(command: string, callback: (...args: any[]) => any): Disposable`
- `registerTextEditorCommand(command: string, callback: (editor, edit) => void): Disposable`
- `executeCommand<T>(command: string, ...rest: any[]): Thenable<T>`
- `getCommands(filterInternal?: boolean): Thenable<string[]>`

#### 実例

```typescript
// 基本的なコマンドの登録
const disposable = vscode.commands.registerCommand('myExtension.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from VSCode!');
});
context.subscriptions.push(disposable);

// パラメータ付きコマンド
vscode.commands.registerCommand('myExtension.greet', (name: string) => {
    vscode.window.showInformationMessage(`Hello, ${name}!`);
});

// テキストエディタコマンド
vscode.commands.registerTextEditorCommand('myExtension.insertTimestamp',
    (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
        const timestamp = new Date().toISOString();
        edit.insert(textEditor.selection.active, timestamp);
    }
);

// コマンドの実行
await vscode.commands.executeCommand('workbench.action.files.save');

// 利用可能なコマンド一覧の取得
const commands = await vscode.commands.getCommands(true);
console.log(`利用可能なコマンド数: ${commands.length}`);
```

#### ユースケース

- カスタム操作の追加
- キーボードショートカットへのバインド
- メニューアイテムのアクション
- 他のコマンドのプログラム的な実行

---

### 2. window Namespace

UI要素とエディタウィンドウの制御を提供します。

#### 主要なプロパティ

```typescript
window.activeTextEditor: TextEditor | undefined
window.visibleTextEditors: readonly TextEditor[]
window.activeTerminal: Terminal | undefined
window.terminals: readonly Terminal[]
window.tabGroups: TabGroups
window.state: WindowState
```

#### 主要な API

**メッセージ表示**

```typescript
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
```

**ダイアログ**

```typescript
// クイックピック
const items = ['オプション1', 'オプション2', 'オプション3'];
const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'オプションを選択してください'
});

// 複数選択のクイックピック
const multiSelected = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: '複数選択可能'
});

// カスタムクイックピック
interface MyQuickPickItem extends vscode.QuickPickItem {
    value: number;
}
const customItems: MyQuickPickItem[] = [
    { label: '$(star) 重要', description: '優先度: 高', value: 1 },
    { label: '$(info) 通常', description: '優先度: 中', value: 2 },
    { label: '$(question) その他', description: '優先度: 低', value: 3 }
];
const customSelected = await vscode.window.showQuickPick(customItems);

// 入力ボックス
const name = await vscode.window.showInputBox({
    prompt: '名前を入力してください',
    placeHolder: '例: John Doe',
    validateInput: (value) => {
        if (!value) {
            return '名前を入力してください';
        }
        if (value.length < 3) {
            return '名前は3文字以上である必要があります';
        }
        return null;
    }
});

// ファイルを開くダイアログ
const fileUris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: {
        'TypeScript': ['ts', 'tsx'],
        'JavaScript': ['js', 'jsx'],
        'All Files': ['*']
    }
});

// 保存ダイアログ
const saveUri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('/path/to/file.txt'),
    filters: { 'Text Files': ['txt'] }
});
```

**テキストドキュメントの表示**

```typescript
// ドキュメントを開いて表示
const doc = await vscode.workspace.openTextDocument('/path/to/file.ts');
await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.One,
    preview: false,
    preserveFocus: false
});

// 特定の位置にスクロール
const editor = vscode.window.activeTextEditor;
if (editor) {
    const position = new vscode.Position(10, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
    );
}
```

**UI要素の作成**

```typescript
// 出力チャンネル
const outputChannel = vscode.window.createOutputChannel('My Extension');
outputChannel.appendLine('拡張機能が起動しました');
outputChannel.show();

// ログ出力チャンネル
const logChannel = vscode.window.createOutputChannel('My Extension Logs', {
    log: true
});
logChannel.info('情報メッセージ');
logChannel.warn('警告メッセージ');
logChannel.error('エラーメッセージ');

// ステータスバーアイテム
const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
);
statusBarItem.text = '$(rocket) 準備完了';
statusBarItem.tooltip = 'クリックして実行';
statusBarItem.command = 'myExtension.run';
statusBarItem.show();
context.subscriptions.push(statusBarItem);

// ターミナル
const terminal = vscode.window.createTerminal({
    name: 'My Terminal',
    cwd: '/path/to/working/directory'
});
terminal.show();
terminal.sendText('echo "Hello from extension"');

// プログレスインジケーター
vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'ファイルを処理中...',
    cancellable: true
}, async (progress, token) => {
    token.onCancellationRequested(() => {
        console.log('ユーザーがキャンセルしました');
    });

    for (let i = 0; i < 100; i++) {
        if (token.isCancellationRequested) {
            break;
        }
        progress.report({
            increment: 1,
            message: `${i + 1}/100 完了`
        });
        await new Promise(resolve => setTimeout(resolve, 50));
    }
});

// Webview パネル
const panel = vscode.window.createWebviewPanel(
    'myWebview',
    'My Webview',
    vscode.ViewColumn.One,
    {
        enableScripts: true,
        retainContextWhenHidden: true
    }
);
panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>My Webview</title>
    </head>
    <body>
        <h1>Hello from Webview!</h1>
        <button onclick="acquireVsCodeApi().postMessage({command: 'hello'})">
            Click me
        </button>
    </body>
    </html>
`;
panel.webview.onDidReceiveMessage(message => {
    if (message.command === 'hello') {
        vscode.window.showInformationMessage('Webview からメッセージを受信しました');
    }
});
```

**ツリービュー**

```typescript
// ツリーデータプロバイダ
class MyTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<MyTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MyTreeItem): MyTreeItem[] {
        if (!element) {
            return [
                new MyTreeItem('Item 1', vscode.TreeItemCollapsibleState.Collapsed),
                new MyTreeItem('Item 2', vscode.TreeItemCollapsibleState.None)
            ];
        }
        return [];
    }
}

class MyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label} - ツールチップ`;
        this.iconPath = new vscode.ThemeIcon('file');
    }
}

// ツリービューの登録
const treeDataProvider = new MyTreeDataProvider();
const treeView = vscode.window.createTreeView('myTreeView', {
    treeDataProvider
});
```

---

### 3. workspace Namespace

ワークスペース、ファイルシステム、設定管理を提供します。

#### 主要なプロパティ

```typescript
workspace.workspaceFolders: readonly WorkspaceFolder[] | undefined
workspace.name: string | undefined
workspace.workspaceFile: Uri | undefined
workspace.textDocuments: readonly TextDocument[]
workspace.notebookDocuments: readonly NotebookDocument[]
workspace.fs: FileSystem
```

#### ファイル操作

```typescript
// テキストドキュメントを開く
const doc = await vscode.workspace.openTextDocument('/path/to/file.ts');

// URIから開く
const uri = vscode.Uri.file('/path/to/file.ts');
const doc2 = await vscode.workspace.openTextDocument(uri);

// 新しいドキュメントを作成
const newDoc = await vscode.workspace.openTextDocument({
    content: 'console.log("Hello");',
    language: 'javascript'
});

// ドキュメントを保存
await vscode.workspace.save(doc.uri);

// すべてのドキュメントを保存
await vscode.workspace.saveAll();

// ファイル検索
const files = await vscode.workspace.findFiles(
    '**/*.ts',  // include pattern
    '**/node_modules/**'  // exclude pattern
);
console.log(`見つかったファイル: ${files.length}`);

// ファイルシステムAPI
const fs = vscode.workspace.fs;

// ファイルを読み込む
const fileUri = vscode.Uri.file('/path/to/file.txt');
const fileData = await fs.readFile(fileUri);
const content = Buffer.from(fileData).toString('utf8');

// ファイルに書き込む
const newContent = Buffer.from('Hello, VSCode!', 'utf8');
await fs.writeFile(fileUri, newContent);

// ディレクトリを作成
const dirUri = vscode.Uri.file('/path/to/new/dir');
await fs.createDirectory(dirUri);

// ファイルを削除
await fs.delete(fileUri);

// ファイルをコピー
await fs.copy(
    vscode.Uri.file('/path/to/source.txt'),
    vscode.Uri.file('/path/to/dest.txt')
);

// ファイル情報を取得
const stat = await fs.stat(fileUri);
console.log(`ファイルサイズ: ${stat.size} bytes`);
console.log(`最終更新: ${new Date(stat.mtime)}`);
```

#### ファイル監視

```typescript
// ファイル監視の作成
const watcher = vscode.workspace.createFileSystemWatcher('**/*.ts');

watcher.onDidCreate(uri => {
    console.log(`ファイルが作成されました: ${uri.fsPath}`);
});

watcher.onDidChange(uri => {
    console.log(`ファイルが変更されました: ${uri.fsPath}`);
});

watcher.onDidDelete(uri => {
    console.log(`ファイルが削除されました: ${uri.fsPath}`);
});

context.subscriptions.push(watcher);
```

#### 設定管理

```typescript
// 設定の取得
const config = vscode.workspace.getConfiguration('myExtension');
const timeout = config.get<number>('timeout', 5000);
const enabled = config.get<boolean>('enabled', true);

// ネストされた設定
const editor = vscode.workspace.getConfiguration('editor');
const fontSize = editor.get<number>('fontSize');

// 設定の更新
await config.update('timeout', 10000, vscode.ConfigurationTarget.Global);

// ワークスペースレベルの設定
await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);

// ワークスペースフォルダレベルの設定
const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
if (workspaceFolder) {
    await config.update('enabled', true, {
        scope: workspaceFolder.uri
    });
}

// 設定の検査
const inspection = config.inspect<number>('timeout');
console.log('デフォルト値:', inspection?.defaultValue);
console.log('グローバル値:', inspection?.globalValue);
console.log('ワークスペース値:', inspection?.workspaceValue);
console.log('最終的な値:', config.get('timeout'));
```

#### イベント

```typescript
// ドキュメントが開かれた時
vscode.workspace.onDidOpenTextDocument(doc => {
    console.log(`ドキュメントが開かれました: ${doc.fileName}`);
});

// ドキュメントが変更された時
vscode.workspace.onDidChangeTextDocument(event => {
    console.log(`ドキュメントが変更されました: ${event.document.fileName}`);
    console.log(`変更数: ${event.contentChanges.length}`);
});

// ドキュメントが保存される前
vscode.workspace.onWillSaveTextDocument(event => {
    // 保存前に自動整形
    event.waitUntil(
        vscode.commands.executeCommand('editor.action.formatDocument')
    );
});

// ドキュメントが保存された時
vscode.workspace.onDidSaveTextDocument(doc => {
    console.log(`ドキュメントが保存されました: ${doc.fileName}`);
});

// ドキュメントが閉じられた時
vscode.workspace.onDidCloseTextDocument(doc => {
    console.log(`ドキュメントが閉じられました: ${doc.fileName}`);
});

// 設定が変更された時
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('myExtension')) {
        console.log('拡張機能の設定が変更されました');
        // 設定を再読み込み
        const config = vscode.workspace.getConfiguration('myExtension');
    }
});

// ワークスペースフォルダが変更された時
vscode.workspace.onDidChangeWorkspaceFolders(event => {
    console.log(`追加されたフォルダ: ${event.added.length}`);
    console.log(`削除されたフォルダ: ${event.removed.length}`);
});
```

#### WorkspaceEdit

```typescript
// 複数ファイルへの編集
const edit = new vscode.WorkspaceEdit();

// テキストの置換
const uri1 = vscode.Uri.file('/path/to/file1.ts');
edit.replace(
    uri1,
    new vscode.Range(0, 0, 0, 10),
    'newText'
);

// テキストの挿入
const uri2 = vscode.Uri.file('/path/to/file2.ts');
edit.insert(uri2, new vscode.Position(5, 0), 'inserted text\n');

// テキストの削除
edit.delete(uri1, new vscode.Range(10, 0, 11, 0));

// ファイルの作成
const newFileUri = vscode.Uri.file('/path/to/newfile.ts');
edit.createFile(newFileUri, { overwrite: false });

// ファイルの削除
edit.deleteFile(vscode.Uri.file('/path/to/oldfile.ts'));

// ファイルのリネーム
edit.renameFile(
    vscode.Uri.file('/path/to/old.ts'),
    vscode.Uri.file('/path/to/new.ts')
);

// 編集を適用
await vscode.workspace.applyEdit(edit);
```

---

### 4. languages Namespace

言語機能（IntelliSense、診断など）を提供します。

#### 診断（Diagnostics）

```typescript
// 診断コレクションの作成
const diagnosticCollection = vscode.languages.createDiagnosticCollection('myExtension');
context.subscriptions.push(diagnosticCollection);

// 診断の追加
function updateDiagnostics(document: vscode.TextDocument) {
    const diagnostics: vscode.Diagnostic[] = [];

    // ドキュメントをスキャンしてエラーを検出
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.text.includes('TODO')) {
            const range = new vscode.Range(i, 0, i, line.text.length);
            const diagnostic = new vscode.Diagnostic(
                range,
                'TODO が残っています',
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.code = 'TODO-001';
            diagnostic.source = 'myExtension';
            diagnostics.push(diagnostic);
        }

        if (line.text.includes('FIXME')) {
            const range = new vscode.Range(i, 0, i, line.text.length);
            const diagnostic = new vscode.Diagnostic(
                range,
                'FIXME が残っています',
                vscode.DiagnosticSeverity.Error
            );

            // 関連情報の追加
            diagnostic.relatedInformation = [
                new vscode.DiagnosticRelatedInformation(
                    new vscode.Location(document.uri, range),
                    'ここを修正してください'
                )
            ];

            diagnostics.push(diagnostic);
        }
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

// ドキュメント変更時に診断を更新
vscode.workspace.onDidChangeTextDocument(event => {
    updateDiagnostics(event.document);
});

// アクティブエディタ変更時
vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
        updateDiagnostics(editor.document);
    }
});
```

#### Language Status

```typescript
// 言語ステータスアイテムの作成
const languageStatusItem = vscode.languages.createLanguageStatusItem(
    'myExtension.status',
    { language: 'typescript' }
);

languageStatusItem.text = '$(check) TypeScript OK';
languageStatusItem.detail = 'すべてのチェックが完了しました';
languageStatusItem.severity = vscode.LanguageStatusSeverity.Information;
languageStatusItem.command = {
    title: '詳細を表示',
    command: 'myExtension.showDetails'
};

context.subscriptions.push(languageStatusItem);
```

#### ドキュメントセレクタ

```typescript
// 単一言語
const selector1: vscode.DocumentSelector = 'typescript';

// 複数言語
const selector2: vscode.DocumentSelector = ['typescript', 'javascript'];

// 詳細なフィルタ
const selector3: vscode.DocumentSelector = {
    language: 'typescript',
    scheme: 'file',
    pattern: '**/*.ts'
};

// 複数の条件
const selector4: vscode.DocumentSelector = [
    { language: 'typescript', scheme: 'file' },
    { language: 'javascript', scheme: 'file' }
];
```

---

### 5. env Namespace

環境情報とシステム統合を提供します。

#### 主要なプロパティ

```typescript
// アプリケーション情報
console.log('App Name:', vscode.env.appName);  // 'Visual Studio Code'
console.log('App Root:', vscode.env.appRoot);
console.log('App Host:', vscode.env.appHost);  // 'desktop', 'web'

// 言語とロケール
console.log('UI Language:', vscode.env.language);  // 'ja', 'en', etc.

// ユニーク ID
console.log('Machine ID:', vscode.env.machineId);
console.log('Session ID:', vscode.env.sessionId);

// リモート情報
console.log('Remote Name:', vscode.env.remoteName);  // 'ssh-remote', 'wsl', etc.

// UI種別
console.log('UI Kind:', vscode.env.uiKind);  // UIKind.Desktop or UIKind.Web

// シェル
console.log('Shell:', vscode.env.shell);

// テレメトリ
console.log('Telemetry Enabled:', vscode.env.isTelemetryEnabled);

// 新規インストール
console.log('New Install:', vscode.env.isNewAppInstall);

// ログレベル
console.log('Log Level:', vscode.env.logLevel);

// URIスキーム
console.log('URI Scheme:', vscode.env.uriScheme);
```

#### クリップボード操作

```typescript
// クリップボードに書き込み
await vscode.env.clipboard.writeText('Hello, Clipboard!');

// クリップボードから読み込み
const text = await vscode.env.clipboard.readText();
console.log('Clipboard content:', text);
```

#### 外部リンクを開く

```typescript
// URLを開く
const url = vscode.Uri.parse('https://code.visualstudio.com');
await vscode.env.openExternal(url);

// ファイルをシステムのデフォルトアプリで開く
const fileUri = vscode.Uri.file('/path/to/document.pdf');
await vscode.env.openExternal(fileUri);
```

#### 外部URIに変換

```typescript
// ローカルサーバーのURLを外部アクセス可能なURLに変換
const localUri = vscode.Uri.parse('http://localhost:3000');
const externalUri = await vscode.env.asExternalUri(localUri);
console.log('External URI:', externalUri.toString());
// リモート環境では転送されたURLが返される
```

#### テレメトリロガー

```typescript
// テレメトリロガーの作成
const telemetryLogger = vscode.env.createTelemetryLogger({
    sendEventData(eventName, data) {
        console.log(`Telemetry Event: ${eventName}`, data);
        // ここで実際のテレメトリサービスに送信
    },
    sendErrorData(error, data) {
        console.error('Telemetry Error:', error, data);
    }
});

// イベントの記録
telemetryLogger.logUsage('extension.activated', {
    version: '1.0.0',
    timestamp: Date.now()
});

// エラーの記録
try {
    throw new Error('Something went wrong');
} catch (error) {
    telemetryLogger.logError(error as Error);
}

context.subscriptions.push(telemetryLogger);
```

---

### 6. debug Namespace

デバッグ機能を提供します。

#### 主要なプロパティ

```typescript
// アクティブなデバッグセッション
const activeSession = vscode.debug.activeDebugSession;
if (activeSession) {
    console.log('Session:', activeSession.name);
    console.log('Type:', activeSession.type);
}

// デバッグコンソール
vscode.debug.activeDebugConsole.appendLine('デバッグメッセージ');

// ブレークポイント
const breakpoints = vscode.debug.breakpoints;
console.log(`ブレークポイント数: ${breakpoints.length}`);

// アクティブなスタックアイテム
const stackItem = vscode.debug.activeStackItem;
```

#### デバッグセッションの開始

```typescript
// デバッグ設定
const debugConfig: vscode.DebugConfiguration = {
    type: 'node',
    request: 'launch',
    name: 'Launch Program',
    program: '${workspaceFolder}/index.js',
    skipFiles: ['<node_internals>/**']
};

// デバッグ開始
const success = await vscode.debug.startDebugging(
    vscode.workspace.workspaceFolders?.[0],
    debugConfig
);

if (success) {
    console.log('デバッグセッションが開始されました');
}

// 停止
if (vscode.debug.activeDebugSession) {
    await vscode.debug.stopDebugging(vscode.debug.activeDebugSession);
}
```

#### ブレークポイントの管理

```typescript
// ソースブレークポイントの追加
const uri = vscode.Uri.file('/path/to/file.js');
const breakpoint = new vscode.SourceBreakpoint(
    new vscode.Location(uri, new vscode.Position(10, 0)),
    true,  // enabled
    'x > 100'  // condition
);

vscode.debug.addBreakpoints([breakpoint]);

// 関数ブレークポイントの追加
const functionBp = new vscode.FunctionBreakpoint('myFunction', true);
vscode.debug.addBreakpoints([functionBp]);

// ブレークポイントの削除
vscode.debug.removeBreakpoints([breakpoint]);
```

#### デバッグイベント

```typescript
// セッション開始
vscode.debug.onDidStartDebugSession(session => {
    console.log(`デバッグセッション開始: ${session.name}`);
});

// セッション終了
vscode.debug.onDidTerminateDebugSession(session => {
    console.log(`デバッグセッション終了: ${session.name}`);
});

// アクティブセッション変更
vscode.debug.onDidChangeActiveDebugSession(session => {
    if (session) {
        console.log(`アクティブセッション変更: ${session.name}`);
    }
});

// カスタムイベント受信
vscode.debug.onDidReceiveDebugSessionCustomEvent(event => {
    console.log(`カスタムイベント: ${event.event}`, event.body);
});

// ブレークポイント変更
vscode.debug.onDidChangeBreakpoints(event => {
    console.log(`追加: ${event.added.length}`);
    console.log(`削除: ${event.removed.length}`);
    console.log(`変更: ${event.changed.length}`);
});
```

#### デバッグ設定プロバイダ

```typescript
class MyDebugConfigProvider implements vscode.DebugConfigurationProvider {
    resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        token?: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DebugConfiguration> {
        // デフォルト設定の提供
        if (!config.type && !config.request && !config.name) {
            config.type = 'node';
            config.request = 'launch';
            config.name = 'Launch';
            config.program = '${workspaceFolder}/index.js';
        }

        // 設定の修正
        if (!config.program) {
            return vscode.window.showInformationMessage(
                'program が設定されていません'
            ).then(_ => undefined);
        }

        return config;
    }
}

// プロバイダの登録
context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider('node', new MyDebugConfigProvider())
);
```

---

### 7. tasks Namespace

タスクの実行と管理を提供します。

#### タスクの実行

```typescript
// シェルタスクの作成
const shellTask = new vscode.Task(
    { type: 'shell' },
    vscode.TaskScope.Workspace,
    'Build',
    'MyExtension',
    new vscode.ShellExecution('npm run build')
);

// プロセスタスクの作成
const processTask = new vscode.Task(
    { type: 'process' },
    vscode.TaskScope.Workspace,
    'Test',
    'MyExtension',
    new vscode.ProcessExecution('node', ['test.js'])
);

// タスクの実行
await vscode.tasks.executeTask(shellTask);
```

#### タスク設定

```typescript
const task = new vscode.Task(
    { type: 'npm', script: 'build' },
    vscode.TaskScope.Workspace,
    'Build Project',
    'npm',
    new vscode.ShellExecution('npm run build')
);

// プレゼンテーション設定
task.presentationOptions = {
    reveal: vscode.TaskRevealKind.Always,
    echo: true,
    focus: false,
    panel: vscode.TaskPanelKind.Shared,
    showReuseMessage: true,
    clear: false
};

// グループ設定
task.group = vscode.TaskGroup.Build;

// 問題マッチャー
task.problemMatchers = ['$tsc'];

// 実行
await vscode.tasks.executeTask(task);
```

#### タスクプロバイダ

```typescript
interface MyTaskDefinition extends vscode.TaskDefinition {
    script: string;
    args?: string[];
}

class MyTaskProvider implements vscode.TaskProvider {
    async provideTasks(): Promise<vscode.Task[]> {
        const tasks: vscode.Task[] = [];

        // タスクの動的生成
        const scripts = ['build', 'test', 'lint'];
        for (const script of scripts) {
            const definition: MyTaskDefinition = {
                type: 'myExtension',
                script
            };

            const task = new vscode.Task(
                definition,
                vscode.TaskScope.Workspace,
                script,
                'myExtension',
                new vscode.ShellExecution(`npm run ${script}`)
            );

            tasks.push(task);
        }

        return tasks;
    }

    resolveTask(task: vscode.Task): vscode.Task | undefined {
        const definition = task.definition as MyTaskDefinition;
        if (definition.script) {
            return new vscode.Task(
                definition,
                task.scope ?? vscode.TaskScope.Workspace,
                definition.script,
                'myExtension',
                new vscode.ShellExecution(`npm run ${definition.script}`)
            );
        }
        return undefined;
    }
}

// プロバイダの登録
context.subscriptions.push(
    vscode.tasks.registerTaskProvider('myExtension', new MyTaskProvider())
);
```

#### タスクイベント

```typescript
// タスク開始
vscode.tasks.onDidStartTask(event => {
    console.log(`タスク開始: ${event.execution.task.name}`);
});

// タスク終了
vscode.tasks.onDidEndTask(event => {
    console.log(`タスク終了: ${event.execution.task.name}`);
});

// プロセス開始
vscode.tasks.onDidStartTaskProcess(event => {
    console.log(`プロセス開始: PID ${event.processId}`);
});

// プロセス終了
vscode.tasks.onDidEndTaskProcess(event => {
    console.log(`プロセス終了: 終了コード ${event.exitCode}`);
});
```

#### タスクの取得

```typescript
// すべてのタスクを取得
const allTasks = await vscode.tasks.fetchTasks();
console.log(`利用可能なタスク: ${allTasks.length}`);

// フィルタしてタスクを取得
const buildTasks = await vscode.tasks.fetchTasks({ type: 'npm' });
for (const task of buildTasks) {
    console.log(`タスク: ${task.name} (${task.source})`);
}
```

---

### 8. extensions Namespace

拡張機能の管理と相互作用を提供します。

#### インストール済み拡張機能の取得

```typescript
// すべての拡張機能
const allExtensions = vscode.extensions.all;
console.log(`インストール済み拡張機能: ${allExtensions.length}`);

// 拡張機能の詳細
for (const ext of allExtensions) {
    console.log(`ID: ${ext.id}`);
    console.log(`名前: ${ext.packageJSON.displayName}`);
    console.log(`バージョン: ${ext.packageJSON.version}`);
    console.log(`パス: ${ext.extensionPath}`);
    console.log(`アクティブ: ${ext.isActive}`);
}
```

#### 特定の拡張機能の取得

```typescript
// 拡張機能IDで取得
const ext = vscode.extensions.getExtension('ms-vscode.vscode-typescript-next');

if (ext) {
    console.log(`見つかりました: ${ext.id}`);

    // まだアクティブでない場合はアクティベート
    if (!ext.isActive) {
        await ext.activate();
    }

    // エクスポートされたAPIを使用
    const api = ext.exports;
    if (api) {
        // 他の拡張機能が公開しているAPIを使用
        console.log('API:', api);
    }
}
```

#### 拡張機能間の連携

```typescript
// 自分の拡張機能からAPIを公開
export function activate(context: vscode.ExtensionContext) {
    // APIオブジェクトを返す
    return {
        doSomething(text: string): string {
            return `Processed: ${text}`;
        },
        version: '1.0.0'
    };
}

// 他の拡張機能から使用
const myExt = vscode.extensions.getExtension('publisher.my-extension');
if (myExt) {
    const api = await myExt.activate();
    const result = api.doSomething('Hello');
    console.log(result);  // "Processed: Hello"
}
```

#### 拡張機能の変更イベント

```typescript
vscode.extensions.onDidChange(() => {
    console.log('拡張機能の一覧が変更されました');
    // 新しくインストールされた、またはアンインストールされた
});
```

#### 拡張機能の種類とモード

```typescript
const ext = vscode.extensions.getExtension('publisher.extension-id');
if (ext) {
    // 拡張機能の種類
    console.log('Kind:', ext.extensionKind);
    // ExtensionKind.UI - UIサイドで実行
    // ExtensionKind.Workspace - ワークスペースサイドで実行

    // 拡張機能のモード
    console.log('Mode:', ext.extensionMode);
    // ExtensionMode.Production - 本番モード
    // ExtensionMode.Development - 開発モード
    // ExtensionMode.Test - テストモード
}
```

---

### 9. notebooks Namespace

Notebook機能を提供します。

#### Notebook コントローラの作成

```typescript
// ノートブックコントローラの作成
const controller = vscode.notebooks.createNotebookController(
    'my-notebook-controller',
    'jupyter-notebook',
    'My Notebook Kernel'
);

controller.supportedLanguages = ['python', 'javascript'];
controller.supportsExecutionOrder = true;
controller.description = 'カスタムノートブックカーネル';

// セル実行ハンドラ
controller.executeHandler = async (cells, notebook, controller) => {
    for (const cell of cells) {
        const execution = controller.createNotebookCellExecution(cell);
        execution.start(Date.now());

        try {
            // セルのコードを実行
            const code = cell.document.getText();
            console.log(`実行中: ${code}`);

            // 実行順序を設定
            execution.executionOrder = Date.now();

            // 出力を追加
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text('実行結果: OK')
                ])
            ]);

            execution.end(true, Date.now());
        } catch (error) {
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(error as Error)
                ])
            ]);
            execution.end(false, Date.now());
        }
    }
};

context.subscriptions.push(controller);
```

#### Notebook セルステータスバー

```typescript
class NotebookCellStatusProvider implements vscode.NotebookCellStatusBarItemProvider {
    provideCellStatusBarItems(
        cell: vscode.NotebookCell,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.NotebookCellStatusBarItem[]> {
        const item = new vscode.NotebookCellStatusBarItem(
            `$(clock) ${cell.document.getText().length} chars`,
            vscode.NotebookCellStatusBarAlignment.Right
        );
        item.tooltip = 'セルの文字数';

        return [item];
    }
}

vscode.notebooks.registerNotebookCellStatusBarItemProvider(
    'jupyter-notebook',
    new NotebookCellStatusProvider()
);
```

#### Renderer メッセージング

```typescript
const messaging = vscode.notebooks.createRendererMessaging('my-renderer');

// メッセージ受信
messaging.onDidReceiveMessage(event => {
    console.log('Renderer からのメッセージ:', event.message);

    // Renderer にメッセージ送信
    messaging.postMessage({
        type: 'response',
        data: 'Received!'
    }, event.editor);
});
```

---

### 10. scm Namespace

ソース管理機能を提供します。

#### ソース管理の作成

```typescript
// ソース管理インスタンスの作成
const scm = vscode.scm.createSourceControl(
    'myScm',
    'My SCM',
    vscode.Uri.file('/path/to/repo')
);

// 入力ボックスの設定
scm.inputBox.placeholder = 'コミットメッセージを入力...';
scm.inputBox.value = '';

// アクセプトハンドラ（Enterキーを押した時）
scm.acceptInputCommand = {
    command: 'myScm.commit',
    title: 'Commit',
    arguments: [scm]
};

// ステータスバーコマンド
scm.statusBarCommands = [
    {
        command: 'myScm.sync',
        title: '$(sync) Sync',
        tooltip: '同期'
    }
];

context.subscriptions.push(scm);
```

#### リソースグループの管理

```typescript
// リソースグループの作成
const changesGroup = scm.createResourceGroup('changes', '変更');
const stagedGroup = scm.createResourceGroup('staged', 'ステージ済み');

// リソース状態の作成
interface MyResourceState extends vscode.SourceControlResourceState {
    readonly resourceUri: vscode.Uri;
}

const changes: MyResourceState[] = [
    {
        resourceUri: vscode.Uri.file('/path/to/file1.ts'),
        decorations: {
            strikeThrough: false,
            faded: false,
            tooltip: '変更されたファイル',
            iconPath: new vscode.ThemeIcon('diff-modified')
        },
        command: {
            command: 'myScm.openChange',
            title: 'Open Change',
            arguments: [vscode.Uri.file('/path/to/file1.ts')]
        }
    }
];

changesGroup.resourceStates = changes;

// リソースグループのコマンド
changesGroup.resourceGroupCommands = [
    {
        command: 'myScm.stageAll',
        title: 'すべてステージ',
        tooltip: 'すべての変更をステージに追加'
    }
];
```

#### Quick Diff プロバイダ

```typescript
class MyQuickDiffProvider implements vscode.QuickDiffProvider {
    provideOriginalResource(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Uri> {
        // オリジナルのコンテンツを提供するURIを返す
        return uri.with({ scheme: 'myScm-original' });
    }
}

scm.quickDiffProvider = new MyQuickDiffProvider();
```

---

### 11. authentication Namespace

認証機能を提供します。

#### 認証セッションの取得

```typescript
// GitHub認証セッションの取得
async function getGitHubSession() {
    const session = await vscode.authentication.getSession('github', ['user:email'], {
        createIfNone: true
    });

    if (session) {
        console.log('Account:', session.account.label);
        console.log('Access Token:', session.accessToken);
        console.log('Scopes:', session.scopes);

        return session;
    }
}

// Microsoft認証
async function getMicrosoftSession() {
    const session = await vscode.authentication.getSession('microsoft', ['User.Read'], {
        createIfNone: true,
        clearSessionPreference: false
    });

    return session;
}
```

#### アカウント情報の取得

```typescript
// プロバイダのアカウント一覧
const accounts = await vscode.authentication.getAccounts('github');
console.log('GitHub アカウント:', accounts);
```

#### 認証イベント

```typescript
// セッション変更イベント
vscode.authentication.onDidChangeSessions(event => {
    console.log('Provider:', event.provider.id);

    // セッションが追加/削除/変更された時の処理
    if (event.provider.id === 'github') {
        // GitHub認証が変更された
        refreshGitHubData();
    }
});
```

#### カスタム認証プロバイダ

```typescript
class MyAuthProvider implements vscode.AuthenticationProvider {
    private _sessionChangeEmitter = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
    readonly onDidChangeSessions = this._sessionChangeEmitter.event;

    async getSessions(scopes?: readonly string[]): Promise<vscode.AuthenticationSession[]> {
        // 保存されているセッションを返す
        return [];
    }

    async createSession(scopes: readonly string[]): Promise<vscode.AuthenticationSession> {
        // 新しいセッションを作成
        // 通常はOAuthフローを実行

        const session: vscode.AuthenticationSession = {
            id: 'unique-session-id',
            accessToken: 'access-token',
            account: {
                id: 'user-id',
                label: 'User Name'
            },
            scopes
        };

        this._sessionChangeEmitter.fire({
            added: [session],
            removed: [],
            changed: []
        });

        return session;
    }

    async removeSession(sessionId: string): Promise<void> {
        // セッションを削除
        this._sessionChangeEmitter.fire({
            added: [],
            removed: [{ id: sessionId } as any],
            changed: []
        });
    }
}

// プロバイダの登録
context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
        'myAuth',
        'My Auth Provider',
        new MyAuthProvider()
    )
);
```

---

### 12. l10n Namespace

多言語化（国際化）を提供します。

#### 基本的な翻訳

```typescript
// 単純な文字列の翻訳
const message = vscode.l10n.t('Hello, World!');

// プレースホルダー付き
const greeting = vscode.l10n.t('Hello, {0}!', 'John');

// 複数のプレースホルダー
const info = vscode.l10n.t('File {0} has {1} lines', 'index.ts', 100);

// オブジェクト形式のプレースホルダー
const msg = vscode.l10n.t('Hello, {name}!', { name: 'John' });
```

#### 複数形の処理

```typescript
// 複数形の処理
function getFileCountMessage(count: number): string {
    return vscode.l10n.t(
        {
            message: '{0} file',
            args: [count],
            comment: ['ファイル数のメッセージ']
        }
    );
}
```

#### バンドル情報

```typescript
// 現在のロケールバンドルURI
const bundleUri = vscode.l10n.uri;
console.log('Bundle URI:', bundleUri?.toString());

// バンドルオブジェクト
const bundle = vscode.l10n.bundle;
console.log('Bundle:', bundle);
```

#### package.nls.json の使用

```json
// package.nls.json (英語)
{
    "extension.name": "My Extension",
    "command.hello": "Hello World",
    "message.greeting": "Hello, {0}!"
}

// package.nls.ja.json (日本語)
{
    "extension.name": "私の拡張機能",
    "command.hello": "ハローワールド",
    "message.greeting": "こんにちは、{0}さん!"
}
```

```typescript
// コード内で使用
const commandTitle = vscode.l10n.t('command.hello');
const greeting = vscode.l10n.t('message.greeting', 'John');
```

---

### 13. tests Namespace

テスト機能を提供します。

#### テストコントローラの作成

```typescript
const testController = vscode.tests.createTestController(
    'myTestController',
    'My Tests'
);

context.subscriptions.push(testController);
```

#### テストアイテムの追加

```typescript
// ルートテストアイテム
const rootItem = testController.createTestItem(
    'root',
    'All Tests',
    vscode.Uri.file('/path/to/tests')
);
testController.items.add(rootItem);

// 子テストアイテム
const suiteItem = testController.createTestItem(
    'suite1',
    'Test Suite 1',
    vscode.Uri.file('/path/to/tests/suite1.test.ts')
);
rootItem.children.add(suiteItem);

const testItem = testController.createTestItem(
    'test1',
    'should work correctly',
    vscode.Uri.file('/path/to/tests/suite1.test.ts')
);
testItem.range = new vscode.Range(10, 0, 15, 0);
suiteItem.children.add(testItem);
```

#### テスト実行ハンドラ

```typescript
// 実行プロファイルの作成
const runProfile = testController.createRunProfile(
    'Run',
    vscode.TestRunProfileKind.Run,
    async (request, token) => {
        const run = testController.createTestRun(request);

        for (const test of request.include ?? []) {
            await runTest(test, run, token);
        }

        run.end();
    },
    true  // isDefault
);

async function runTest(
    test: vscode.TestItem,
    run: vscode.TestRun,
    token: vscode.CancellationToken
) {
    run.started(test);

    try {
        // テストを実行
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 成功
        run.passed(test, Date.now() - run.startedAt);
    } catch (error) {
        // 失敗
        const message = new vscode.TestMessage(error.message);
        message.location = new vscode.Location(
            test.uri!,
            test.range!
        );
        run.failed(test, message);
    }
}

// デバッグプロファイル
const debugProfile = testController.createRunProfile(
    'Debug',
    vscode.TestRunProfileKind.Debug,
    async (request, token) => {
        // デバッグセッションを開始
        await vscode.debug.startDebugging(undefined, {
            type: 'node',
            request: 'launch',
            name: 'Debug Tests',
            program: '${workspaceFolder}/test.js'
        });
    }
);
```

#### テストカバレッジ

```typescript
const run = testController.createTestRun(request);

// ファイルカバレッジ
const fileCoverage = vscode.FileCoverage.fromDetails(
    vscode.Uri.file('/path/to/file.ts'),
    [
        new vscode.StatementCoverage(10, new vscode.Range(5, 0, 5, 20)),
        new vscode.StatementCoverage(5, new vscode.Range(10, 0, 10, 15)),
        new vscode.BranchCoverage(3, new vscode.Range(15, 0, 15, 10), [
            { count: 2 },
            { count: 1 }
        ])
    ]
);

run.addCoverage(fileCoverage);
```

#### テストタグ

```typescript
// タグの作成
const unitTag = new vscode.TestTag('unit');
const integrationTag = new vscode.TestTag('integration');

// テストにタグを追加
testItem.tags = [unitTag];
```

---

### 14. chat Namespace

AI Chat機能（Copilot Chat等）を提供します。

#### チャット参加者の作成

```typescript
const participant = vscode.chat.createChatParticipant(
    'myExtension.assistant',
    async (request, context, stream, token) => {
        // リクエストの処理
        stream.progress('考え中...');

        // ユーザーのプロンプト
        const userPrompt = request.prompt;
        console.log('User prompt:', userPrompt);

        // コンテキスト情報
        const history = context.history;
        console.log('History length:', history.length);

        // レスポンスの送信
        stream.markdown('こんにちは！何をお手伝いしましょうか？\n\n');

        // コードブロック
        stream.markdown('```typescript\n');
        stream.markdown('function hello() {\n');
        stream.markdown('  console.log("Hello!");\n');
        stream.markdown('}\n');
        stream.markdown('```\n');

        // 参照の追加
        if (vscode.window.activeTextEditor) {
            stream.reference(vscode.window.activeTextEditor.document.uri);
        }

        // コマンドボタン
        stream.button({
            command: 'myExtension.runCode',
            title: 'コードを実行'
        });

        return {};
    }
);

participant.iconPath = vscode.Uri.file('/path/to/icon.png');
participant.description = 'AI アシスタント';

context.subscriptions.push(participant);
```

#### チャット変数の使用

```typescript
// チャット参加者でリクエストの変数を使用
const participant = vscode.chat.createChatParticipant(
    'myExtension.codeHelper',
    async (request, context, stream, token) => {
        // 変数の参照
        for (const ref of request.references) {
            if (ref.value instanceof vscode.Uri) {
                const doc = await vscode.workspace.openTextDocument(ref.value);
                stream.markdown(`ファイル ${ref.value.fsPath} を分析します...\n`);

                // ファイル内容を分析
                const lines = doc.lineCount;
                stream.markdown(`- 行数: ${lines}\n`);
            }
        }

        return {};
    }
);
```

#### フォローアップの提供

```typescript
const participant = vscode.chat.createChatParticipant(
    'myExtension.helper',
    async (request, context, stream, token) => {
        stream.markdown('処理が完了しました！\n');

        return {
            followUp: [
                {
                    prompt: '詳細を表示',
                    label: '詳細を見る',
                    command: 'showDetails'
                },
                {
                    prompt: '別の方法を試す',
                    label: '代替案',
                    command: 'tryAlternative'
                }
            ]
        };
    }
);
```

---

### 15. lm Namespace

言語モデル統合を提供します。

#### チャットモデルの選択と使用

```typescript
// 利用可能なチャットモデルを選択
const models = await vscode.lm.selectChatModels({
    vendor: 'openai',
    family: 'gpt-4'
});

if (models.length > 0) {
    const model = models[0];
    console.log('Model:', model.name);
    console.log('Vendor:', model.vendor);
    console.log('Family:', model.family);
    console.log('Max Input Tokens:', model.maxInputTokens);

    // チャットメッセージの送信
    const messages = [
        vscode.LanguageModelChatMessage.User('TypeScriptで配列を逆順にする方法は?')
    ];

    const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

    // レスポンスの読み取り
    for await (const part of response.text) {
        console.log(part);
    }
}
```

#### ツールの登録と使用

```typescript
// カスタムツールの定義
interface MyToolInput {
    query: string;
}

interface MyToolResult {
    results: string[];
}

const myTool = vscode.lm.registerTool<MyToolInput, MyToolResult>(
    'myExtension.searchTool',
    {
        displayName: 'Search Tool',
        description: 'ファイルを検索するツール',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: '検索クエリ'
                }
            },
            required: ['query']
        }
    },
    async (input, token) => {
        // ツールの実装
        const files = await vscode.workspace.findFiles(`**/*${input.query}*`);

        return {
            results: files.map(f => f.fsPath)
        };
    }
);

context.subscriptions.push(myTool);
```

#### ツールの呼び出し

```typescript
// ツールを呼び出す
const result = await vscode.lm.invokeTool(
    'myExtension.searchTool',
    { query: 'test' },
    new vscode.CancellationTokenSource().token
);

console.log('Tool result:', result);
```

#### 言語モデルチャットプロバイダ

```typescript
class MyLanguageModelProvider implements vscode.LanguageModelChatProvider {
    async provideChatResponse(
        messages: vscode.LanguageModelChatMessage[],
        options: vscode.LanguageModelChatRequestOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelChatResponse> {
        // カスタムLLMの実装

        const responseText = 'カスタムモデルからのレスポンス';

        return {
            text: (async function* () {
                yield responseText;
            })()
        };
    }

    async prepareLanguageModelChat(
        messages: vscode.LanguageModelChatMessage[],
        options: vscode.LanguageModelChatRequestOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.PreparedLanguageModelChat> {
        return {
            messages,
            options
        };
    }
}

vscode.lm.registerLanguageModelChatProvider(
    'myExtension',
    'my-model',
    new MyLanguageModelProvider(),
    {
        name: 'My Custom Model',
        vendor: 'MyCompany',
        family: 'custom',
        version: '1.0',
        maxInputTokens: 4096,
        maxOutputTokens: 2048
    }
);
```

#### MCP サーバー定義プロバイダ

```typescript
class MyMcpServerProvider implements vscode.McpServerDefinitionProvider {
    provideMcpServerDefinition(): vscode.ProviderResult<vscode.McpStdioServerDefinition | vscode.McpHttpServerDefinition> {
        // Stdio サーバー
        return {
            type: 'stdio',
            command: 'node',
            args: ['/path/to/mcp-server.js'],
            env: {
                'API_KEY': 'secret-key'
            }
        };

        // または HTTP サーバー
        // return {
        //     type: 'http',
        //     url: 'http://localhost:3000/mcp'
        // };
    }
}

vscode.lm.registerMcpServerDefinitionProvider(
    'myMcpServer',
    new MyMcpServerProvider()
);
```

---

## 主要なクラス

### Position

エディタ内の位置（行・列）を表します。

```typescript
// 位置の作成（0-based）
const pos1 = new vscode.Position(5, 10);  // 6行目、11文字目
console.log('Line:', pos1.line);  // 5
console.log('Character:', pos1.character);  // 10

// 位置の比較
const pos2 = new vscode.Position(5, 15);
console.log(pos1.isBefore(pos2));  // true
console.log(pos1.isAfter(pos2));   // false
console.log(pos1.isEqual(pos2));   // false

// 新しい位置を作成
const pos3 = pos1.translate(1, 5);  // 1行下、5文字右
const pos4 = pos1.with(undefined, 0);  // 同じ行の0文字目
```

### Range

開始位置と終了位置で定義される範囲を表します。

```typescript
// 範囲の作成
const range1 = new vscode.Range(5, 0, 10, 20);
const range2 = new vscode.Range(
    new vscode.Position(5, 0),
    new vscode.Position(10, 20)
);

// プロパティ
console.log('Start:', range1.start);
console.log('End:', range1.end);
console.log('Is empty:', range1.isEmpty);  // start === end
console.log('Is single line:', range1.isSingleLine);

// 範囲の比較
const range3 = new vscode.Range(7, 5, 8, 10);
console.log(range1.contains(range3));  // true/false
console.log(range1.intersection(range3));  // 重なり部分
console.log(range1.union(range3));  // 両方を含む範囲

// 新しい範囲を作成
const range4 = range1.with(undefined, new vscode.Position(15, 0));
```

### Selection

カーソル選択範囲を表します（Rangeを継承）。

```typescript
// 選択の作成
const selection = new vscode.Selection(5, 0, 10, 20);

// アンカーとアクティブ
console.log('Anchor:', selection.anchor);  // 選択開始位置
console.log('Active:', selection.active);  // カーソル位置

// 選択方向
console.log('Is reversed:', selection.isReversed);  // 逆方向選択か

// エディタの選択を変更
const editor = vscode.window.activeTextEditor;
if (editor) {
    editor.selection = new vscode.Selection(0, 0, 0, 10);

    // 複数選択
    editor.selections = [
        new vscode.Selection(0, 0, 0, 10),
        new vscode.Selection(1, 0, 1, 10),
        new vscode.Selection(2, 0, 2, 10)
    ];
}
```

### Uri

ファイルやリソースの識別子を表します。

```typescript
// ファイルURI
const fileUri = vscode.Uri.file('/path/to/file.ts');
console.log('Scheme:', fileUri.scheme);  // 'file'
console.log('Path:', fileUri.path);
console.log('FSPath:', fileUri.fsPath);  // OS固有のパス

// HTTPやHTTPSの URI
const webUri = vscode.Uri.parse('https://example.com/api');

// カスタムスキーム
const customUri = vscode.Uri.parse('myscheme://authority/path?query#fragment');
console.log('Authority:', customUri.authority);
console.log('Query:', customUri.query);
console.log('Fragment:', customUri.fragment);

// URIの作成
const uri = vscode.Uri.from({
    scheme: 'https',
    authority: 'example.com',
    path: '/api/data',
    query: 'id=123',
    fragment: 'section'
});

// URIの変更
const newUri = fileUri.with({ path: '/new/path.ts' });

// URIの結合
const baseUri = vscode.Uri.file('/path/to');
const joinedUri = vscode.Uri.joinPath(baseUri, 'subdir', 'file.ts');
```

### TextEdit

テキスト編集操作を表します。

```typescript
// テキストの置換
const edit1 = vscode.TextEdit.replace(
    new vscode.Range(5, 0, 5, 10),
    'new text'
);

// テキストの挿入
const edit2 = vscode.TextEdit.insert(
    new vscode.Position(10, 0),
    'inserted text\n'
);

// テキストの削除
const edit3 = vscode.TextEdit.delete(
    new vscode.Range(15, 0, 16, 0)
);

// 行末文字の設定
const edit4 = vscode.TextEdit.setEndOfLine(vscode.EndOfLine.LF);
```

### WorkspaceEdit

ワークスペース全体への編集（複数ファイル対応）を表します。

```typescript
const edit = new vscode.WorkspaceEdit();

// テキスト編集
const uri1 = vscode.Uri.file('/path/to/file1.ts');
edit.replace(uri1, new vscode.Range(0, 0, 0, 10), 'new text');
edit.insert(uri1, new vscode.Position(5, 0), 'inserted\n');
edit.delete(uri1, new vscode.Range(10, 0, 11, 0));

// スニペット編集
edit.set(uri1, [
    vscode.SnippetTextEdit.replace(
        new vscode.Range(0, 0, 0, 10),
        new vscode.SnippetString('Hello ${1:name}!')
    )
]);

// ファイル操作
const uri2 = vscode.Uri.file('/path/to/newfile.ts');
edit.createFile(uri2, {
    overwrite: false,
    ignoreIfExists: true
});

edit.deleteFile(vscode.Uri.file('/path/to/oldfile.ts'), {
    recursive: true,
    ignoreIfNotExists: true
});

edit.renameFile(
    vscode.Uri.file('/path/to/old.ts'),
    vscode.Uri.file('/path/to/new.ts')
);

// メタデータ
edit.set(uri1, [
    {
        range: new vscode.Range(0, 0, 0, 10),
        newText: 'text',
        newEol: vscode.EndOfLine.LF
    }
]);

// 編集の適用
await vscode.workspace.applyEdit(edit);
```

### MarkdownString

Markdown形式の文字列を表します。

```typescript
// 基本的なMarkdown
const md1 = new vscode.MarkdownString('**Bold** and *italic*');

// コードブロック
const md2 = new vscode.MarkdownString();
md2.appendCodeblock('const x = 10;', 'typescript');

// リンク
const md3 = new vscode.MarkdownString('[Click here](https://example.com)');

// コマンドリンク
const md4 = new vscode.MarkdownString(
    '[Run Command](command:myExtension.runCommand)'
);
md4.isTrusted = true;  // コマンドリンクを有効にする

// 複雑なMarkdown
const md5 = new vscode.MarkdownString();
md5.appendMarkdown('# タイトル\n\n');
md5.appendMarkdown('説明文\n\n');
md5.appendCodeblock('function hello() {\n  console.log("Hello");\n}', 'javascript');
md5.appendMarkdown('\n\n');
md5.appendMarkdown('[詳細を見る](https://example.com)');

// HTMLのサポート
md5.supportHtml = true;
md5.appendMarkdown('<b>HTML bold</b>');
```

### Diagnostic

診断情報（エラー、警告等）を表します。

```typescript
// 基本的な診断
const diagnostic = new vscode.Diagnostic(
    new vscode.Range(5, 10, 5, 20),
    'Undefined variable',
    vscode.DiagnosticSeverity.Error
);

// プロパティの設定
diagnostic.code = 'E001';
diagnostic.source = 'myLinter';

// タグ
diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];

// 関連情報
diagnostic.relatedInformation = [
    new vscode.DiagnosticRelatedInformation(
        new vscode.Location(
            vscode.Uri.file('/path/to/related.ts'),
            new vscode.Range(10, 0, 10, 10)
        ),
        '関連するエラー'
    )
];

// 診断コレクションに追加
const collection = vscode.languages.createDiagnosticCollection('myLinter');
collection.set(vscode.Uri.file('/path/to/file.ts'), [diagnostic]);
```

### CompletionItem

補完アイテムを表します。

```typescript
// 基本的な補完
const item1 = new vscode.CompletionItem('myFunction');
item1.kind = vscode.CompletionItemKind.Function;

// 詳細な補完
const item2 = new vscode.CompletionItem(
    'myVariable',
    vscode.CompletionItemKind.Variable
);

item2.detail = 'string';
item2.documentation = new vscode.MarkdownString('変数の説明');

// 挿入テキスト
item2.insertText = 'myVariable';

// スニペット
const item3 = new vscode.CompletionItem('forEach');
item3.insertText = new vscode.SnippetString(
    'forEach(${1:item} => {\n\t$0\n})'
);

// 追加のテキスト編集
item3.additionalTextEdits = [
    vscode.TextEdit.insert(
        new vscode.Position(0, 0),
        'import { forEach } from "lodash";\n'
    )
];

// コマンド
item3.command = {
    title: 'Format',
    command: 'editor.action.formatDocument'
};

// ソート
item3.sortText = '0001';  // 表示順序
item3.filterText = 'each';  // フィルタ用テキスト

// プリセレクト
item3.preselect = true;

// タグ
item3.tags = [vscode.CompletionItemTag.Deprecated];

// コミット文字
item3.commitCharacters = ['.', '('];
```

### CodeAction

コードアクションを表します。

```typescript
// 基本的なコードアクション
const action1 = new vscode.CodeAction(
    'Fix this problem',
    vscode.CodeActionKind.QuickFix
);

action1.edit = new vscode.WorkspaceEdit();
action1.edit.replace(
    vscode.Uri.file('/path/to/file.ts'),
    new vscode.Range(5, 0, 5, 10),
    'fixed text'
);

// コマンド実行型
const action2 = new vscode.CodeAction(
    'Refactor to arrow function',
    vscode.CodeActionKind.Refactor
);

action2.command = {
    title: 'Refactor',
    command: 'myExtension.refactor',
    arguments: [vscode.Uri.file('/path/to/file.ts')]
};

// 診断情報の関連付け
const diagnostic = new vscode.Diagnostic(
    new vscode.Range(5, 0, 5, 10),
    'Use const instead',
    vscode.DiagnosticSeverity.Warning
);

action1.diagnostics = [diagnostic];

// 優先度
action1.isPreferred = true;

// 無効化
action2.disabled = {
    reason: 'この位置では使用できません'
};
```

### CodeLens

CodeLensを表します。

```typescript
// 基本的なCodeLens
const codeLens1 = new vscode.CodeLens(
    new vscode.Range(5, 0, 5, 20),
    {
        title: '10 references',
        command: 'editor.action.showReferences',
        arguments: [
            vscode.Uri.file('/path/to/file.ts'),
            new vscode.Position(5, 10),
            []  // locations
        ]
    }
);

// 解決が必要なCodeLens
const codeLens2 = new vscode.CodeLens(new vscode.Range(10, 0, 10, 30));
// resolveCodeLens で後から command を設定
```

### Hover

ホバー情報を表します。

```typescript
// Markdownのホバー
const hover1 = new vscode.Hover(
    new vscode.MarkdownString('**関数の説明**\n\n引数の詳細...'),
    new vscode.Range(5, 10, 5, 20)
);

// 複数のコンテンツ
const hover2 = new vscode.Hover([
    new vscode.MarkdownString('## Function\n'),
    new vscode.MarkdownString('```typescript\nfunction test(): void\n```'),
    '説明文'
]);

// コードブロック付き
const md = new vscode.MarkdownString();
md.appendCodeblock('function test(): void', 'typescript');
md.appendMarkdown('\n\n関数の詳細説明');

const hover3 = new vscode.Hover(md);
```

### Task

タスク定義を表します。

```typescript
// シェルタスク
const shellTask = new vscode.Task(
    { type: 'shell', task: 'build' },
    vscode.TaskScope.Workspace,
    'Build',
    'npm',
    new vscode.ShellExecution('npm run build')
);

shellTask.group = vscode.TaskGroup.Build;
shellTask.presentationOptions = {
    reveal: vscode.TaskRevealKind.Always,
    panel: vscode.TaskPanelKind.Dedicated
};

// プロセスタスク
const processTask = new vscode.Task(
    { type: 'process' },
    vscode.TaskScope.Workspace,
    'Run Script',
    'node',
    new vscode.ProcessExecution('node', ['script.js'], {
        cwd: '/path/to/dir',
        env: { 'NODE_ENV': 'production' }
    })
);

// カスタムタスク
const customTask = new vscode.Task(
    { type: 'custom' },
    vscode.TaskScope.Workspace,
    'Custom',
    'extension',
    new vscode.CustomExecution(async () => {
        return new CustomTaskTerminal();
    })
);

class CustomTaskTerminal implements vscode.Pseudoterminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite = this.writeEmitter.event;

    private closeEmitter = new vscode.EventEmitter<number>();
    onDidClose = this.closeEmitter.event;

    open(): void {
        this.writeEmitter.fire('Starting custom task...\r\n');

        setTimeout(() => {
            this.writeEmitter.fire('Task completed!\r\n');
            this.closeEmitter.fire(0);
        }, 2000);
    }

    close(): void {}
}
```

### ThemeColor

テーマカラーへの参照を表します。

```typescript
// テーマカラーの使用
const color1 = new vscode.ThemeColor('editor.foreground');
const color2 = new vscode.ThemeColor('errorForeground');
const color3 = new vscode.ThemeColor('list.activeSelectionBackground');

// ステータスバーアイテムで使用
const statusBarItem = vscode.window.createStatusBarItem();
statusBarItem.text = 'Status';
statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');

// 装飾で使用
const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
    borderColor: new vscode.ThemeColor('editorCursor.foreground')
});
```

### ThemeIcon

テーマアイコンへの参照を表します。

```typescript
// 組み込みアイコン
const icon1 = new vscode.ThemeIcon('check');
const icon2 = new vscode.ThemeIcon('error');
const icon3 = new vscode.ThemeIcon('folder');

// 色付きアイコン
const icon4 = new vscode.ThemeIcon(
    'warning',
    new vscode.ThemeColor('editorWarning.foreground')
);

// TreeItemで使用
const treeItem = new vscode.TreeItem('Item');
treeItem.iconPath = new vscode.ThemeIcon('file');

// QuickPickで使用
const quickPickItem: vscode.QuickPickItem = {
    label: '$(star) Important',
    description: 'With icon'
};

// ステータスバーで使用
const statusBar = vscode.window.createStatusBarItem();
statusBar.text = '$(rocket) Ready';
```

---

## 主要なインターフェイス

### TextDocument

開かれているテキストドキュメントを表します。

```typescript
const editor = vscode.window.activeTextEditor;
if (editor) {
    const document = editor.document;

    // 基本情報
    console.log('URI:', document.uri.toString());
    console.log('File name:', document.fileName);
    console.log('Language:', document.languageId);
    console.log('Version:', document.version);
    console.log('Line count:', document.lineCount);

    // 状態
    console.log('Is dirty:', document.isDirty);
    console.log('Is closed:', document.isClosed);
    console.log('Is untitled:', document.isUntitled);

    // 行末文字
    console.log('EOL:', document.eol);  // EndOfLine.LF or CRLF

    // コンテンツ
    const text = document.getText();
    const range = new vscode.Range(0, 0, 10, 0);
    const partialText = document.getText(range);

    // 行の取得
    const line = document.lineAt(5);
    console.log('Line text:', line.text);
    console.log('Range:', line.range);
    console.log('First non-whitespace:', line.firstNonWhitespaceCharacterIndex);
    console.log('Is empty:', line.isEmptyOrWhitespace);

    // 位置の取得
    const offset = document.offsetAt(new vscode.Position(5, 10));
    const position = document.positionAt(100);

    // 範囲の検証
    const validatedRange = document.validateRange(
        new vscode.Range(0, 0, 1000, 1000)
    );

    // 位置の検証
    const validatedPosition = document.validatePosition(
        new vscode.Position(1000, 1000)
    );

    // 単語の範囲取得
    const wordRange = document.getWordRangeAtPosition(
        new vscode.Position(5, 10)
    );

    // パターンで単語の範囲取得
    const customWordRange = document.getWordRangeAtPosition(
        new vscode.Position(5, 10),
        /[a-zA-Z0-9_]+/
    );

    // ドキュメントを保存
    await document.save();
}
```

### TextEditor

テキストエディタを表します。

```typescript
const editor = vscode.window.activeTextEditor;
if (editor) {
    // ドキュメント
    const document = editor.document;

    // 選択
    console.log('Selection:', editor.selection);
    console.log('Selections:', editor.selections);

    // 可視範囲
    console.log('Visible ranges:', editor.visibleRanges);

    // オプション
    console.log('Tab size:', editor.options.tabSize);
    console.log('Insert spaces:', editor.options.insertSpaces);

    // ビュー列
    console.log('View column:', editor.viewColumn);

    // テキストの編集
    await editor.edit(editBuilder => {
        editBuilder.replace(
            new vscode.Range(0, 0, 0, 10),
            'new text'
        );
        editBuilder.insert(
            new vscode.Position(5, 0),
            'inserted\n'
        );
        editBuilder.delete(
            new vscode.Range(10, 0, 11, 0)
        );
        editBuilder.setEndOfLine(vscode.EndOfLine.LF);
    });

    // 挿入位置モード
    await editor.insertSnippet(
        new vscode.SnippetString('Hello ${1:name}!'),
        new vscode.Position(5, 0)
    );

    // 選択の変更
    editor.selection = new vscode.Selection(0, 0, 0, 10);
    editor.selections = [
        new vscode.Selection(0, 0, 0, 10),
        new vscode.Selection(1, 0, 1, 10)
    ];

    // スクロール
    editor.revealRange(
        new vscode.Range(50, 0, 50, 0),
        vscode.TextEditorRevealType.InCenter
    );

    // 装飾
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,255,0,0.3)',
        border: '1px solid yellow'
    });

    editor.setDecorations(decorationType, [
        new vscode.Range(5, 0, 5, 10),
        new vscode.Range(10, 0, 10, 15)
    ]);

    // オプションの変更
    editor.options = {
        tabSize: 2,
        insertSpaces: true
    };
}
```

### Terminal

ターミナルを表します。

```typescript
// アクティブなターミナル
const terminal = vscode.window.activeTerminal;

if (terminal) {
    // 基本情報
    console.log('Name:', terminal.name);
    console.log('Process ID:', terminal.processId);
    console.log('Exit status:', terminal.exitStatus);

    // 状態
    console.log('State:', terminal.state);

    // テキスト送信
    terminal.sendText('echo "Hello"');
    terminal.sendText('ls', true);  // 改行を追加

    // 表示
    terminal.show();
    terminal.show(true);  // Focus を維持
    terminal.hide();

    // 破棄
    terminal.dispose();
}

// シェル統合
if (terminal && terminal.shellIntegration) {
    const shellIntegration = terminal.shellIntegration;
    console.log('CWD:', shellIntegration.cwd);

    // コマンド実行
    const execution = shellIntegration.executeCommand('npm test');

    // 実行結果を待つ
    vscode.window.onDidEndTerminalShellExecution(event => {
        if (event.execution === execution) {
            console.log('Exit code:', event.exitCode);
        }
    });
}
```

### QuickPick

カスタマイズ可能なクイックピックUIを表します。

```typescript
// クイックピックの作成
const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem>();

quickPick.title = 'オプションを選択';
quickPick.placeholder = '検索してください...';
quickPick.canSelectMany = false;

quickPick.items = [
    { label: '$(star) Option 1', description: 'Description 1' },
    { label: '$(check) Option 2', description: 'Description 2' },
    { label: '$(info) Option 3', description: 'Description 3', detail: '詳細情報' }
];

// ボタン
quickPick.buttons = [
    vscode.QuickInputButtons.Back,
    {
        iconPath: new vscode.ThemeIcon('gear'),
        tooltip: '設定'
    }
];

// イベント
quickPick.onDidChangeSelection(items => {
    console.log('Selected:', items[0]?.label);
});

quickPick.onDidAccept(() => {
    const selected = quickPick.selectedItems[0];
    console.log('Accepted:', selected?.label);
    quickPick.hide();
});

quickPick.onDidTriggerButton(button => {
    if (button === vscode.QuickInputButtons.Back) {
        // 戻る処理
    }
});

quickPick.onDidHide(() => {
    quickPick.dispose();
});

// 表示
quickPick.show();

// ビジー状態
quickPick.busy = true;
setTimeout(() => {
    quickPick.busy = false;
}, 1000);

// 動的にアイテムを更新
quickPick.onDidChangeValue(value => {
    quickPick.items = filterItems(value);
});
```

### InputBox

カスタマイズ可能な入力ボックスUIを表します。

```typescript
const inputBox = vscode.window.createInputBox();

inputBox.title = 'ファイル名を入力';
inputBox.placeholder = '例: myfile.ts';
inputBox.prompt = 'ファイル名を入力してください';
inputBox.value = '';

// 検証
inputBox.onDidChangeValue(value => {
    if (!value) {
        inputBox.validationMessage = 'ファイル名は必須です';
    } else if (!/^[a-zA-Z0-9_-]+\.[a-z]+$/.test(value)) {
        inputBox.validationMessage = '無効なファイル名です';
    } else {
        inputBox.validationMessage = undefined;
    }
});

// アクセプト
inputBox.onDidAccept(() => {
    const value = inputBox.value;
    if (value && !inputBox.validationMessage) {
        console.log('File name:', value);
        inputBox.hide();
    }
});

// ボタン
inputBox.buttons = [
    {
        iconPath: new vscode.ThemeIcon('folder'),
        tooltip: 'ブラウズ'
    }
];

inputBox.onDidTriggerButton(async button => {
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false
    });
    if (uris && uris[0]) {
        inputBox.value = uris[0].fsPath;
    }
});

inputBox.show();

// パスワード入力
inputBox.password = true;
```

### Webview

Webviewを表します。

```typescript
const panel = vscode.window.createWebviewPanel(
    'myWebview',
    'My Webview',
    vscode.ViewColumn.One,
    {
        enableScripts: true,
        enableForms: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.file('/path/to/resources')
        ]
    }
);

const webview = panel.webview;

// オプション
console.log('Options:', webview.options);

// CSP
const cspSource = webview.cspSource;

// HTML設定
webview.html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${cspSource}; style-src ${cspSource} 'unsafe-inline';">
        <title>My Webview</title>
    </head>
    <body>
        <h1>Hello from Webview!</h1>
        <button id="btn">Click me</button>
        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'hello' });
            });

            window.addEventListener('message', event => {
                const message = event.data;
                console.log('Received:', message);
            });
        </script>
    </body>
    </html>
`;

// メッセージ受信
webview.onDidReceiveMessage(message => {
    if (message.command === 'hello') {
        vscode.window.showInformationMessage('Hello from Webview!');

        // Webviewにメッセージ送信
        webview.postMessage({ type: 'response', text: 'Hi!' });
    }
});

// リソースURIの作成
const scriptUri = webview.asWebviewUri(
    vscode.Uri.file('/path/to/script.js')
);

// 状態の保存
const state = webview.state;
webview.state = { data: 'persisted' };
```

---

## 主要な Enum

### DiagnosticSeverity

診断の深刻度を表します。

```typescript
enum DiagnosticSeverity {
    Error = 0,      // エラー
    Warning = 1,    // 警告
    Information = 2, // 情報
    Hint = 3        // ヒント
}

// 使用例
const diagnostic = new vscode.Diagnostic(
    range,
    'メッセージ',
    vscode.DiagnosticSeverity.Warning
);
```

### CompletionItemKind

補完アイテムの種別を表します。

```typescript
enum CompletionItemKind {
    Text = 0,
    Method = 1,
    Function = 2,
    Constructor = 3,
    Field = 4,
    Variable = 5,
    Class = 6,
    Interface = 7,
    Module = 8,
    Property = 9,
    Unit = 10,
    Value = 11,
    Enum = 12,
    Keyword = 13,
    Snippet = 14,
    Color = 15,
    File = 16,
    Reference = 17,
    Folder = 18,
    EnumMember = 19,
    Constant = 20,
    Struct = 21,
    Event = 22,
    Operator = 23,
    TypeParameter = 24,
    User = 25,
    Issue = 26
}

// 使用例
const item = new vscode.CompletionItem('myFunction');
item.kind = vscode.CompletionItemKind.Function;
```

### SymbolKind

シンボルの種別を表します。

```typescript
enum SymbolKind {
    File = 0,
    Module = 1,
    Namespace = 2,
    Package = 3,
    Class = 4,
    Method = 5,
    Property = 6,
    Field = 7,
    Constructor = 8,
    Enum = 9,
    Interface = 10,
    Function = 11,
    Variable = 12,
    Constant = 13,
    String = 14,
    Number = 15,
    Boolean = 16,
    Array = 17,
    Object = 18,
    Key = 19,
    Null = 20,
    EnumMember = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25
}
```

### CodeActionKind

コードアクションの種類を表します。

```typescript
const CodeActionKind = {
    Empty: '',
    QuickFix: 'quickfix',
    Refactor: 'refactor',
    RefactorExtract: 'refactor.extract',
    RefactorInline: 'refactor.inline',
    RefactorMove: 'refactor.move',
    RefactorRewrite: 'refactor.rewrite',
    Source: 'source',
    SourceOrganizeImports: 'source.organizeImports',
    SourceFixAll: 'source.fixAll',
    Notebook: 'notebook'
};

// 使用例
const action = new vscode.CodeAction(
    'Extract to function',
    vscode.CodeActionKind.RefactorExtract
);
```

### ViewColumn

ビュー列を表します。

```typescript
enum ViewColumn {
    Active = -1,    // アクティブな列
    Beside = -2,    // 横に開く
    One = 1,        // 1列目
    Two = 2,        // 2列目
    Three = 3,      // 3列目
    Four = 4,       // 4列目
    Five = 5,       // 5列目
    Six = 6,        // 6列目
    Seven = 7,      // 7列目
    Eight = 8,      // 8列目
    Nine = 9        // 9列目
}

// 使用例
await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
```

### FileType

ファイルの種別を表します。

```typescript
enum FileType {
    Unknown = 0,
    File = 1,
    Directory = 2,
    SymbolicLink = 64
}

// 使用例
const stat = await vscode.workspace.fs.stat(uri);
if (stat.type === vscode.FileType.Directory) {
    console.log('ディレクトリです');
}
```

### StatusBarAlignment

ステータスバーの配置を表します。

```typescript
enum StatusBarAlignment {
    Left = 1,   // 左寄せ
    Right = 2   // 右寄せ}

// 使用例
const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
);
```

### TextEditorRevealType

エディタの表示方法を表します。

```typescript
enum TextEditorRevealType {
    Default = 0,        // デフォルト
    InCenter = 1,       // 中央に表示
    InCenterIfOutsideViewport = 2,  // 表示範囲外の場合のみ中央
    AtTop = 3           // 上部に表示
}

// 使用例
editor.revealRange(
    range,
    vscode.TextEditorRevealType.InCenter
);
```

---

## Provider パターン

Provider パターンは、特定の機能を提供するための標準的なインターフェイスです。

### CompletionItemProvider

コード補完を提供します。

```typescript
class MyCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const items: vscode.CompletionItem[] = [];

        // コンテキストに応じた補完
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        if (linePrefix.endsWith('log.')) {
            // log. の後の補完
            items.push(
                new vscode.CompletionItem('info', vscode.CompletionItemKind.Method),
                new vscode.CompletionItem('warn', vscode.CompletionItemKind.Method),
                new vscode.CompletionItem('error', vscode.CompletionItemKind.Method)
            );
        }

        // スニペット補完
        const snippetItem = new vscode.CompletionItem('foreach', vscode.CompletionItemKind.Snippet);
        snippetItem.insertText = new vscode.SnippetString(
            'forEach(${1:item} => {\n\t$0\n})'
        );
        snippetItem.documentation = new vscode.MarkdownString('ForEach loop');
        items.push(snippetItem);

        return items;
    }

    resolveCompletionItem(
        item: vscode.CompletionItem,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CompletionItem> {
        // 遅延解決（詳細情報の追加）
        if (item.label === 'info') {
            item.detail = 'console.info()';
            item.documentation = new vscode.MarkdownString('情報をログに出力します');
        }
        return item;
    }
}

// 登録
context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
        'typescript',
        new MyCompletionProvider(),
        '.'  // トリガー文字
    )
);
```

### HoverProvider

ホバー情報を提供します。

```typescript
class MyHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        if (word === 'myFunction') {
            const md = new vscode.MarkdownString();
            md.appendCodeblock('function myFunction(): void', 'typescript');
            md.appendMarkdown('\n\n---\n\n');
            md.appendMarkdown('この関数は...');

            return new vscode.Hover(md, range);
        }

        return null;
    }
}

context.subscriptions.push(
    vscode.languages.registerHoverProvider('typescript', new MyHoverProvider())
);
```

### DefinitionProvider

定義へジャンプを提供します。

```typescript
class MyDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        // シンボルの定義位置を検索
        const definitionUri = vscode.Uri.file('/path/to/definition.ts');
        const definitionPosition = new vscode.Position(10, 5);

        // Location を返す
        return new vscode.Location(definitionUri, definitionPosition);

        // または LocationLink を返す（プレビュー付き）
        // return [{
        //     targetUri: definitionUri,
        //     targetRange: new vscode.Range(10, 0, 15, 0),
        //     targetSelectionRange: new vscode.Range(10, 5, 10, 15),
        //     originSelectionRange: range
        // }];
    }
}

context.subscriptions.push(
    vscode.languages.registerDefinitionProvider('typescript', new MyDefinitionProvider())
);
```

### DocumentFormattingEditProvider

ドキュメント整形を提供します。

```typescript
class MyFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        const edits: vscode.TextEdit[] = [];

        // すべての行を整形
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const trimmed = line.text.trim();

            if (line.text !== trimmed) {
                edits.push(
                    vscode.TextEdit.replace(line.range, trimmed)
                );
            }
        }

        return edits;
    }
}

context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
        'typescript',
        new MyFormattingProvider()
    )
);
```

### CodeActionProvider

コードアクションを提供します。

```typescript
class MyCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        // 診断に対するQuickFix
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source === 'myLinter' && diagnostic.code === 'TODO') {
                const fix = new vscode.CodeAction(
                    'Remove TODO comment',
                    vscode.CodeActionKind.QuickFix
                );
                fix.edit = new vscode.WorkspaceEdit();
                fix.edit.delete(document.uri, diagnostic.range);
                fix.diagnostics = [diagnostic];
                fix.isPreferred = true;

                actions.push(fix);
            }
        }

        // リファクタリング
        const refactor = new vscode.CodeAction(
            'Extract to function',
            vscode.CodeActionKind.RefactorExtract
        );
        refactor.command = {
            title: 'Extract',
            command: 'myExtension.extractFunction',
            arguments: [document, range]
        };
        actions.push(refactor);

        return actions;
    }
}

context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
        'typescript',
        new MyCodeActionProvider(),
        {
            providedCodeActionKinds: [
                vscode.CodeActionKind.QuickFix,
                vscode.CodeActionKind.Refactor
            ]
        }
    )
);
```

### RenameProvider

リネーム機能を提供します。

```typescript
class MyRenameProvider implements vscode.RenameProvider {
    prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        // リネーム可能かチェック
        if (word.startsWith('_')) {
            throw new Error('プライベート変数はリネームできません');
        }

        return {
            range: range!,
            placeholder: word
        };
    }

    provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.WorkspaceEdit> {
        const edit = new vscode.WorkspaceEdit();
        const range = document.getWordRangeAtPosition(position);

        // すべての参照を検索してリネーム
        // （実際には参照検索ロジックが必要）
        edit.replace(document.uri, range!, newName);

        return edit;
    }
}

context.subscriptions.push(
    vscode.languages.registerRenameProvider('typescript', new MyRenameProvider())
);
```

### DocumentSymbolProvider

ドキュメントシンボルを提供します。

```typescript
class MyDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];

        // ドキュメントをパースしてシンボルを抽出
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);

            // 関数を検出
            const funcMatch = line.text.match(/function\s+(\w+)/);
            if (funcMatch) {
                const symbol = new vscode.DocumentSymbol(
                    funcMatch[1],
                    '',
                    vscode.SymbolKind.Function,
                    new vscode.Range(i, 0, i + 10, 0),  // 範囲
                    new vscode.Range(i, line.text.indexOf(funcMatch[1]), i, line.text.indexOf(funcMatch[1]) + funcMatch[1].length)  // 選択範囲
                );
                symbols.push(symbol);
            }

            // クラスを検出
            const classMatch = line.text.match(/class\s+(\w+)/);
            if (classMatch) {
                const symbol = new vscode.DocumentSymbol(
                    classMatch[1],
                    '',
                    vscode.SymbolKind.Class,
                    new vscode.Range(i, 0, i + 20, 0),
                    new vscode.Range(i, line.text.indexOf(classMatch[1]), i, line.text.indexOf(classMatch[1]) + classMatch[1].length)
                );
                symbols.push(symbol);
            }
        }

        return symbols;
    }
}

context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
        'typescript',
        new MyDocumentSymbolProvider()
    )
);
```

### TreeDataProvider

ツリービューのデータを提供します。

```typescript
class MyTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<MyTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        if (!element) {
            // ルート要素
            return Promise.resolve([
                new MyTreeItem('Parent 1', vscode.TreeItemCollapsibleState.Collapsed, 'parent'),
                new MyTreeItem('Parent 2', vscode.TreeItemCollapsibleState.Collapsed, 'parent')
            ]);
        } else {
            // 子要素
            return Promise.resolve([
                new MyTreeItem('Child 1', vscode.TreeItemCollapsibleState.None, 'child'),
                new MyTreeItem('Child 2', vscode.TreeItemCollapsibleState.None, 'child')
            ]);
        }
    }

    getParent(element: MyTreeItem): vscode.ProviderResult<MyTreeItem> {
        // 親要素を返す
        return undefined;
    }
}

class MyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'parent' | 'child'
    ) {
        super(label, collapsibleState);

        this.tooltip = `${this.label} - ${this.type}`;
        this.description = this.type;

        if (type === 'parent') {
            this.iconPath = new vscode.ThemeIcon('folder');
        } else {
            this.iconPath = new vscode.ThemeIcon('file');
        }

        this.contextValue = type;

        if (type === 'child') {
            this.command = {
                command: 'myExtension.openItem',
                title: 'Open Item',
                arguments: [this]
            };
        }
    }
}

const treeDataProvider = new MyTreeDataProvider();
const treeView = vscode.window.createTreeView('myTreeView', {
    treeDataProvider,
    showCollapseAll: true
});

context.subscriptions.push(treeView);
```

---

## ベストプラクティス

### 1. リソース管理

```typescript
export function activate(context: vscode.ExtensionContext) {
    // すべての Disposable を subscriptions に追加
    const disposable1 = vscode.commands.registerCommand('...', () => {});
    context.subscriptions.push(disposable1);

    const disposable2 = vscode.workspace.onDidChangeTextDocument(() => {});
    context.subscriptions.push(disposable2);

    // または
    context.subscriptions.push(
        vscode.commands.registerCommand('...', () => {}),
        vscode.workspace.onDidChangeTextDocument(() => {}),
        vscode.window.createStatusBarItem()
    );
}
```

### 2. エラーハンドリング

```typescript
async function myCommand() {
    try {
        const result = await someAsyncOperation();
        vscode.window.showInformationMessage('成功しました');
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`エラー: ${error.message}`);
            console.error('詳細:', error.stack);
        }
    }
}
```

### 3. キャンセレーショントークンの使用

```typescript
async function longRunningOperation(token: vscode.CancellationToken) {
    for (let i = 0; i < 1000; i++) {
        if (token.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        await processItem(i);
    }
}
```

### 4. 設定の活用

```typescript
function getSettings() {
    const config = vscode.workspace.getConfiguration('myExtension');

    return {
        enabled: config.get<boolean>('enabled', true),
        timeout: config.get<number>('timeout', 5000),
        customPath: config.get<string>('customPath')
    };
}

// 設定変更の監視
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('myExtension')) {
        const newSettings = getSettings();
        // 設定を再適用
    }
});
```

### 5. パフォーマンスの最適化

```typescript
// デバウンス
let timeout: NodeJS.Timeout | undefined;
vscode.workspace.onDidChangeTextDocument(event => {
    if (timeout) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
        analyzeDocument(event.document);
    }, 500);
});

// 遅延読み込み
let heavyFeature: HeavyFeature | undefined;
function getHeavyFeature(): HeavyFeature {
    if (!heavyFeature) {
        heavyFeature = new HeavyFeature();
    }
    return heavyFeature;
}
```

### 6. テスト可能な設計

```typescript
// ロジックとVSCode APIを分離
export class MyService {
    constructor(private readonly logger: Logger) {}

    processData(data: string): string {
        // VSCode APIに依存しないビジネスロジック
        return data.toUpperCase();
    }
}

// VSCode APIを使用するレイヤー
export function activate(context: vscode.ExtensionContext) {
    const service = new MyService({
        log: (msg) => console.log(msg)
    });

    vscode.commands.registerCommand('myExtension.process', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const text = editor.document.getText();
            const result = service.processData(text);
            // ...
        }
    });
}
```

---

## まとめ

このドキュメントでは、VSCode 拡張機能 API の全カテゴリを網羅し、具体的な実例を含めて説明しました。

### 主要なポイント

1. **15個の Namespace** - 機能領域ごとに整理された API
2. **122個のクラス** - データ構造と機能の実装
3. **301個のインターフェイス** - 契約とプロトコルの定義
4. **63個の Enum** - 定数と設定値
5. **50種類以上の Provider** - 拡張可能な設計パターン

### さらに学ぶには

- [VSCode API Documentation](https://code.visualstudio.com/api)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [vscode.d.ts](test-project/.vscode-test/vscode-win32-x64-archive-1.106.2/resources/app/out/vscode-dts/vscode.d.ts)

Happy Coding!
