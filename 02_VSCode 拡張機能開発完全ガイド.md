# VSCode 拡張機能開発完全ガイド

> `yo code` で生成されたプロジェクトを基に、VSCode 拡張機能開発に必要な知識を体系的に解説

## 目次

- [はじめに](#はじめに)
- [プロジェクト構造](#プロジェクト構造)
- [エントリポイントとライフサイクル](#エントリポイントとライフサイクル)
- [package.json 完全解説](#packagejson-完全解説)
- [ビルドとバンドル](#ビルドとバンドル)
- [デバッグ](#デバッグ)
- [テスト](#テスト)
- [公開とデプロイ](#公開とデプロイ)
- [開発のベストプラクティス](#開発のベストプラクティス)
- [高度なトピック](#高度なトピック)

---

## はじめに

VSCode 拡張機能は、Visual Studio Code の機能を拡張するためのパッケージです。TypeScript または JavaScript で記述され、VSCode Extension API を使用して IDE の機能にアクセスします。

### 拡張機能でできること

- **コマンドの追加**: カスタムコマンドの登録
- **UI の拡張**: ツリービュー、Webview、ステータスバーアイテム等
- **言語サポート**: IntelliSense、診断、フォーマッター等
- **デバッガー**: カスタムデバッグアダプタ
- **テーマ**: カラーテーマ、アイコンテーマ
- **スニペット**: コードスニペット
- **その他**: タスク、SCM、認証プロバイダ等

### 開発環境のセットアップ

```bash
# Node.js と npm/pnpm のインストールが必要
node --version  # v18 以上推奨
npm --version

# Yeoman と VSCode Extension Generator のインストール
npm install -g yo generator-code

# 新しいプロジェクトの作成
yo code
```

---

## プロジェクト構造

`yo code` で生成されたプロジェクトの構造を詳しく見ていきます。

### ディレクトリ構造

```
test-project/
├── .vscode/                    # VSCode の設定ディレクトリ
│   ├── extensions.json         # 推奨される拡張機能
│   ├── launch.json             # デバッグ設定
│   ├── settings.json           # プロジェクト設定
│   └── tasks.json              # タスク定義
├── .vscode-test/               # テスト実行時に使用される VSCode インスタンス
├── dist/                       # ビルド済みファイルの出力先
│   └── extension.js            # バンドルされた拡張機能コード
├── out/                        # TypeScript コンパイル済みファイル（テスト用）
│   └── test/                   # コンパイルされたテストファイル
├── src/                        # ソースコード
│   ├── extension.ts            # エントリポイント
│   └── test/                   # テストコード
│       └── extension.test.ts   # テストファイル
├── .eslintrc.json              # ESLint 設定（または eslint.config.mjs）
├── .gitignore                  # Git 無視設定
├── .vscodeignore               # 拡張機能パッケージから除外するファイル
├── .vscode-test.mjs            # テスト設定
├── CHANGELOG.md                # 変更履歴
├── esbuild.js                  # esbuild バンドラー設定
├── package.json                # プロジェクト設定とメタデータ
├── pnpm-lock.yaml              # 依存関係のロックファイル
├── README.md                   # README
├── tsconfig.json               # TypeScript 設定
└── vsc-extension-quickstart.md # クイックスタートガイド
```

### 各ファイルの役割

#### src/extension.ts

拡張機能のエントリポイント。`activate` 関数と `deactivate` 関数を export します。

#### package.json

拡張機能のマニフェストファイル。メタデータ、依存関係、コントリビューションポイントを定義します。

#### tsconfig.json

TypeScript コンパイラの設定ファイル。

#### esbuild.js

esbuild を使用してソースコードをバンドルする設定ファイル。

#### .vscode/launch.json

拡張機能をデバッグするための設定。

#### .vscode/tasks.json

ビルドとウォッチタスクの定義。

#### .vscodeignore

拡張機能パッケージ（.vsix）に含めないファイルを指定します。

---

## エントリポイントとライフサイクル

### エントリポイント: extension.ts

VSCode 拡張機能のエントリポイントは、`package.json` の `main` フィールドで指定されたファイルです。

**package.json:**
```json
{
  "main": "./dist/extension.js"
}
```

このファイルは、TypeScript ソースコード `src/extension.ts` からビルドされます。

### 基本構造

```typescript
// src/extension.ts
import * as vscode from 'vscode';

// 拡張機能がアクティベートされた時に呼ばれる
export function activate(context: vscode.ExtensionContext) {
    console.log('拡張機能がアクティベートされました');

    // コマンドの登録
    const disposable = vscode.commands.registerCommand('test1.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Test1!');
    });

    // Disposable を subscriptions に追加（リソース管理）
    context.subscriptions.push(disposable);
}

// 拡張機能が非アクティベートされた時に呼ばれる
export function deactivate() {
    // クリーンアップ処理
}
```

### activate 関数

拡張機能がアクティベートされた時に**1度だけ**呼ばれる関数です。

#### いつアクティベートされるか

アクティベートのタイミングは `package.json` の `activationEvents` で制御できますが、最近のバージョンでは以下のように自動的に決定されます：

1. **コマンドが実行された時**: `contributes.commands` に定義されたコマンドが実行された時
2. **特定のファイルが開かれた時**: 言語 ID に基づく
3. **ワークスペースに特定のファイルが含まれる時**: グロブパターンに基づく
4. **VSCode起動時**: `"activationEvents": ["onStartupFinished"]` を指定した場合

**package.json の例:**
```json
{
  "activationEvents": [
    "onLanguage:typescript",           // TypeScript ファイルを開いた時
    "onCommand:test1.helloWorld",      // コマンドが実行された時
    "workspaceContains:**/*.config.js", // 特定のファイルが存在する時
    "onStartupFinished"                // VSCode起動完了後
  ]
}
```

最新のベストプラクティスでは、`activationEvents` を空配列 `[]` にして、`contributes` から自動的に推論させることが推奨されています：

```json
{
  "activationEvents": [],  // 自動推論
  "contributes": {
    "commands": [
      {
        "command": "test1.helloWorld",
        "title": "Hello World"
      }
    ]
  }
}
```

#### ExtensionContext

`activate` 関数には `ExtensionContext` が渡されます。これは拡張機能のコンテキスト情報を提供します。

```typescript
export function activate(context: vscode.ExtensionContext) {
    // 拡張機能のパス
    console.log('Extension path:', context.extensionPath);
    console.log('Extension URI:', context.extensionUri);

    // 拡張機能のモード
    console.log('Extension mode:', context.extensionMode);
    // ExtensionMode.Production: 本番
    // ExtensionMode.Development: 開発
    // ExtensionMode.Test: テスト

    // グローバルストレージ（ワークスペース間で共有）
    const globalValue = context.globalState.get('myKey', 'default');
    await context.globalState.update('myKey', 'newValue');

    // ワークスペースストレージ（ワークスペース固有）
    const workspaceValue = context.workspaceState.get('workspaceKey');
    await context.workspaceState.update('workspaceKey', 'value');

    // シークレットストレージ（認証情報等）
    const secret = await context.secrets.get('apiKey');
    await context.secrets.store('apiKey', 'secret-value');
    await context.secrets.delete('apiKey');

    // ストレージパス
    console.log('Global storage path:', context.globalStorageUri);
    console.log('Workspace storage path:', context.storageUri);
    console.log('Log path:', context.logUri);

    // 環境変数
    const envVars = context.environmentVariableCollection;
    envVars.replace('MY_VAR', 'value');
    envVars.append('PATH', ':/my/path');
    envVars.prepend('PATH', '/my/path:');

    // リソース管理
    context.subscriptions.push(
        vscode.commands.registerCommand('...', () => {}),
        vscode.workspace.onDidChangeTextDocument(() => {}),
        // その他の Disposable
    );
}
```

#### subscriptions による リソース管理

`context.subscriptions` は、拡張機能が非アクティベート時に自動的に破棄される Disposable のリストです。

```typescript
export function activate(context: vscode.ExtensionContext) {
    // すべての Disposable を subscriptions に追加
    context.subscriptions.push(
        // コマンド
        vscode.commands.registerCommand('test1.command1', () => {}),

        // イベントリスナー
        vscode.workspace.onDidChangeTextDocument(event => {}),
        vscode.window.onDidChangeActiveTextEditor(editor => {}),

        // UI 要素
        vscode.window.createStatusBarItem(),
        vscode.window.createOutputChannel('My Extension'),

        // プロバイダ
        vscode.languages.registerCompletionItemProvider('typescript', provider),

        // その他の Disposable
        myCustomDisposable
    );
}
```

**なぜ重要か:**
- メモリリークを防ぐ
- イベントリスナーの解除を自動化
- リソースの適切な解放

### deactivate 関数

拡張機能が非アクティベート（無効化）される時に呼ばれる関数です。

```typescript
export function deactivate() {
    // クリーンアップ処理
    // - データベース接続のクローズ
    // - 一時ファイルの削除
    // - バックグラウンドプロセスの停止
    // 等
}
```

**非同期処理も可能:**
```typescript
export async function deactivate() {
    await closeConnection();
    await cleanupTempFiles();
}
```

**注意点:**
- `context.subscriptions` に追加された Disposable は自動的に破棄されるため、通常は `deactivate` で明示的に処理する必要はありません
- 重い処理は避ける（VSCode のシャットダウンをブロックしない）
- エラーを投げない（ログに記録するのみ）

---

## package.json 完全解説

`package.json` は拡張機能のマニフェストファイルです。VSCode がこのファイルを読み取って拡張機能の情報を取得します。

### 基本構造

test-project の package.json を見てみましょう：

```json
{
  "name": "test1",
  "displayName": "Test1",
  "description": "",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.106.1"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "test1.helloWorld",
        "title": "Hello World"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "pnpm run package",
    "compile": "pnpm run check-types && pnpm run lint && node esbuild.js",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "package": "pnpm run check-types && pnpm run lint && node esbuild.js --production",
    "compile-tests": "tsc -p . --outDir out",
    "watch-tests": "tsc -p . -w --outDir out",
    "pretest": "pnpm run compile-tests && pnpm run compile && pnpm run lint",
    "check-types": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/vscode": "^1.106.1",
    "@types/mocha": "^10.0.10",
    "@types/node": "22.x",
    "typescript-eslint": "^8.46.3",
    "eslint": "^9.39.1",
    "esbuild": "^0.27.0",
    "npm-run-all": "^4.1.5",
    "typescript": "^5.9.3",
    "@vscode/test-cli": "^0.0.12",
    "@vscode/test-electron": "^2.5.2"
  }
}
```

### 必須フィールド

#### name (必須)

拡張機能の一意な識別子。小文字、ハイフン、数字のみ使用可能。

```json
{
  "name": "my-awesome-extension"
}
```

#### version (必須)

セマンティックバージョニング形式のバージョン番号。

```json
{
  "version": "1.2.3"
}
```

- **Major (1)**: 破壊的変更
- **Minor (2)**: 新機能追加（後方互換性あり）
- **Patch (3)**: バグフィックス

#### engines.vscode (必須)

対応する VSCode のバージョン。

```json
{
  "engines": {
    "vscode": "^1.106.1"  // 1.106.1 以上
  }
}
```

バージョン指定の例：
- `^1.50.0`: 1.50.0 以上 2.0.0 未満
- `>=1.50.0`: 1.50.0 以上
- `1.50.0 - 1.60.0`: 1.50.0 から 1.60.0
- `*`: すべてのバージョン（非推奨）

#### main (必須)

エントリポイントのファイルパス。

```json
{
  "main": "./dist/extension.js"
}
```

### メタデータフィールド

#### displayName

マーケットプレイスに表示される名前。

```json
{
  "displayName": "My Awesome Extension"
}
```

#### description

拡張機能の説明（短い）。

```json
{
  "description": "この拡張機能は素晴らしい機能を提供します"
}
```

#### publisher

公開者の ID。VSCode Marketplace でアカウントを作成した時の ID。

```json
{
  "publisher": "your-publisher-id"
}
```

#### categories

拡張機能のカテゴリ。マーケットプレイスでのフィルタリングに使用されます。

```json
{
  "categories": [
    "Programming Languages",
    "Linters",
    "Formatters",
    "Snippets",
    "Debuggers",
    "Testing",
    "Data Science",
    "Machine Learning",
    "Visualization",
    "Other"
  ]
}
```

#### keywords

検索キーワード。

```json
{
  "keywords": [
    "typescript",
    "linter",
    "formatter"
  ]
}
```

#### icon

拡張機能のアイコン（128x128px PNG）。

```json
{
  "icon": "images/icon.png"
}
```

#### repository

リポジトリの URL。

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  }
}
```

#### license

ライセンス。

```json
{
  "license": "MIT"
}
```

#### homepage, bugs

```json
{
  "homepage": "https://github.com/username/repo#readme",
  "bugs": {
    "url": "https://github.com/username/repo/issues"
  }
}
```

### activationEvents

拡張機能がアクティベートされるタイミングを指定します。

```json
{
  "activationEvents": [
    "onLanguage:typescript",
    "onCommand:extension.command",
    "onDebug",
    "onDebugResolve:node",
    "onDebugDynamicConfigurations:node",
    "workspaceContains:**/.editorconfig",
    "onFileSystem:sftp",
    "onSearch:textSearchProvider",
    "onView:nodeDependencies",
    "onUri",
    "onWebviewPanel:catCoding",
    "onCustomEditor:catCustoms.pawDraw",
    "onAuthenticationRequest:github",
    "onStartupFinished",
    "*"  // VSCode起動時（非推奨）
  ]
}
```

**最新のベストプラクティス:**
```json
{
  "activationEvents": []  // 空配列で自動推論
}
```

### contributes

拡張機能が VSCode に提供する機能を定義します。これが拡張機能の中核部分です。

#### commands

コマンドパレットに表示されるコマンドを定義します。

```json
{
  "contributes": {
    "commands": [
      {
        "command": "extension.helloWorld",
        "title": "Hello World",
        "category": "My Extension",
        "icon": "$(rocket)",
        "enablement": "editorLangId == typescript"
      }
    ]
  }
}
```

**フィールド:**
- `command`: コマンド ID（一意）
- `title`: 表示名
- `category`: カテゴリ（オプション）
- `icon`: アイコン（オプション、ThemeIcon または パス）
- `enablement`: 有効化条件（when 句、オプション）

#### menus

コマンドをメニューに配置します。

```json
{
  "contributes": {
    "menus": {
      "commandPalette": [
        {
          "command": "extension.helloWorld",
          "when": "editorLangId == typescript"
        }
      ],
      "editor/context": [
        {
          "command": "extension.formatCode",
          "when": "editorHasSelection",
          "group": "1_modification"
        }
      ],
      "explorer/context": [
        {
          "command": "extension.openInTerminal",
          "when": "explorerResourceIsFolder"
        }
      ],
      "view/title": [
        {
          "command": "extension.refresh",
          "when": "view == myView",
          "group": "navigation"
        }
      ],
      "view/item/context": [
        {
          "command": "extension.deleteItem",
          "when": "view == myView && viewItem == deletable"
        }
      ]
    }
  }
}
```

**メニューの種類:**
- `commandPalette`: コマンドパレット
- `editor/context`: エディタのコンテキストメニュー
- `editor/title`: エディタタイトルバー
- `editor/title/context`: エディタタイトルのコンテキストメニュー
- `explorer/context`: エクスプローラーのコンテキストメニュー
- `scm/title`: SCM タイトルバー
- `scm/resourceGroup/context`: SCM リソースグループ
- `scm/resource/context`: SCM リソース
- `view/title`: ビュータイトル
- `view/item/context`: ビューアイテムのコンテキストメニュー
- `terminal/context`: ターミナルコンテキストメニュー

#### keybindings

キーボードショートカットを定義します。

```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "extension.helloWorld",
        "key": "ctrl+shift+h",
        "mac": "cmd+shift+h",
        "when": "editorTextFocus"
      }
    ]
  }
}
```

#### configuration

設定項目を定義します。

```json
{
  "contributes": {
    "configuration": {
      "title": "My Extension",
      "properties": {
        "myExtension.enable": {
          "type": "boolean",
          "default": true,
          "description": "拡張機能を有効にする"
        },
        "myExtension.timeout": {
          "type": "number",
          "default": 5000,
          "minimum": 0,
          "maximum": 60000,
          "description": "タイムアウト（ミリ秒）"
        },
        "myExtension.mode": {
          "type": "string",
          "default": "auto",
          "enum": ["auto", "manual", "disabled"],
          "enumDescriptions": [
            "自動モード",
            "手動モード",
            "無効"
          ],
          "description": "動作モード"
        },
        "myExtension.customPaths": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [],
          "description": "カスタムパスのリスト"
        },
        "myExtension.advanced": {
          "type": "object",
          "properties": {
            "debug": {
              "type": "boolean",
              "default": false
            },
            "logLevel": {
              "type": "string",
              "default": "info"
            }
          },
          "default": {
            "debug": false,
            "logLevel": "info"
          },
          "description": "詳細設定"
        }
      }
    }
  }
}
```

**設定のスコープ:**
```json
{
  "myExtension.setting": {
    "scope": "window",  // window, resource, language-overridable, machine, machine-overridable
    "type": "string",
    "default": "value"
  }
}
```

#### languages

言語の定義と関連付けを行います。

```json
{
  "contributes": {
    "languages": [
      {
        "id": "mylang",
        "aliases": ["MyLang", "mylang"],
        "extensions": [".ml"],
        "configuration": "./language-configuration.json",
        "icon": {
          "light": "./icons/mylang-light.png",
          "dark": "./icons/mylang-dark.png"
        }
      }
    ]
  }
}
```

#### grammars

TextMate 文法ファイルを登録します。

```json
{
  "contributes": {
    "grammars": [
      {
        "language": "mylang",
        "scopeName": "source.mylang",
        "path": "./syntaxes/mylang.tmLanguage.json"
      }
    ]
  }
}
```

#### themes

カラーテーマを提供します。

```json
{
  "contributes": {
    "themes": [
      {
        "label": "My Dark Theme",
        "uiTheme": "vs-dark",
        "path": "./themes/dark-theme.json"
      }
    ]
  }
}
```

#### iconThemes

アイコンテーマを提供します。

```json
{
  "contributes": {
    "iconThemes": [
      {
        "id": "myIconTheme",
        "label": "My Icon Theme",
        "path": "./icons/icon-theme.json"
      }
    ]
  }
}
```

#### snippets

スニペットを提供します。

```json
{
  "contributes": {
    "snippets": [
      {
        "language": "typescript",
        "path": "./snippets/typescript.json"
      }
    ]
  }
}
```

#### viewsContainers

カスタムビューコンテナを定義します。

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "myContainer",
          "title": "My Container",
          "icon": "resources/container-icon.svg"
        }
      ]
    }
  }
}
```

#### views

ビューを定義します。

```json
{
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "myView",
          "name": "My View",
          "icon": "resources/view-icon.svg",
          "contextualTitle": "My Extension View",
          "visibility": "visible"
        }
      ],
      "myContainer": [
        {
          "id": "myCustomView",
          "name": "Custom View"
        }
      ]
    }
  }
}
```

**ビューの配置先:**
- `explorer`: エクスプローラー
- `scm`: ソース管理
- `debug`: デバッグ
- `test`: テスト
- カスタムビューコンテナの ID

#### viewsWelcome

ビューが空の時に表示されるウェルカムコンテンツ。

```json
{
  "contributes": {
    "viewsWelcome": [
      {
        "view": "myView",
        "contents": "ようこそ！\n[ファイルを開く](command:workbench.action.files.openFile)"
      }
    ]
  }
}
```

#### taskDefinitions

カスタムタスクタイプを定義します。

```json
{
  "contributes": {
    "taskDefinitions": [
      {
        "type": "myTask",
        "required": ["script"],
        "properties": {
          "script": {
            "type": "string",
            "description": "実行するスクリプト"
          },
          "args": {
            "type": "array",
            "description": "引数"
          }
        }
      }
    ]
  }
}
```

#### debuggers

デバッガーを定義します。

```json
{
  "contributes": {
    "debuggers": [
      {
        "type": "node",
        "label": "Node Debug",
        "program": "./out/debugAdapter.js",
        "runtime": "node",
        "configurationAttributes": {
          "launch": {
            "required": ["program"],
            "properties": {
              "program": {
                "type": "string",
                "description": "実行するプログラム"
              }
            }
          }
        }
      }
    ]
  }
}
```

#### walkthroughs

ウォークスルー（ガイド）を定義します。

```json
{
  "contributes": {
    "walkthroughs": [
      {
        "id": "myWalkthrough",
        "title": "はじめに",
        "description": "拡張機能の使い方",
        "steps": [
          {
            "id": "step1",
            "title": "ステップ1",
            "description": "説明文\n[コマンド実行](command:extension.command)",
            "media": {
              "image": "media/step1.png",
              "altText": "ステップ1の画像"
            }
          }
        ]
      }
    ]
  }
}
```

### scripts

npm/pnpm スクリプトを定義します。

```json
{
  "scripts": {
    "vscode:prepublish": "pnpm run package",
    "compile": "pnpm run check-types && pnpm run lint && node esbuild.js",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "package": "pnpm run check-types && pnpm run lint && node esbuild.js --production",
    "compile-tests": "tsc -p . --outDir out",
    "watch-tests": "tsc -p . -w --outDir out",
    "pretest": "pnpm run compile-tests && pnpm run compile && pnpm run lint",
    "check-types": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vscode-test"
  }
}
```

**主要なスクリプト:**

- `vscode:prepublish`: 拡張機能を公開する前に実行される（自動）
- `compile`: コンパイルとバンドル
- `watch`: ファイル変更を監視して自動ビルド
- `package`: 本番用のビルド（最適化）
- `test`: テストの実行
- `lint`: コードのリント
- `check-types`: 型チェック

---

## ビルドとバンドル

拡張機能は、複数の TypeScript ファイルを単一の JavaScript ファイルにバンドルして配布します。

### TypeScript コンパイル

#### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "Node16",
    "target": "ES2022",
    "lib": ["ES2022"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true
  }
}
```

**重要な設定:**

- `module`: モジュールシステム（`Node16` または `CommonJS`）
- `target`: 出力する JavaScript のバージョン
- `lib`: 使用する標準ライブラリ
- `sourceMap`: ソースマップの生成
- `strict`: 厳格な型チェック

#### コンパイルコマンド

```bash
# 通常のコンパイル
tsc

# 型チェックのみ（出力なし）
tsc --noEmit

# ウォッチモード
tsc --watch
```

### esbuild によるバンドル

test-project では esbuild を使用して、複数のファイルを単一のファイルにバンドルしています。

#### esbuild.js

```javascript
const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// esbuild の問題マッチャー（VSCode のタスクと連携）
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',
    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    },
};

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],  // エントリポイント
        bundle: true,                        // バンドルを有効化
        format: 'cjs',                       // CommonJS 形式
        minify: production,                  // 本番環境では最小化
        sourcemap: !production,              // 開発環境ではソースマップ
        sourcesContent: false,               // ソースコードを含めない
        platform: 'node',                    // Node.js プラットフォーム
        outfile: 'dist/extension.js',        // 出力ファイル
        external: ['vscode'],                // vscode モジュールは外部化
        logLevel: 'silent',
        plugins: [esbuildProblemMatcherPlugin],
    });

    if (watch) {
        await ctx.watch();  // ウォッチモード
    } else {
        await ctx.rebuild(); // 1回ビルド
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
```

**重要なオプション:**

- `entryPoints`: エントリポイントのファイル
- `bundle: true`: すべての依存関係をバンドル
- `format: 'cjs'`: CommonJS 形式で出力
- `minify`: コードの最小化
- `sourcemap`: ソースマップの生成
- `platform: 'node'`: Node.js 環境向け
- `outfile`: 出力ファイルのパス
- `external: ['vscode']`: `vscode` モジュールはバンドルに含めない（VSCode が提供）

#### ビルドコマンド

```bash
# 開発ビルド
pnpm run compile

# ウォッチモード
pnpm run watch

# 本番ビルド（最適化）
pnpm run package
```

### webpack との比較

以前は webpack が主流でしたが、最近は esbuild が推奨されています。

**esbuild の利点:**
- **高速**: webpack より 10-100倍高速
- **シンプル**: 設定が簡単
- **組み込み機能**: TypeScript、JSX、ソースマップ等を標準サポート

**webpack が必要な場合:**
- 複雑なローダーやプラグインが必要
- CSS/SCSS のバンドル
- より細かい制御が必要

### .vscodeignore

拡張機能パッケージ（.vsix）から除外するファイルを指定します。

```
.vscode/**
.vscode-test/**
out/**
node_modules/**
src/**
.gitignore
.yarnrc
esbuild.js
vsc-extension-quickstart.md
**/tsconfig.json
**/eslint.config.mjs
**/*.map
**/*.ts
**/.vscode-test.*
```

**含めるべきファイル:**
- `dist/extension.js` (バンドル済みコード)
- `package.json`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- アイコン、画像等のリソース
- 言語ファイル、テーマ、スニペット等

**除外すべきファイル:**
- ソースコード (`src/**`)
- テストコード
- ビルド設定ファイル
- 開発用の依存関係

---

## デバッグ

VSCode 拡張機能のデバッグは、特別な「Extension Host」プロセスで行います。

### launch.json

`.vscode/launch.json` でデバッグ設定を定義します。

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/dist/**/*.js"
      ],
      "preLaunchTask": "${defaultBuildTask}"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/test"
      ],
      "outFiles": [
        "${workspaceFolder}/out/test/**/*.js"
      ],
      "preLaunchTask": "npm: watch-tests"
    }
  ]
}
```

**設定項目:**

- `type: "extensionHost"`: 拡張機能ホスト
- `request: "launch"`: 起動リクエスト
- `args`: Extension Host に渡す引数
  - `--extensionDevelopmentPath`: 開発中の拡張機能のパス
  - `--extensionTestsPath`: テストファイルのパス
- `outFiles`: デバッグ用のソースマップ
- `preLaunchTask`: デバッグ前に実行するタスク

### デバッグの実行

1. **F5 キーを押す**または「実行とデバッグ」ビューから「Run Extension」を選択
2. 新しい VSCode ウィンドウ（Extension Development Host）が開く
3. ブレークポイントを設定してデバッグ

### ブレークポイント

```typescript
export function activate(context: vscode.ExtensionContext) {
    debugger;  // ここで停止

    const disposable = vscode.commands.registerCommand('test1.helloWorld', () => {
        debugger;  // コマンド実行時に停止
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
}
```

### デバッグコンソール

デバッグコンソールで式を評価できます：

```javascript
// 変数の確認
context.extensionPath

// VSCode API の呼び出し
vscode.window.showInformationMessage('Debug message')

// コマンドの実行
await vscode.commands.executeCommand('workbench.action.files.save')
```

### ログ出力

```typescript
// コンソールログ（開発ツールのコンソールに表示）
console.log('Log message');
console.warn('Warning message');
console.error('Error message');

// 出力チャンネル
const outputChannel = vscode.window.createOutputChannel('My Extension');
outputChannel.appendLine('Extension activated');
outputChannel.show();

// ログ出力チャンネル（ログレベル付き）
const logChannel = vscode.window.createOutputChannel('My Extension', { log: true });
logChannel.info('Information');
logChannel.warn('Warning');
logChannel.error('Error');
logChannel.debug('Debug message');
```

### ホットリロード

ウォッチモードを使用すると、コードの変更を自動的にビルドできます。

```bash
pnpm run watch
```

ただし、拡張機能を再読み込みするには、Extension Development Host ウィンドウで以下を実行：
- **Ctrl+R** (Windows/Linux) または **Cmd+R** (Mac)
- コマンドパレット → 「Developer: Reload Window」

---

## テスト

VSCode 拡張機能のテストには、Mocha テストフレームワークと VSCode Test API を使用します。

### テスト構造

```
test-project/
├── src/
│   └── test/
│       └── extension.test.ts    # テストファイル
├── .vscode-test.mjs             # テスト設定
└── out/
    └── test/
        └── extension.test.js    # コンパイルされたテスト
```

### .vscode-test.mjs

テストの設定ファイルです。

```javascript
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',  // テストファイルのパターン
});
```

### テストファイルの記述

```typescript
// src/test/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('VSCode API test', async () => {
        // ドキュメントを開く
        const doc = await vscode.workspace.openTextDocument({
            content: 'Hello World',
            language: 'plaintext'
        });

        assert.strictEqual(doc.lineCount, 1);
        assert.strictEqual(doc.getText(), 'Hello World');
    });

    test('Command test', async () => {
        // コマンドの実行
        await vscode.commands.executeCommand('test1.helloWorld');

        // コマンド一覧の取得
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('test1.helloWorld'));
    });

    test('Configuration test', () => {
        const config = vscode.workspace.getConfiguration('myExtension');
        const value = config.get('someProperty', 'default');
        assert.strictEqual(value, 'default');
    });
});
```

### テストの実行

```bash
# テストの実行
pnpm run test

