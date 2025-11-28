# Macro API リファレンス

## テキスト取得・設定

```javascript
// エディタの全テキストを文字列として取得
macro.getValue()

// エディタの全テキストを指定した文字列で置換
macro.setValue(s: string)

// 指定範囲のテキストを取得（model.getValueInRange と同等）
macro.getValueInRange(startLine: number, startCol: number, endLine: number, endCol: number)

// テキストを行ごとに分割した配列として取得
macro.getLines()

// 行配列を改行で結合してテキスト全体を置換
macro.setLines(lines: string[])
```

**使用例:**
```javascript
// 全テキスト取得
const text = macro.getValue();

// 全テキスト設定
macro.setValue("新しいテキスト\n2行目\n3行目");

// 範囲指定でテキスト取得（1行1列から3行10列まで）
const rangeText = macro.getValueInRange(1, 1, 3, 10);

// 選択範囲のテキストを取得
const sel = macro.getSelection();
if (sel) {
  const selectedText = macro.getValueInRange(
    sel.startLineNumber, sel.startColumn,
    sel.endLineNumber, sel.endColumn
  );
  macro.log("Selected:", selectedText);
}

// 行配列として取得
const lines = macro.getLines();
macro.log("Total lines:", lines.length);

// 行配列を設定
macro.setLines(['Line 1', 'Line 2', 'Line 3']);
```

---

## テキスト編集

```javascript
// 現在のカーソル位置にテキストを挿入
macro.insertTextAtCursor(text: string)

// 指定範囲のテキストを置換
macro.replaceRange(startLine: number, startCol: number, endLine: number, endCol: number, text: string)
```

**使用例:**
```javascript
// カーソル位置に挿入
macro.insertTextAtCursor("// コメント\n");

// 範囲置換（1行1列から1行5列を "Hello" に置換）
macro.replaceRange(1, 1, 1, 5, "Hello");

// 選択範囲を削除
const sel = macro.getSelection();
if (sel) {
  macro.replaceRange(
    sel.startLineNumber, sel.startColumn,
    sel.endLineNumber, sel.endColumn,
    ""  // 空文字で削除
  );
}

// 選択範囲を大文字に変換
const sel = macro.getSelection();
if (sel) {
  const text = macro.getValueInRange(
    sel.startLineNumber, sel.startColumn,
    sel.endLineNumber, sel.endColumn
  );
  macro.replaceRange(
    sel.startLineNumber, sel.startColumn,
    sel.endLineNumber, sel.endColumn,
    text.toUpperCase()
  );
}
```

---

## カーソル操作

```javascript
// 現在のカーソル位置を {lineNumber, column} で取得
macro.getCursorPosition()

// カーソルを左に移動（行頭で前行末尾に折り返し）。select=true で選択
macro.moveCursorLeftWrap(select?: boolean)

// カーソルを右に移動（行末で次行頭に折り返し）。select=true で選択
macro.moveCursorRightWrap(select?: boolean)

// カーソルを単語単位で左に移動。select=true で選択
macro.moveCursorWordLeft(select?: boolean)

// カーソルを単語単位で右に移動。select=true で選択
macro.moveCursorWordRight(select?: boolean)
```

**使用例:**
```javascript
// カーソル位置取得
const pos = macro.getCursorPosition();
if (pos) {
  macro.log(`Cursor at line ${pos.lineNumber}, column ${pos.column}`);
}

// 右に移動
macro.moveCursorRightWrap();

// 右に移動しながら選択
macro.moveCursorRightWrap(true);

// 単語単位で移動
macro.moveCursorWordRight();

// 単語単位で選択
macro.moveCursorWordLeft(true);

// カーソルを先頭に移動してから3文字選択
macro.runCommand('cursorHome');
for (let i = 0; i < 3; i++) {
  macro.moveCursorRightWrap(true);
}
```

---

## 選択範囲操作

```javascript
// 現在の選択範囲を monaco.Selection オブジェクトとして取得
macro.getSelection()

// アンカーとアクティブ位置を指定して選択範囲を設定
macro.setSelection(anchorLine: number, anchorCol: number, activeLine: number, activeCol: number)
```

