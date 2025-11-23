# TypeScript 基礎ガイド

## 目次

1. [TypeScriptとは](#typescriptとは)
2. [基本型](#基本型)
3. [配列とタプル](#配列とタプル)
4. [オブジェクト型](#オブジェクト型)
5. [関数](#関数)
6. [ユニオン型とインターセクション型](#ユニオン型とインターセクション型)
7. [型エイリアス](#型エイリアス)
8. [インターフェース](#インターフェース)
9. [クラス](#クラス)
10. [継承](#継承)
11. [ジェネリクス](#ジェネリクス)
12. [型アサーション](#型アサーション)
13. [型ガード](#型ガード)
14. [列挙型（Enum）](#列挙型enum)
15. [非同期処理](#非同期処理)
16. [モジュール](#モジュール)
17. [ユーティリティ型](#ユーティリティ型)

---

## TypeScriptとは

TypeScriptはMicrosoft社が開発した、JavaScriptに型システムを追加したプログラミング言語です。

### なぜTypeScriptを使うのか

- **型安全性**: コンパイル時にエラーを検出できる
- **IDE支援**: 自動補完や型情報の表示が充実
- **可読性**: コードの意図が明確になる
- **リファクタリング**: 安全にコードを変更できる
- **JavaScriptとの互換性**: 既存のJavaScriptコードと併用可能

---

## 基本型

TypeScriptの基本的なデータ型について学びます。

### 文字列型（string）

```typescript
let name: string = "太郎";
let greeting: string = `こんにちは、${name}さん`;
```

### 数値型（number）

```typescript
let age: number = 25;
let price: number = 1000.50;
let hex: number = 0xf00d;
let binary: number = 0b1010;
```

### 真偽値型（boolean）

```typescript
let isActive: boolean = true;
let hasPermission: boolean = false;
```

### null と undefined

```typescript
let n: null = null;
let u: undefined = undefined;

// strictNullChecks が有効な場合
let maybeString: string | null = null;
```

### any型

あらゆる型を許容します（型チェックを無効化）。使用は最小限に。

```typescript
let anything: any = "文字列";
anything = 123;
anything = true; // すべて許可される
```

### unknown型

any型より安全な、未知の型を表します。

```typescript
let value: unknown = "hello";

// 型ガードなしでは使用できない
// value.toUpperCase(); // エラー

if (typeof value === "string") {
    console.log(value.toUpperCase()); // OK
}
```

### void型

関数が値を返さない場合に使用します。

```typescript
function logMessage(message: string): void {
    console.log(message);
}
```

### never型

決して値を返さない関数や到達不可能なコードを表します。

```typescript
function throwError(message: string): never {
    throw new Error(message);
}

function infiniteLoop(): never {
    while (true) {
        // 無限ループ
    }
}
```

---

## 配列とタプル

### 配列型

```typescript
// 配列の定義方法1
let numbers: number[] = [1, 2, 3, 4, 5];

// 配列の定義方法2（ジェネリック記法）
let names: Array<string> = ["太郎", "花子", "次郎"];

// 複数の型を含む配列
let mixed: (string | number)[] = [1, "two", 3, "four"];
```

### タプル型

固定長で各要素の型が決まっている配列です。

```typescript
// [文字列, 数値]のタプル
let person: [string, number] = ["太郎", 25];

// 要素へのアクセス
let personName: string = person[0];
let personAge: number = person[1];

// 分割代入
let [name, age] = person;

// 可変長タプル
let tuple: [string, ...number[]] = ["ラベル", 1, 2, 3];
```

---

## オブジェクト型

### オブジェクトリテラル型

```typescript
let user: { name: string; age: number } = {
    name: "太郎",
    age: 25
};

// オプショナルプロパティ
let config: { host: string; port?: number } = {
    host: "localhost"
    // port は省略可能
};

// 読み取り専用プロパティ
let point: { readonly x: number; readonly y: number } = {
    x: 10,
    y: 20
};
// point.x = 5; // エラー: 読み取り専用
```

### インデックスシグネチャ

プロパティ名が動的な場合に使用します。

```typescript
let dictionary: { [key: string]: string } = {
    "apple": "りんご",
    "banana": "バナナ",
    "orange": "オレンジ"
};

// 数値インデックス
let array: { [index: number]: string } = ["a", "b", "c"];
```

---

## 関数

### 関数の型定義

```typescript
// 関数宣言
function add(a: number, b: number): number {
    return a + b;
}

// 関数式
const subtract = function(a: number, b: number): number {
    return a - b;
};

// アロー関数（ラムダ式）
const multiply = (a: number, b: number): number => {
    return a * b;
};

// 式が1つの場合は省略記法
const divide = (a: number, b: number): number => a / b;
```

### オプショナルパラメータ

```typescript
function greet(name: string, greeting?: string): string {
    if (greeting) {
        return `${greeting}, ${name}さん`;
    }
    return `こんにちは、${name}さん`;
}

console.log(greet("太郎")); // "こんにちは、太郎さん"
console.log(greet("太郎", "おはよう")); // "おはよう、太郎さん"
```

### デフォルトパラメータ

```typescript
function createUser(name: string, age: number = 20): object {
    return { name, age };
}

console.log(createUser("太郎")); // { name: "太郎", age: 20 }
console.log(createUser("花子", 25)); // { name: "花子", age: 25 }
```

### レストパラメータ

```typescript
function sum(...numbers: number[]): number {
    return numbers.reduce((total, n) => total + n, 0);
}

console.log(sum(1, 2, 3, 4, 5)); // 15
```

### 関数のオーバーロード

```typescript
// オーバーロードシグネチャ
function format(value: string): string;
function format(value: number): string;
function format(value: boolean): string;

// 実装シグネチャ
function format(value: string | number | boolean): string {
    if (typeof value === "string") {
        return `文字列: ${value}`;
    } else if (typeof value === "number") {
        return `数値: ${value}`;
    } else {
        return `真偽値: ${value}`;
    }
}
```

### 高階関数

関数を引数に取る、または関数を返す関数です。

```typescript
// 関数を引数に取る
function applyOperation(a: number, b: number, op: (x: number, y: number) => number): number {
    return op(a, b);
}

const result = applyOperation(10, 5, (x, y) => x + y); // 15

// 関数を返す
function createMultiplier(factor: number): (value: number) => number {
    return (value: number) => value * factor;
}

const double = createMultiplier(2);
console.log(double(5)); // 10
```

---

## ユニオン型とインターセクション型

### ユニオン型（Union Types）

複数の型のうちいずれかを表します。

```typescript
type StringOrNumber = string | number;

let value: StringOrNumber;
value = "hello"; // OK
value = 123; // OK
// value = true; // エラー

function printId(id: string | number): void {
    if (typeof id === "string") {
        console.log(`ID（文字列）: ${id.toUpperCase()}`);
    } else {
        console.log(`ID（数値）: ${id.toFixed(2)}`);
    }
}
```

### インターセクション型（Intersection Types）

複数の型を結合した新しい型を作ります。

```typescript
type Person = {
    name: string;
    age: number;
};

type Employee = {
    employeeId: string;
    department: string;
};

type Staff = Person & Employee;

const staff: Staff = {
    name: "太郎",
    age: 30,
    employeeId: "E001",
    department: "営業部"
};
```

---

## 型エイリアス

型に名前を付けて再利用できるようにします。

```typescript
// プリミティブ型のエイリアス
type Name = string;
type Age = number;

// オブジェクト型のエイリアス
type User = {
    name: Name;
    age: Age;
    email: string;
};

// 関数型のエイリアス
type MathOperation = (a: number, b: number) => number;

const add: MathOperation = (a, b) => a + b;
const subtract: MathOperation = (a, b) => a - b;

// ユニオン型のエイリアス
type Status = "pending" | "approved" | "rejected";

let orderStatus: Status = "pending";
// orderStatus = "invalid"; // エラー
```

---

## インターフェース

オブジェクトの構造を定義します。

### 基本的なインターフェース

```typescript
interface Person {
    name: string;
    age: number;
    greet(): void;
}

const person: Person = {
    name: "太郎",
    age: 25,
    greet() {
        console.log(`こんにちは、${this.name}です`);
    }
};
```

### オプショナルプロパティと読み取り専用プロパティ

```typescript
interface Product {
    readonly id: string;
    name: string;
    price: number;
    description?: string; // オプショナル
}

const product: Product = {
    id: "P001",
    name: "ノートPC",
    price: 100000
};

// product.id = "P002"; // エラー: 読み取り専用
```

### インターフェースの拡張

```typescript
interface Animal {
    name: string;
    age: number;
}

interface Dog extends Animal {
    breed: string;
    bark(): void;
}

const myDog: Dog = {
    name: "ポチ",
    age: 3,
    breed: "柴犬",
    bark() {
        console.log("ワンワン！");
    }
};
```

### 複数のインターフェースを拡張

```typescript
interface Printable {
    print(): void;
}

interface Loggable {
    log(): void;
}

interface Document extends Printable, Loggable {
    title: string;
    content: string;
}

const doc: Document = {
    title: "報告書",
    content: "本文...",
    print() {
        console.log("印刷中...");
    },
    log() {
        console.log(`ログ: ${this.title}`);
    }
};
```

### 型エイリアス vs インターフェース

```typescript
// 型エイリアス: ユニオン型やプリミティブ型に名前をつけられる
type ID = string | number;

// インターフェース: 拡張や実装に適している
interface User {
    id: ID;
    name: string;
}

// インターフェースは宣言のマージが可能
interface Window {
    title: string;
}

interface Window {
    size: number;
}

// 上記は自動的にマージされる
const myWindow: Window = {
    title: "メインウィンドウ",
    size: 800
};
```

---

## クラス

### 基本的なクラス

```typescript
class Person {
    // プロパティ
    name: string;
    age: number;

    // コンストラクタ
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    // メソッド
    greet(): void {
        console.log(`こんにちは、${this.name}です。${this.age}歳です。`);
    }

    // メソッド（戻り値あり）
    getInfo(): string {
        return `${this.name} (${this.age}歳)`;
    }
}

const person = new Person("太郎", 25);
person.greet(); // "こんにちは、太郎です。25歳です。"
```

### アクセス修飾子

```typescript
class BankAccount {
    public accountNumber: string;    // どこからでもアクセス可能（デフォルト）
    private balance: number;          // クラス内部のみアクセス可能
    protected owner: string;          // クラスと派生クラスからアクセス可能

    constructor(accountNumber: string, owner: string, initialBalance: number) {
        this.accountNumber = accountNumber;
        this.owner = owner;
        this.balance = initialBalance;
    }

    // public メソッド
    public deposit(amount: number): void {
        if (amount > 0) {
            this.balance += amount;
            console.log(`${amount}円を入金しました。残高: ${this.balance}円`);
        }
    }

    public getBalance(): number {
        return this.balance;
    }

    // private メソッド
    private validateAmount(amount: number): boolean {
        return amount > 0;
    }
}

const account = new BankAccount("123456", "太郎", 10000);
account.deposit(5000);
console.log(account.getBalance()); // 15000
// console.log(account.balance); // エラー: private
```

### コンストラクタの省略記法

```typescript
class User {
    // プロパティ宣言とコンストラクタ代入を同時に行う
    constructor(
        public id: string,
        public name: string,
        private password: string
    ) {}

    public verifyPassword(input: string): boolean {
        return this.password === input;
    }
}

const user = new User("U001", "太郎", "secret123");
console.log(user.name); // "太郎"
// console.log(user.password); // エラー: private
```

### getter と setter

```typescript
class Temperature {
    private _celsius: number = 0;

    // getter
    get celsius(): number {
        return this._celsius;
    }

    // setter
    set celsius(value: number) {
        if (value < -273.15) {
            throw new Error("絶対零度以下の温度は設定できません");
        }
        this._celsius = value;
    }

    get fahrenheit(): number {
        return this._celsius * 9 / 5 + 32;
    }

    set fahrenheit(value: number) {
        this._celsius = (value - 32) * 5 / 9;
    }
}

const temp = new Temperature();
temp.celsius = 25;
console.log(temp.fahrenheit); // 77
temp.fahrenheit = 86;
console.log(temp.celsius); // 30
```

### 静的メンバー

```typescript
class MathUtil {
    static PI: number = 3.14159;

    static circleArea(radius: number): number {
        return this.PI * radius * radius;
    }

    static rectangleArea(width: number, height: number): number {
        return width * height;
    }
}

// インスタンス化せずに使用
console.log(MathUtil.PI); // 3.14159
console.log(MathUtil.circleArea(5)); // 78.53975
```

### 抽象クラス

```typescript
abstract class Shape {
    constructor(public name: string) {}

    // 抽象メソッド（派生クラスで実装必須）
    abstract calculateArea(): number;

    // 通常のメソッド
    describe(): void {
        console.log(`これは${this.name}です。面積は${this.calculateArea()}です。`);
    }
}

class Circle extends Shape {
    constructor(public radius: number) {
        super("円");
    }

    calculateArea(): number {
        return Math.PI * this.radius * this.radius;
    }
}

class Rectangle extends Shape {
    constructor(public width: number, public height: number) {
        super("長方形");
    }

    calculateArea(): number {
        return this.width * this.height;
    }
}

const circle = new Circle(5);
circle.describe(); // "これは円です。面積は78.53981633974483です。"

const rectangle = new Rectangle(10, 5);
rectangle.describe(); // "これは長方形です。面積は50です。"
```

---

## 継承

### 基本的な継承

```typescript
class Animal {
    constructor(public name: string) {}

    move(distance: number = 0): void {
        console.log(`${this.name}が${distance}m移動しました。`);
    }

    makeSound(): void {
        console.log("何か音を立てています");
    }
}

class Dog extends Animal {
    constructor(name: string, public breed: string) {
        super(name); // 親クラスのコンストラクタを呼び出す
    }

    // メソッドのオーバーライド
    makeSound(): void {
        console.log("ワンワン！");
    }

    // 子クラス独自のメソッド
    fetch(): void {
        console.log(`${this.name}がボールを取ってきました。`);
    }
}

class Cat extends Animal {
    makeSound(): void {
        console.log("ニャー！");
    }

    climb(): void {
        console.log(`${this.name}が木に登りました。`);
    }
}

const dog = new Dog("ポチ", "柴犬");
dog.makeSound(); // "ワンワン！"
dog.move(10); // "ポチが10m移動しました。"
dog.fetch(); // "ポチがボールを取ってきました。"

const cat = new Cat("タマ");
cat.makeSound(); // "ニャー！"
cat.climb(); // "タマが木に登りました。"
```

### super キーワード

```typescript
class Employee {
    constructor(public name: string, public salary: number) {}

    getAnnualBonus(): number {
        return this.salary * 0.1;
    }
}

class Manager extends Employee {
    constructor(name: string, salary: number, public department: string) {
        super(name, salary);
    }

    // 親クラスのメソッドをオーバーライド
    getAnnualBonus(): number {
        // super を使って親クラスのメソッドを呼び出す
        const baseBonus = super.getAnnualBonus();
        return baseBonus * 2; // マネージャーは2倍のボーナス
    }

    introduce(): void {
        console.log(`私は${this.department}の${this.name}です。`);
    }
}

const manager = new Manager("佐藤", 5000000, "営業部");
console.log(manager.getAnnualBonus()); // 1000000
manager.introduce(); // "私は営業部の佐藤です。"
```

### インターフェースの実装

```typescript
interface Flyable {
    fly(): void;
    altitude: number;
}

interface Swimmable {
    swim(): void;
}

class Duck implements Flyable, Swimmable {
    altitude: number = 0;

    fly(): void {
        this.altitude = 100;
        console.log(`空を飛んでいます（高度: ${this.altitude}m）`);
    }

    swim(): void {
        console.log("水面を泳いでいます");
    }
}

class Airplane implements Flyable {
    altitude: number = 0;

    fly(): void {
        this.altitude = 10000;
        console.log(`飛行中（高度: ${this.altitude}m）`);
    }
}

const duck = new Duck();
duck.fly(); // "空を飛んでいます（高度: 100m）"
duck.swim(); // "水面を泳いでいます"
```

---

## ジェネリクス

型を抽象化して再利用可能なコンポーネントを作成します。

### 基本的なジェネリクス

```typescript
// ジェネリック関数
function identity<T>(arg: T): T {
    return arg;
}

let output1 = identity<string>("hello"); // output1 は string 型
let output2 = identity<number>(42); // output2 は number 型
let output3 = identity("world"); // 型推論で string 型
```

### ジェネリッククラス

```typescript
class Box<T> {
    private contents: T;

    constructor(value: T) {
        this.contents = value;
    }

    getContents(): T {
        return this.contents;
    }

    setContents(value: T): void {
        this.contents = value;
    }
}

const numberBox = new Box<number>(123);
console.log(numberBox.getContents()); // 123

const stringBox = new Box<string>("hello");
console.log(stringBox.getContents()); // "hello"

// numberBox.setContents("world"); // エラー: 型が一致しない
```

### ジェネリックインターフェース

```typescript
interface Repository<T> {
    items: T[];
    add(item: T): void;
    remove(item: T): void;
    find(predicate: (item: T) => boolean): T | undefined;
}

class UserRepository implements Repository<User> {
    items: User[] = [];

    add(user: User): void {
        this.items.push(user);
    }

    remove(user: User): void {
        const index = this.items.indexOf(user);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    find(predicate: (user: User) => boolean): User | undefined {
        return this.items.find(predicate);
    }
}
```

### ジェネリック制約

```typescript
// T は length プロパティを持つ型でなければならない
interface Lengthwise {
    length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
    console.log(arg.length);
}

logLength("hello"); // 5
logLength([1, 2, 3]); // 3
logLength({ length: 10, value: 3 }); // 10
// logLength(123); // エラー: number には length がない
```

### 複数の型パラメータ

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
    return [first, second];
}

const result1 = pair<string, number>("age", 25);
const result2 = pair("name", true); // 型推論

// キーバリューペア
class KeyValuePair<K, V> {
    constructor(public key: K, public value: V) {}

    display(): void {
        console.log(`${this.key}: ${this.value}`);
    }
}

const pair1 = new KeyValuePair<string, number>("age", 30);
pair1.display(); // "age: 30"
```

---

## 型アサーション

開発者が型システムに対して「この型だと確信している」と伝える方法です。

### as 構文

```typescript
let someValue: unknown = "this is a string";

// unknown 型を string 型として扱う
let strLength: number = (someValue as string).length;

// DOM要素の型アサーション
const inputElement = document.getElementById("username") as HTMLInputElement;
inputElement.value = "太郎";
```

### 山括弧構文

```typescript
let someValue: unknown = "this is a string";
let strLength: number = (<string>someValue).length;

// 注意: JSX/TSX では as 構文を使う（山括弧構文は使えない）
```

### const アサーション

```typescript
// リテラル型として推論される
const colors = ["red", "green", "blue"] as const;
// colors の型: readonly ["red", "green", "blue"]

// colors.push("yellow"); // エラー: 読み取り専用

// オブジェクトの const アサーション
const config = {
    host: "localhost",
    port: 8080
} as const;
// config の型: { readonly host: "localhost"; readonly port: 8080; }
```

### Non-null アサーション演算子

```typescript
function processValue(value: string | null): void {
    // ! を使って null でないことを宣言
    console.log(value!.toUpperCase());
}

// DOM 要素（null の可能性がある）
const element = document.getElementById("myElement")!;
element.textContent = "Hello";
```

---

## 型ガード

実行時に型を絞り込む仕組みです。

### typeof 型ガード

```typescript
function printValue(value: string | number): void {
    if (typeof value === "string") {
        // この分岐内では value は string 型
        console.log(value.toUpperCase());
    } else {
        // この分岐内では value は number 型
        console.log(value.toFixed(2));
    }
}
```

### instanceof 型ガード

```typescript
class Bird {
    fly(): void {
        console.log("飛んでいます");
    }
}

class Fish {
    swim(): void {
        console.log("泳いでいます");
    }
}

function move(animal: Bird | Fish): void {
    if (animal instanceof Bird) {
        animal.fly();
    } else {
        animal.swim();
    }
}
```

### in 型ガード

```typescript
interface Car {
    drive(): void;
}

interface Boat {
    sail(): void;
}

function operate(vehicle: Car | Boat): void {
    if ("drive" in vehicle) {
        vehicle.drive();
    } else {
        vehicle.sail();
    }
}
```

### カスタム型ガード

```typescript
interface Dog {
    bark(): void;
}

interface Cat {
    meow(): void;
}

// 型述語（type predicate）を使用
function isDog(animal: Dog | Cat): animal is Dog {
    return (animal as Dog).bark !== undefined;
}

function makeSound(animal: Dog | Cat): void {
    if (isDog(animal)) {
        animal.bark();
    } else {
        animal.meow();
    }
}
```

---

## 列挙型（Enum）

関連する定数をグループ化します。

### 数値列挙型

```typescript
enum Direction {
    Up,      // 0
    Down,    // 1
    Left,    // 2
    Right    // 3
}

let dir: Direction = Direction.Up;
console.log(dir); // 0

// 初期値を指定
enum Status {
    Pending = 1,
    InProgress = 2,
    Completed = 3
}
```

### 文字列列挙型

```typescript
enum Color {
    Red = "RED",
    Green = "GREEN",
    Blue = "BLUE"
}

let favoriteColor: Color = Color.Red;
console.log(favoriteColor); // "RED"

// 実用例
enum LogLevel {
    Debug = "DEBUG",
    Info = "INFO",
    Warning = "WARNING",
    Error = "ERROR"
}

function log(level: LogLevel, message: string): void {
    console.log(`[${level}] ${message}`);
}

log(LogLevel.Info, "アプリケーション起動"); // "[INFO] アプリケーション起動"
```

### const enum

コンパイル時にインライン化されます。

```typescript
const enum HttpStatus {
    OK = 200,
    BadRequest = 400,
    NotFound = 404,
    InternalServerError = 500
}

let status = HttpStatus.OK; // コンパイル後は 200 に置換される
```

---

## 非同期処理

### Promise

```typescript
// Promise を返す関数
function fetchData(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (url) {
                resolve(`Data from ${url}`);
            } else {
                reject("URL is required");
            }
        }, 1000);
    });
}

// Promise の使用
fetchData("https://api.example.com")
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error(error);
    });
```

### async / await

```typescript
async function getData(url: string): Promise<string> {
    try {
        const data = await fetchData(url);
        console.log(data);
        return data;
    } catch (error) {
        console.error("エラーが発生しました:", error);
        throw error;
    }
}

// 複数の非同期処理
async function fetchMultipleData(): Promise<void> {
    try {
        const [data1, data2, data3] = await Promise.all([
            fetchData("url1"),
            fetchData("url2"),
            fetchData("url3")
        ]);
        console.log(data1, data2, data3);
    } catch (error) {
        console.error(error);
    }
}
```

### 型定義付き非同期処理

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

async function fetchUser(id: number): Promise<User> {
    const response = await fetch(`https://api.example.com/users/${id}`);
    if (!response.ok) {
        throw new Error("ユーザーの取得に失敗しました");
    }
    const user: User = await response.json();
    return user;
}

// 使用例
async function displayUser(id: number): Promise<void> {
    try {
        const user = await fetchUser(id);
        console.log(`名前: ${user.name}, メール: ${user.email}`);
    } catch (error) {
        console.error(error);
    }
}
```

---

## モジュール

### エクスポート

```typescript
// math.ts

// 名前付きエクスポート
export function add(a: number, b: number): number {
    return a + b;
}

export function subtract(a: number, b: number): number {
    return a - b;
}

export const PI = 3.14159;

// クラスのエクスポート
export class Calculator {
    multiply(a: number, b: number): number {
        return a * b;
    }
}

// デフォルトエクスポート
export default class MathUtil {
    static square(n: number): number {
        return n * n;
    }
}
```

### インポート

```typescript
// app.ts

// 名前付きインポート
import { add, subtract, PI } from "./math";

console.log(add(5, 3)); // 8
console.log(PI); // 3.14159

// 全てをインポート
import * as MathFunctions from "./math";

console.log(MathFunctions.add(10, 5)); // 15

// デフォルトインポート
import MathUtil from "./math";

console.log(MathUtil.square(4)); // 16

// デフォルトと名前付きを同時にインポート
import MathUtil, { add, Calculator } from "./math";
```

### 型のみのインポート/エクスポート

```typescript
// types.ts
export interface User {
    id: number;
    name: string;
}

export type Status = "active" | "inactive";

// app.ts
import type { User, Status } from "./types";

// 型としてのみ使用
const user: User = { id: 1, name: "太郎" };
const status: Status = "active";
```

---

## ユーティリティ型

TypeScriptが提供する便利な型変換ツールです。

### Partial<T>

すべてのプロパティをオプショナルにします。

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

// すべてのプロパティがオプショナルになる
type PartialUser = Partial<User>;

function updateUser(id: number, updates: Partial<User>): void {
    // name だけ更新、email だけ更新などが可能
    console.log(`ユーザー ${id} を更新:`, updates);
}

updateUser(1, { name: "新しい名前" });
updateUser(2, { email: "new@example.com" });
```

### Required<T>

すべてのプロパティを必須にします。

```typescript
interface Config {
    host?: string;
    port?: number;
}

type RequiredConfig = Required<Config>;

// すべてのプロパティが必須
const config: RequiredConfig = {
    host: "localhost",
    port: 8080
};
```

### Readonly<T>

すべてのプロパティを読み取り専用にします。

```typescript
interface Point {
    x: number;
    y: number;
}

const point: Readonly<Point> = { x: 10, y: 20 };

// point.x = 5; // エラー: 読み取り専用
```

### Record<K, T>

キーと値の型を指定してオブジェクト型を作成します。

```typescript
type PageInfo = {
    title: string;
    url: string;
};

type Pages = "home" | "about" | "contact";

const pages: Record<Pages, PageInfo> = {
    home: { title: "ホーム", url: "/" },
    about: { title: "私たちについて", url: "/about" },
    contact: { title: "お問い合わせ", url: "/contact" }
};
```

### Pick<T, K>

指定したプロパティのみを持つ型を作成します。

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    password: string;
}

// id と name のみを持つ型
type UserPreview = Pick<User, "id" | "name">;

const preview: UserPreview = {
    id: 1,
    name: "太郎"
    // email と password は不要
};
```

### Omit<T, K>

指定したプロパティを除外した型を作成します。

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    password: string;
}

// password を除外
type UserWithoutPassword = Omit<User, "password">;

const user: UserWithoutPassword = {
    id: 1,
    name: "太郎",
    email: "taro@example.com"
    // password は含まれない
};
```

### Exclude<T, U>

ユニオン型から特定の型を除外します。

```typescript
type AllStatus = "pending" | "approved" | "rejected" | "cancelled";

// "cancelled" を除外
type ActiveStatus = Exclude<AllStatus, "cancelled">;
// 結果: "pending" | "approved" | "rejected"
```

### Extract<T, U>

ユニオン型から特定の型のみを抽出します。

```typescript
type AllStatus = "pending" | "approved" | "rejected" | "cancelled";

// "approved" と "rejected" のみを抽出
type FinalStatus = Extract<AllStatus, "approved" | "rejected">;
// 結果: "approved" | "rejected"
```

### NonNullable<T>

null と undefined を除外します。

```typescript
type MaybeString = string | null | undefined;

type DefiniteString = NonNullable<MaybeString>;
// 結果: string
```

### ReturnType<T>

関数の戻り値の型を取得します。

```typescript
function createUser(name: string, age: number) {
    return {
        name,
        age,
        createdAt: new Date()
    };
}

type User = ReturnType<typeof createUser>;
// 結果: { name: string; age: number; createdAt: Date }
```

### Parameters<T>

関数のパラメータの型をタプルとして取得します。

```typescript
function add(a: number, b: number): number {
    return a + b;
}

type AddParams = Parameters<typeof add>;
// 結果: [a: number, b: number]

function callAdd(...args: AddParams): number {
    return add(...args);
}
```

---

## まとめ

このガイドでは、TypeScriptの主要な機能をカバーしました：

1. **基本型**: string, number, boolean, any, unknown, void, never
2. **配列とタプル**: 配列の型定義、固定長タプル
3. **オブジェクト型**: オブジェクトリテラル、インデックスシグネチャ
4. **関数**: 型付き関数、オプショナル/デフォルトパラメータ、オーバーロード
5. **ユニオン/インターセクション型**: 複数の型の組み合わせ
6. **型エイリアス**: 型に名前をつけて再利用
7. **インターフェース**: オブジェクト構造の定義、拡張
8. **クラス**: プロパティ、メソッド、アクセス修飾子
9. **継承**: クラスの拡張、メソッドのオーバーライド
10. **ジェネリクス**: 型の抽象化と再利用
11. **型アサーション**: 型システムへの明示的な指示
12. **型ガード**: 実行時の型の絞り込み
13. **列挙型**: 関連する定数のグループ化
14. **非同期処理**: Promise, async/await
15. **モジュール**: コードの分割と再利用
16. **ユーティリティ型**: 型変換のためのヘルパー

### 次のステップ

- 実際のプロジェクトで TypeScript を使ってみる
- tsconfig.json の設定を学ぶ
- 型定義ファイル (.d.ts) について学ぶ
- フレームワーク（React, Vue, Angular等）と TypeScript の統合
- デコレータの使用方法
- 高度な型操作（Mapped Types, Conditional Types等）

TypeScript を習得することで、より安全で保守性の高いコードを書けるようになります。