# テストのコンパイルのみ
pnpm run compile-tests

# テストのウォッチモード
pnpm run watch-tests
```

### テストのデバッグ

`.vscode/launch.json` に「Extension Tests」設定があれば、F5 でテストをデバッグできます。

```json
{
  "name": "Extension Tests",
  "type": "extensionHost",
  "request": "launch",
  "args": [
    "--extensionDevelopmentPath=${workspaceFolder}",
    "--extensionTestsPath=${workspaceFolder}/out/test"
  ],
  "outFiles": [
    "${workspaceFolder}/out/test/**/*.js"
  ]
}
```

### テストのベストプラクティス

1. **ユニットテストと統合テストを分ける**
   ```
   src/test/
   ├── unit/           # ユニットテスト
   │   └── utils.test.ts
   └── integration/    # 統合テスト（VSCode API を使用）
       └── commands.test.ts
   ```

2. **非同期処理のテスト**
   ```typescript
   test('Async test', async () => {
       const result = await someAsyncFunction();
       assert.strictEqual(result, 'expected');
   });
   ```

3. **モックの使用**
   ```typescript
   import * as sinon from 'sinon';

   test('Mock test', () => {
       const stub = sinon.stub(vscode.window, 'showInformationMessage');

       myFunction();

       assert.ok(stub.calledOnce);
       stub.restore();
   });
   ```

4. **テストのクリーンアップ**
   ```typescript
   suite('Test Suite', () => {
       let disposables: vscode.Disposable[] = [];

       teardown(() => {
           disposables.forEach(d => d.dispose());
           disposables = [];
       });

       test('Test', () => {
           const item = vscode.window.createStatusBarItem();
           disposables.push(item);
           // テスト
       });
   });
   ```

---

## 公開とデプロイ

拡張機能を VSCode Marketplace に公開する手順を説明します。

### 前提条件

1. **Azure DevOps アカウント**
   - https://dev.azure.com にアクセスしてアカウント作成

2. **Personal Access Token (PAT) の作成**
   - Azure DevOps → User Settings → Personal Access Tokens
   - Scopes: **Marketplace (Manage)**

3. **Publisher の作成**
   - https://marketplace.visualstudio.com/manage にアクセス
   - Publisher ID を作成

### vsce のインストール

```bash
npm install -g @vscode/vsce
```

### package.json の準備

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "description": "A great extension",
  "version": "1.0.0",
  "publisher": "your-publisher-id",  // 必須
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  },
  "license": "MIT",
  "icon": "images/icon.png",
  "engines": {
    "vscode": "^1.106.1"
  }
}
```