**使用例:**
```javascript
// 選択範囲を取得
const sel = macro.getSelection();
if (sel) {
  macro.log("Selection:", {
    start: { line: sel.startLineNumber, col: sel.startColumn },
    end: { line: sel.endLineNumber, col: sel.endColumn }
  });
}

// 1行1列から5行10列まで選択
macro.setSelection(1, 1, 5, 10);

// 現在行を選択
const pos = macro.getCursorPosition();
if (pos) {
  macro.setSelection(pos.lineNumber, 1, pos.lineNumber + 1, 1);
}

// 選択範囲が空かチェック
const sel = macro.getSelection();
if (sel && sel.isEmpty()) {
  macro.log("No selection");
}
```

---

## Monaco コマンド実行

```javascript
// Monaco エディタの任意のコマンドを実行
macro.runCommand(commandId: string, payload?: any)

// runCommand のエイリアス
macro.exec(commandId: string, payload?: any)
```

**使用例:**
```javascript
// コメントトグル
macro.runCommand('editor.action.commentLine');

// フォーマット
macro.runCommand('editor.action.formatDocument');

// 行を上に移動
macro.runCommand('editor.action.moveLinesUpAction');

// 複数行コメント
macro.runCommand('editor.action.blockComment');

// カーソルを行末に移動
macro.runCommand('cursorEnd');

// 全選択
macro.runCommand('editor.action.selectAll');

// 検索を開く
macro.runCommand('actions.find');

// execエイリアスを使用
await macro.exec('editor.action.commentLine');
```

---

## ユーティリティ

```javascript
// 指定ミリ秒間待機（Promise を返すので await で使用）
macro.sleep(ms: number)

// [macro] プレフィックス付きでコンソールにログ出力
macro.log(...args: any[])
```

**使用例:**
```javascript
// 1秒待機
await macro.sleep(1000);

// ログ出力
macro.log("Hello", "World", 123);  // [macro] Hello World 123

// 段階的な処理
for (let i = 0; i < 5; i++) {
  macro.insertTextAtCursor(`Line ${i}\n`);
  await macro.sleep(200);  // 200ms待機
}

// デバッグ用
const pos = macro.getCursorPosition();
macro.log("Current position:", pos);

const lines = macro.getLines();
macro.log("Line count:", lines.length);
```

---

## 実用的なマクロ例

### 選択範囲を囲む
```javascript
const sel = macro.getSelection();
if (sel) {
  const text = macro.getValueInRange(
    sel.startLineNumber, sel.startColumn,
    sel.endLineNumber, sel.endColumn
  );
  macro.replaceRange(
    sel.startLineNumber, sel.startColumn,
    sel.endLineNumber, sel.endColumn,
    `"${text}"`
  );
}
```

### 各行に行番号を追加
```javascript
const lines = macro.getLines();
const numbered = lines.map((line, i) => `${i + 1}. ${line}`);
macro.setLines(numbered);
```

### 空行を削除
```javascript
const lines = macro.getLines();
const filtered = lines.filter(line => line.trim() !== '');
macro.setLines(filtered);
```

### 選択範囲を段階的に大文字化
```javascript
const sel = macro.getSelection();
if (sel) {
  const text = macro.getValueInRange(
    sel.startLineNumber, sel.startColumn,
    sel.endLineNumber, sel.endColumn
  );
  
  for (let i = 0; i <= text.length; i++) {
    const partial = text.slice(0, i).toUpperCase() + text.slice(i);
    macro.replaceRange(
      sel.startLineNumber, sel.startColumn,
      sel.endLineNumber, sel.endColumn,
      partial
    );
    await macro.sleep(50);
  }
}
```

### 複数行コメントアウト（コマンド実行例）
```javascript
for (let i = 0; i < 3; i++) {
  await macro.sleep(100);
  macro.runCommand('editor.action.commentLine');
  macro.runCommand('cursorDown');
}
```

---

## 制限事項

以下の識別子は静的チェックでブロックされ、使用できません:
- `document`
- `window`
- `eval`
- `Function`
- `globalThis`
- `XMLHttpRequest`
- `fetch`
- `alert`, `confirm`, `prompt`
- `localStorage`, `sessionStorage`
- `process`, `require`, `import`