### README.md の作成

魅力的な README を作成します。

```markdown
# My Extension

この拡張機能は...

## 機能

- 機能1: 説明
- 機能2: 説明

## 使い方

1. コマンドパレットを開く (Ctrl+Shift+P)
2. "My Command" を実行

## 設定

- `myExtension.enable`: 拡張機能を有効化

## リリースノート

### 1.0.0

- 初回リリース
```

### CHANGELOG.md の作成

```markdown
# Change Log

## [1.0.0] - 2024-01-01

### Added
- 初回リリース

### Changed
- なし

### Fixed
- なし
```

### パッケージの作成

```bash
# .vsix ファイルを作成
vsce package

# 出力例: my-extension-1.0.0.vsix
```

### ローカルでのインストールとテスト

```bash
# .vsix ファイルからインストール
code --install-extension my-extension-1.0.0.vsix

# または
# VSCode の Extensions ビュー → ... → Install from VSIX
```

### Marketplace への公開

```bash
# ログイン
vsce login your-publisher-id

# 公開
vsce publish

# または、バージョンを指定して公開
vsce publish patch  # 1.0.0 → 1.0.1
vsce publish minor  # 1.0.0 → 1.1.0
vsce publish major  # 1.0.0 → 2.0.0
```

### 公開の自動化（CI/CD）

#### GitHub Actions の例

```yaml
# .github/workflows/publish.yml
name: Publish Extension

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run package

      - name: Publish to Marketplace
        run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
```

**GitHub Secrets に追加:**
- `VSCE_PAT`: Personal Access Token

### 更新の公開

1. **バージョンを更新**
   ```bash
   npm version patch  # または minor, major
   ```

2. **CHANGELOG.md を更新**

3. **公開**
   ```bash
   vsce publish
   ```

### プレリリース版の公開

```bash
vsce publish --pre-release
```

### アンインストール

```bash
# Marketplace から削除
vsce unpublish your-publisher-id.extension-name
```

---

## 開発のベストプラクティス

### 1. エラーハンドリング

```typescript
export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('extension.command', async () => {
        try {
            await riskyOperation();
            vscode.window.showInformationMessage('成功しました');
        } catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`エラー: ${error.message}`);
                console.error('詳細:', error.stack);
            } else {
                vscode.window.showErrorMessage('不明なエラーが発生しました');
            }
        }
    });

    context.subscriptions.push(disposable);
}
```

### 2. リソース管理

```typescript
export function activate(context: vscode.ExtensionContext) {
    // すべての Disposable を subscriptions に追加
    context.subscriptions.push(
        vscode.commands.registerCommand('...', () => {}),
        vscode.workspace.onDidChangeTextDocument(() => {}),
        vscode.window.createStatusBarItem(),
        // カスタム Disposable
        {
            dispose() {
                // クリーンアップ処理
            }
        }
    );
}
```

### 3. 設定の活用

```typescript
function getSettings() {
    const config = vscode.workspace.getConfiguration('myExtension');
    return {
        enabled: config.get<boolean>('enable', true),
        timeout: config.get<number>('timeout', 5000)
    };
}

// 設定変更の監視
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('myExtension')) {
        const settings = getSettings();
        // 設定を再適用
    }
});
```

### 4. パフォーマンス

```typescript
// デバウンス
let timeout: NodeJS.Timeout | undefined;
vscode.workspace.onDidChangeTextDocument(event => {
    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
        processDocument(event.document);
    }, 500);
});

// 遅延初期化
let heavyService: HeavyService | undefined;
function getHeavyService(): HeavyService {
    if (!heavyService) {
        heavyService = new HeavyService();
    }
    return heavyService;
}
```

### 5. ログとテレメトリ

```typescript
const outputChannel = vscode.window.createOutputChannel('My Extension', { log: true });

function logInfo(message: string) {
    outputChannel.info(`[INFO] ${message}`);
}

function logError(message: string, error?: Error) {
    outputChannel.error(`[ERROR] ${message}`);
    if (error) {
        outputChannel.error(error.stack || error.message);
    }
}
```

### 6. 国際化（i18n）

```typescript
// package.nls.json (英語)
{
  "extension.command.title": "Hello World",
  "message.greeting": "Hello, {0}!"
}

// package.nls.ja.json (日本語)
{
  "extension.command.title": "ハローワールド",
  "message.greeting": "こんにちは、{0}さん!"
}

// コード内
import * as vscode from 'vscode';

const message = vscode.l10n.t('message.greeting', 'John');
```

### 7. セキュリティ

```typescript
// 機密情報はシークレットストレージに保存
async function storeApiKey(context: vscode.ExtensionContext, apiKey: string) {
    await context.secrets.store('apiKey', apiKey);
}

async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    return await context.secrets.get('apiKey');
}

// ユーザー入力のサニタイズ
function sanitizeInput(input: string): string {
    return input.replace(/[<>&"']/g, '');
}
```

### 8. テスタビリティ

```typescript
// ロジックとVSCode APIを分離
export class DocumentProcessor {
    processText(text: string): string {
        return text.toUpperCase();
    }
}

// VSCode API の使用は薄いレイヤーに限定
export function activate(context: vscode.ExtensionContext) {
    const processor = new DocumentProcessor();

    vscode.commands.registerCommand('extension.process', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const text = editor.document.getText();
            const result = processor.processText(text);
            // ...
        }
    });
}
```

---

## 高度なトピック

### ExtensionContext の活用

```typescript
export function activate(context: vscode.ExtensionContext) {
    // 拡張機能のパス
    const iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icon.png');

    // グローバルストレージ
    const lastUsed = context.globalState.get<number>('lastUsedTimestamp');
    context.globalState.update('lastUsedTimestamp', Date.now());

    // ワークスペースストレージ
    const projectData = context.workspaceState.get<any>('projectData');
    context.workspaceState.update('projectData', { /* ... */ });

    // シークレット
    context.secrets.get('token').then(token => {
        if (token) {
            // トークンを使用
        }
    });

    // ストレージパス
    if (context.storageUri) {
        const dbPath = vscode.Uri.joinPath(context.storageUri, 'database.db');
        // データベースファイルを作成
    }

    // 環境変数の設定
    context.environmentVariableCollection.replace('MY_VAR', 'value');
}
```

### マルチルート ワークスペース

```typescript
const workspaceFolders = vscode.workspace.workspaceFolders;
if (workspaceFolders) {
    for (const folder of workspaceFolders) {
        console.log('Folder:', folder.name);
        console.log('Path:', folder.uri.fsPath);
    }
}

// ドキュメントに対応するワークスペースフォルダを取得
const editor = vscode.window.activeTextEditor;
if (editor) {
    const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (folder) {
        console.log('Workspace folder:', folder.name);
    }
}
```

### Webview の高度な使用

```typescript
const panel = vscode.window.createWebviewPanel(
    'myWebview',
    'My Webview',
    vscode.ViewColumn.One,
    {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri]
    }
);

// リソースURIの作成
const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'script.js')
);

panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; script-src ${panel.webview.cspSource};">
    </head>
    <body>
        <script src="${scriptUri}"></script>
    </body>
    </html>
`;

// メッセージング
panel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
        case 'alert':
            vscode.window.showInformationMessage(message.text);
            break;
    }
});
```

### カスタムエディタ

```typescript
vscode.window.registerCustomEditorProvider(
    'myExtension.customEditor',
    {
        async resolveCustomTextEditor(
            document: vscode.TextDocument,
            webviewPanel: vscode.WebviewPanel,
            token: vscode.CancellationToken
        ) {
            // カスタムエディタの実装
        }
    }
);
```

### 拡張機能間の連携

```typescript
// 他の拡張機能のAPIを取得
const gitExtension = vscode.extensions.getExtension('vscode.git');
if (gitExtension) {
    const git = gitExtension.exports;
    // Git APIを使用
}

// 自分の拡張機能からAPIを公開
export function activate(context: vscode.ExtensionContext) {
    return {
        async doSomething(param: string): Promise<string> {
            return `Processed: ${param}`;
        }
    };
}
```

### パフォーマンス監視

```typescript
const startTime = Date.now();
try {
    await heavyOperation();
} finally {
    const duration = Date.now() - startTime;
    console.log(`Operation took ${duration}ms`);
}
```

---

## まとめ

このガイドでは、VSCode 拡張機能開発の基礎から応用まで、体系的に解説しました。

### 学んだこと

1. **プロジェクト構造**: ファイルとディレクトリの役割
2. **エントリポイント**: `activate` と `deactivate` 関数
3. **package.json**: 拡張機能のマニフェスト
4. **ビルドとバンドル**: TypeScript と esbuild
5. **デバッグ**: Extension Host でのデバッグ
6. **テスト**: Mocha と VSCode Test API
7. **公開**: VSCode Marketplace へのデプロイ
8. **ベストプラクティス**: リソース管理、エラーハンドリング等

### 次のステップ

- [VSCode API Documentation](https://code.visualstudio.com/api) を読む
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples) を試す
- 実際に拡張機能を作成して公開する

### 参考リソース

- [VSCode Extension API](https://code.visualstudio.com/api/references/vscode-api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

Happy Coding!
