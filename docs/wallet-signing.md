# Wallet データ署名ガイド

## 概要

Midnight Walletは、CIP-30プロトコルに準拠した`signData`メソッドを提供し、任意のデータに署名する機能を実装しています。この機能は、CIP-0008（Message Signing）仕様に基づいており、DAppがユーザーのウォレットを使用してデータに署名し、認証やメッセージの検証を行うことができます。

## ブラウザのLace Walletから署名する手順（完全ガイド）

このセクションでは、ブラウザ環境でLace Walletを使用してデータに署名するための**必要な要素と手順**を網羅的に説明します。

### 必要な要素

#### 1. 環境要件

* **ブラウザ**: Chrome、Edge、BraveなどのChromiumベースのブラウザ（推奨）
* **Lace Wallet拡張機能**: Chrome Web Storeからインストール
  * Midnight Network対応版: [Lace Wallet - Midnight Preview](https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg)
* **HTTPS環境**: 本番環境ではHTTPSが必要（ローカル開発では`http://localhost`も可）

#### 2. 必要なパッケージ

`signData`メソッドを使用するために、**追加のnpmパッケージは不要**です。Lace Wallet拡張機能がブラウザの`window`オブジェクトにAPIを注入するため、純粋なJavaScriptでも使用できます。

ただし、TypeScriptを使用する場合や、Reactアプリケーションで開発する場合は、以下のパッケージが必要です：

##### 最小構成（Vanilla JavaScript）

パッケージは不要です。ブラウザの`window`オブジェクトを直接使用します。

```html
<!DOCTYPE html>
<html>
<head>
  <title>Lace Wallet Signing</title>
</head>
<body>
  <script>
    // window.cardano.lace または window.midnight.mnLace を直接使用
    async function signData() {
      if (window.cardano?.lace) {
        const api = await window.cardano.lace.enable();
        const address = (await api.getUsedAddresses())[0];
        const result = await api.signData(address, "0x48656c6c6f");
        console.log("Signature:", result.signature);
      }
    }
  </script>
</body>
</html>
```

##### TypeScriptプロジェクト

TypeScriptを使用する場合は、型定義が必要です。

```bash
# TypeScriptのインストール
npm install -D typescript @types/node

# または、プロジェクトで既にTypeScriptを使用している場合
# 追加のパッケージは不要
```

型定義は、プロジェクト内で定義するか、以下のように`window`オブジェクトを拡張します：

```typescript
// types/wallet-types.ts
interface CardanoWindow extends Window {
  cardano?: {
    lace?: {
      enable: () => Promise<Cip30WalletApi>;
      isEnabled: () => Promise<boolean>;
      apiVersion: string;
      name: string;
      icon: string;
    };
  };
  midnight?: {
    mnLace?: {
      enable: () => Promise<any>;
      isEnabled: () => Promise<boolean>;
    };
  };
}

declare const window: CardanoWindow;
```

##### Reactプロジェクト

Reactアプリケーションで使用する場合：

```bash
# ReactとTypeScriptの基本パッケージ
npm install react react-dom
npm install -D @types/react @types/react-dom typescript

# ビルドツール（Viteを使用する場合）
npm install -D vite @vitejs/plugin-react
```

**package.jsonの例**:

```json
{
  "name": "lace-wallet-signing-example",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
```

##### オプショナルパッケージ

以下のパッケージは、署名機能自体には不要ですが、プロジェクトによっては有用です：

* **CBORデコーダー**: 署名結果をデコードする場合
  ```bash
  npm install cbor
  ```

* **Bech32エンコーダー/デコーダー**: アドレスの処理に使用
  ```bash
  npm install bech32
  ```

* **Midnight Network SDK**: Midnight Network固有の機能を使用する場合
  ```bash
  npm install @midnight-ntwrk/midnight-js-types
  ```

**注意**: `signData`メソッド自体は、これらのパッケージなしでも動作します。署名結果は既にCBORエンコードされたHEX文字列として返されるため、デコードが必要な場合のみ追加のパッケージが必要です。

#### 3. 型定義

```typescript
// ウォレット名の型定義
type WalletName = "lace" | "yoroi" | "eternl";

// CIP-30 Wallet APIの型定義
interface Cip30WalletApi {
  getUsedAddresses: () => Promise<string[]>;
  getUnusedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  getBalance: () => Promise<string>;
  signData?: (address: string, payload: string) => Promise<DataSignature>;
}

// データ署名の戻り値
type DataSignature = {
  signature: string;  // CBORエンコードされたCOSE_Sign1構造（HEX文字列）
  key: string;       // CBORエンコードされたCOSE_Key構造（HEX文字列）
};

// Cardano Window拡張
interface CardanoWindow extends Window {
  cardano?: {
    lace?: CardanoWalletProvider;
    yoroi?: CardanoWalletProvider;
    eternl?: CardanoWalletProvider;
  };
  midnight?: {
    mnLace?: {
      enable: () => Promise<any>;
      isEnabled: () => Promise<boolean>;
    };
  };
}

// ウォレットプロバイダー
interface CardanoWalletProvider {
  enable: () => Promise<Cip30WalletApi>;
  isEnabled: () => Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
}
```

### 手順1: Lace Walletの検出

ブラウザにLace Walletがインストールされているか確認します。

```typescript
function isLaceWalletInstalled(): boolean {
  const windowObj = window as CardanoWindow;
  
  // 通常のCIP-30ウォレットをチェック
  if (windowObj.cardano?.lace) {
    return true;
  }
  
  // Midnight Network専用APIをチェック
  if (windowObj.midnight?.mnLace) {
    return true;
  }
  
  return false;
}

// 使用例
if (!isLaceWalletInstalled()) {
  alert("Lace Walletがインストールされていません。");
  // インストールページにリダイレクト
  window.open("https://www.lace.io/", "_blank");
}
```

### 手順2: ウォレットへの接続

Lace Walletに接続し、APIを取得します。

```typescript
async function connectLaceWallet(): Promise<Cip30WalletApi> {
  const windowObj = window as CardanoWindow;
  
  // 方法1: 通常のCIP-30 APIを使用（Cardano/Midnight両対応）
  if (windowObj.cardano?.lace) {
    const provider = windowObj.cardano.lace;
    
    try {
      // ウォレットを有効化
      const api = await provider.enable();
      
      if (!api) {
        throw new Error("Failed to enable Lace Wallet API");
      }
      
      return api;
    } catch (error) {
      if (error instanceof Error) {
        // ユーザーが接続を拒否した場合
        if (
          error.message.includes("reject") ||
          error.message.includes("denied") ||
          error.message.includes("cancel")
        ) {
          throw new Error("User rejected the connection request");
        }
      }
      throw error;
    }
  }
  
  // 方法2: Midnight Network専用APIを使用
  if (windowObj.midnight?.mnLace) {
    try {
      const api = await windowObj.midnight.mnLace.enable();
      
      // Midnight APIはCIP-30互換でない場合があるため、アダプターが必要
      return createMidnightLaceAdapter(api);
    } catch (error) {
      throw new Error(`Failed to connect to Midnight Lace Wallet: ${error}`);
    }
  }
  
  throw new Error("Lace Wallet is not installed");
}

// Midnight Lace Wallet APIをCIP-30互換に変換するアダプター
function createMidnightLaceAdapter(api: any): Cip30WalletApi {
  const getAddressFromState = async (): Promise<string> => {
    if (typeof api.state === "function") {
      const state = await api.state();
      if (state?.address) {
        return state.address;
      }
    }
    throw new Error("Could not get address from Midnight Lace Wallet API");
  };
  
  return {
    getUsedAddresses: async () => {
      const address = await getAddressFromState();
      return [address];
    },
    getUnusedAddresses: async () => {
      const address = await getAddressFromState();
      return [address];
    },
    getChangeAddress: async () => {
      return await getAddressFromState();
    },
    getBalance: async () => {
      // Midnight APIでは残高を直接取得できない場合がある
      return "0";
    },
    signData: api.sign ? async (address: string, payload: string) => {
      if (typeof api.sign === "function") {
        return await api.sign(payload);
      }
      throw new Error("sign method is not available");
    } : undefined,
  };
}
```

### 手順3: アドレスの取得

接続後、署名に使用するアドレスを取得します。

```typescript
async function getSigningAddress(api: Cip30WalletApi): Promise<string> {
  try {
    // 方法1: 使用済みアドレスを取得
    const usedAddresses = await api.getUsedAddresses();
    if (usedAddresses && usedAddresses.length > 0) {
      return usedAddresses[0];
    }
  } catch (error) {
    console.warn("getUsedAddresses failed, trying alternative methods", error);
  }
  
  try {
    // 方法2: 未使用アドレスを取得
    const unusedAddresses = await api.getUnusedAddresses();
    if (unusedAddresses && unusedAddresses.length > 0) {
      return unusedAddresses[0];
    }
  } catch (error) {
    console.warn("getUnusedAddresses failed, trying change address", error);
  }
  
  try {
    // 方法3: お釣りアドレスを取得
    const changeAddress = await api.getChangeAddress();
    if (changeAddress) {
      return changeAddress;
    }
  } catch (error) {
    console.warn("getChangeAddress failed", error);
  }
  
  throw new Error("No addresses found in wallet");
}
```

### 手順4: ペイロードの準備

署名するデータをHEX形式に変換します。

```typescript
function preparePayload(data: string): string {
  // 既にHEX形式の場合（0xプレフィックス付き）
  if (data.startsWith("0x")) {
    return data;
  }
  
  // HEX形式かどうかをチェック（0-9a-fA-Fのみ）
  if (/^[0-9a-fA-F]+$/.test(data)) {
    return `0x${data}`;
  }
  
  // 文字列をHEXに変換
  const hexPayload = Array.from(data)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  
  return `0x${hexPayload}`;
}

// 使用例
const message = "Hello, Midnight Network!";
const hexPayload = preparePayload(message);
// 結果: "0x48656c6c6f2c204d69646e69676874204e6574776f726b21"
```

### 手順5: データに署名

`signData`メソッドを使用してデータに署名します。

```typescript
async function signDataWithLace(
  api: Cip30WalletApi,
  address: string,
  payload: string
): Promise<DataSignature> {
  // signDataメソッドが利用可能か確認
  if (!api.signData) {
    throw new Error("Lace Wallet does not support signData");
  }
  
  // ペイロードを準備
  const hexPayload = preparePayload(payload);
  
  try {
    // 署名を実行
    const result = await api.signData(address, hexPayload);
    
    // 結果の検証
    if (!result || !result.signature || !result.key) {
      throw new Error("Invalid signature result");
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error) {
      // CIP-30のエラーコードをチェック
      if ((error as any).code === -3) {
        throw new Error("User refused to sign the data");
      }
      
      // エラーメッセージから拒否を検出
      if (
        error.message.includes("reject") ||
        error.message.includes("denied") ||
        error.message.includes("cancel")
      ) {
        throw new Error("User rejected the signing request");
      }
    }
    
    throw new Error(`Failed to sign data: ${error}`);
  }
}
```

### 手順6: 完全な実装例

すべての手順を統合した完全な実装例です。

```typescript
async function completeSigningFlow(message: string): Promise<DataSignature> {
  try {
    // ステップ1: Lace Walletがインストールされているか確認
    if (!isLaceWalletInstalled()) {
      throw new Error("Lace Wallet is not installed");
    }
    
    // ステップ2: ウォレットに接続
    console.log("Connecting to Lace Wallet...");
    const api = await connectLaceWallet();
    console.log("Connected successfully");
    
    // ステップ3: アドレスを取得
    console.log("Getting address...");
    const address = await getSigningAddress(api);
    console.log("Address:", address);
    
    // ステップ4: ペイロードを準備
    const hexPayload = preparePayload(message);
    console.log("Payload (hex):", hexPayload);
    
    // ステップ5: データに署名
    console.log("Requesting signature...");
    const signature = await signDataWithLace(api, address, hexPayload);
    console.log("Signature received:", signature);
    
    return signature;
  } catch (error) {
    console.error("Signing failed:", error);
    throw error;
  }
}

// 使用例
completeSigningFlow("Hello, Midnight Network!")
  .then((result) => {
    console.log("Signature:", result.signature);
    console.log("Key:", result.key);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
```

### Reactコンポーネントでの実装例

Reactアプリケーションでの実装例です。

```typescript
import { useState, useEffect } from "react";

function LaceWalletSigner() {
  const [api, setApi] = useState<Cip30WalletApi | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [signature, setSignature] = useState<DataSignature | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  // ウォレットに接続
  const handleConnect = async () => {
    try {
      setLoading(true);
      setError("");
      
      const walletApi = await connectLaceWallet();
      const walletAddress = await getSigningAddress(walletApi);
      
      setApi(walletApi);
      setAddress(walletAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };
  
  // データに署名
  const handleSign = async () => {
    if (!api || !address || !message.trim()) {
      setError("Please connect wallet and enter a message");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const result = await signDataWithLace(api, address, message);
      setSignature(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signing failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Lace Wallet Signer</h2>
      
      {!api ? (
        <div>
          <button onClick={handleConnect} disabled={loading}>
            {loading ? "Connecting..." : "Connect Lace Wallet"}
          </button>
        </div>
      ) : (
        <div>
          <p>Connected: {address}</p>
          
          <div>
            <label>
              Message to sign:
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message or hex data"
                rows={4}
              />
            </label>
          </div>
          
          <button onClick={handleSign} disabled={loading || !message.trim()}>
            {loading ? "Signing..." : "Sign Data"}
          </button>
          
          {signature && (
            <div>
              <h3>Signature</h3>
              <pre>{signature.signature}</pre>
              <h3>Key</h3>
              <pre>{signature.key}</pre>
            </div>
          )}
        </div>
      )}
      
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
```

### Lace Wallet固有の注意事項

1. **Midnight Network専用API**
   * Midnight Network用のLace Walletは、`window.midnight.mnLace`にアクセスします
   * CIP-30互換でない場合があるため、アダプターが必要な場合があります

2. **アドレスの形式**
   * Midnight Networkアドレスは`mn_shield-addr_test...`形式です
   * Cardanoアドレスは`addr1...`形式です

3. **signDataメソッドのサポート**
   * すべてのLace Walletバージョンが`signData`をサポートしているわけではありません
   * 使用前に`api.signData`の存在を確認してください

4. **ユーザーの同意**
   * 署名リクエストは、Lace Walletのポップアップでユーザーの承認が必要です
   * ユーザーが拒否した場合、エラーがスローされます

5. **エラーハンドリング**
   * CIP-30の標準エラーコード（`-1`から`-4`）を確認してください
   * エラーメッセージからも拒否を検出できます

### トラブルシューティング

#### 問題1: Lace Walletが見つからない

```typescript
// 解決策: ウォレットの検出を定期的に実行
useEffect(() => {
  const interval = setInterval(() => {
    if (isLaceWalletInstalled()) {
      // ウォレットが利用可能になった
      clearInterval(interval);
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

#### 問題2: 接続が拒否される

```typescript
// 解決策: ユーザーに明確なメッセージを表示
try {
  await connectLaceWallet();
} catch (error) {
  if (error.message.includes("reject") || error.message.includes("denied")) {
    alert("ウォレットへの接続が拒否されました。Lace Walletで接続を許可してください。");
  }
}
```

#### 問題3: signDataが未定義

```typescript
// 解決策: メソッドの存在確認と代替手段の提供
if (!api.signData) {
  alert("このLace WalletバージョンはsignDataをサポートしていません。");
  // 代替手段を提供するか、エラーを表示
}
```

## CIP-30 signData API

### メソッドシグネチャ

```typescript
api.signData(addr: Address, payload: Bytes): Promise<DataSignature>
```

### パラメータ

* **`addr`** (`Address`): 署名に使用するBech32m形式のアドレス（例: `addr1...` または `mn_shield-addr_test...`）
* **`payload`** (`Bytes`): 署名するデータ（HEX形式の文字列、`0x`プレフィックス付きまたはなし）。バイト列として扱われます。

### 戻り値

```typescript
type DataSignature = {| 
  signature: cbor<COSE_Sign1>,  // CBORエンコードされたCOSE_Sign1構造
  key: cbor<COSE_Key>,          // CBORエンコードされたCOSE_Key構造
|};
```

**注意**: `{|` と `|}` は、Flowの厳密なオブジェクト型を表します。TypeScriptでは通常のオブジェクト型として扱われます。

* **`signature`**: COSE\_Sign1構造がCBORエンコードされたバイト列（通常はHEX文字列として返される）
* **`key`**: COSE\_Key構造がCBORエンコードされたバイト列（署名に使用された公開鍵の情報を含む）

### 動作

1. ウォレットはユーザーに署名の許可を求めます
2. 署名するメッセージがユーザーに表示されます
3. 指定されたアドレスの支払いキー（payment key）を使用して署名が行われます
4. CIP-0008仕様に準拠したCOSE\_Sign1オブジェクトが返されます

## CIP-0008 メッセージ署名仕様

CIP-0008は、Cardanoエコシステムにおける標準的なメッセージ署名仕様です。Midnight Networkでもこの仕様が採用されています。

### COSE\_Sign1構造

署名は、COSE（CBOR Object Signing and Encryption）標準に基づいたCOSE\_Sign1構造として返されます：

```CBOR
COSE_Sign1 = [
    Headers,        // ヘッダー情報（アルゴリズム、キーIDなど）
    payload: bstr / nil,  // 署名するペイロード（バイト列、nilも可）
    signature: bstr // 署名データ
]
```

### ヘッダー情報

COSE\_Sign1の`Headers`は、以下の構造を持ちます：

```CBOR
Headers = (
    protected : empty_or_serialized_map,  // 署名に含まれる保護されたヘッダー
    unprotected : header_map            // 署名に含まれない保護されていないヘッダー
)
```

CIP-30の`signData`メソッドでは、以下のヘッダーが設定されます：

* **アルゴリズム**: Ed25519（EdDSA署名アルゴリズム）- protectedヘッダーに含まれる
* **キー**: 指定されたアドレスの支払いキー（payment key）が使用されます
* **アドレス**: オプションで、protectedヘッダーにアドレス情報が含まれる場合があります

### COSE\_Key構造

`DataSignature`の`key`フィールドは、COSE\_Key構造としてエンコードされます。この構造には、署名に使用された公開鍵の情報が含まれます。

## 実装例

### 基本的な使用例

```typescript
import type { Cip30WalletApi } from "../types/wallet-types";

async function signDataExample(walletApi: Cip30WalletApi, address: string) {
  // 署名するデータを準備（HEX形式）
  const payload = "0x48656c6c6f20576f726c64"; // "Hello World" in hex
  
  // signDataメソッドが利用可能か確認
  if (!walletApi.signData) {
    throw new Error("This wallet does not support signData");
  }
  
  try {
    // データに署名
    const result = await walletApi.signData(address, payload);
    
    console.log("Signature:", result.signature);
    console.log("Key:", result.key);
    
    return result;
  } catch (error) {
    console.error("Failed to sign data:", error);
    throw error;
  }
}
```

### 文字列をHEXに変換して署名

```typescript
async function signStringData(
  walletApi: Cip30WalletApi,
  address: string,
  message: string
) {
  // 文字列をHEX形式に変換
  const hexPayload =
    "0x" +
    Array.from(message)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
  
  if (!walletApi.signData) {
    throw new Error("This wallet does not support signData");
  }
  
  const result = await walletApi.signData(address, hexPayload);
  return result;
}
```

### エラーハンドリング

```typescript
async function signDataWithErrorHandling(
  walletApi: Cip30WalletApi,
  address: string,
  payload: string
) {
  // signDataメソッドのサポート確認
  if (!walletApi.signData) {
    throw new Error("This wallet does not support signData");
  }
  
  try {
    // HEX形式に変換（必要に応じて）
    let hexPayload = payload;
    if (!payload.startsWith("0x")) {
      hexPayload =
        "0x" +
        Array.from(payload)
          .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("");
    }
    
    const result = await walletApi.signData(address, hexPayload);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      // ユーザーが署名を拒否した場合
      if (
        error.message.includes("reject") ||
        error.message.includes("denied") ||
        error.message.includes("cancel")
      ) {
        throw new Error("User rejected the signing request");
      }
      // その他のエラー
      throw new Error(`Failed to sign data: ${error.message}`);
    }
    throw new Error("Unknown error occurred while signing data");
  }
}
```

## Reactコンポーネントでの使用例

プロジェクト内の`SignDataPanel`コンポーネントの実装例：

```typescript
import { useState } from "react";
import type { Cip30WalletApi } from "../types/wallet-types";

interface SignDataPanelProps {
  walletApi: Cip30WalletApi;
  address: string;
}

export function SignDataPanel({ walletApi, address }: SignDataPanelProps) {
  const [payload, setPayload] = useState<string>("");
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleSign = async () => {
    if (!payload.trim()) {
      setError("Please enter a payload to sign");
      return;
    }

    if (!walletApi.signData) {
      setError("This wallet does not support signData");
      return;
    }

    setSigning(true);
    setError("");
    setSignature(null);

    try {
      // Convert payload to hex if needed
      let hexPayload = payload;
      if (!payload.startsWith("0x")) {
        hexPayload =
          "0x" +
          Array.from(payload)
            .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");
      }

      const result = await walletApi.signData(address, hexPayload);
      setSignature(result.signature);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign data"
      );
    } finally {
      setSigning(false);
    }
  };

  return (
    <div>
      <h2>Sign Data</h2>
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        placeholder="0x1234... or plain text"
      />
      <button onClick={handleSign} disabled={signing || !payload.trim()}>
        {signing ? "Signing..." : "Sign Data"}
      </button>
      {signature && (
        <div>
          <h3>Signature</h3>
          <pre>{signature}</pre>
        </div>
      )}
      {error && (
        <div className="error">
          <pre>{error}</pre>
        </div>
      )}
    </div>
  );
}
```

## 使用ケース

### 1. 認証・ログイン

DAppへのログイン時に、ユーザーが特定のメッセージに署名することで、ウォレットの所有権を証明できます。

```typescript
async function authenticateUser(
  walletApi: Cip30WalletApi,
  address: string
) {
  const timestamp = Date.now();
  const message = `Sign in to MyDApp at ${timestamp}`;
  const hexMessage = "0x" + Array.from(message)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  
  const signature = await walletApi.signData(address, hexMessage);
  
  // バックエンドに送信して検証
  return await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      message,
      signature: signature.signature,
      key: signature.key,
    }),
  });
}
```

### 2. メッセージの検証

署名されたメッセージを検証することで、メッセージの真正性と送信者の身元を確認できます。

```typescript
async function verifyMessage(
  address: string,
  message: string,
  signature: string,
  key: string
) {
  // バックエンドでCOSE_Sign1を検証
  const response = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      message,
      signature,
      key,
    }),
  });
  
  return response.json();
}
```

### 3. トランザクションの承認

特定のトランザクションやアクションに対するユーザーの承認を取得するために使用できます。

```typescript
async function approveTransaction(
  walletApi: Cip30WalletApi,
  address: string,
  txHash: string
) {
  const approvalMessage = `Approve transaction: ${txHash}`;
  const hexMessage = "0x" + Array.from(approvalMessage)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  
  const signature = await walletApi.signData(address, hexMessage);
  return signature;
}
```

## 注意事項

### 1. オプショナルメソッド

`signData`はオプショナルメソッドです。すべてのウォレットがこの機能をサポートしているわけではありません。使用前に必ず存在確認を行ってください。

```typescript
if (!walletApi.signData) {
  // 代替手段を提供するか、エラーを表示
  console.warn("This wallet does not support signData");
}
```

### 2. ユーザーの同意

署名リクエストは、ユーザーがウォレット内で明示的に承認する必要があります。ユーザーが拒否した場合、エラーがスローされます。

### 3. ペイロードの形式

* HEX形式（`0x`プレフィックス付きまたはなし）が推奨されます
* 文字列をHEXに変換する場合は、UTF-8エンコーディングを使用してください
* バイナリデータを扱う場合は、適切にHEXエンコードしてください

### 4. セキュリティ

* 署名されたデータは、COSE\_Sign1構造として返されます
* 署名の検証は、バックエンドで行うことを推奨します
* 秘密鍵はウォレット内に保持され、DAppには公開されません

### 5. Midnight Network固有の考慮事項

Midnight Networkでは、以下の点に注意してください：

* Bech32m形式のアドレスを使用します（例: `mn_shield-addr_test...`）
* 一部のウォレット（Midnight Network専用API）では、異なる実装がある可能性があります
* アダプターパターンを使用して、異なるウォレットAPIを統一インターフェースで扱うことができます

### 6. Proof Serverについて

**重要**: `signData`メソッド自体は、Proof Serverを必要としません。`signData`はCIP-0008に基づいた標準的なメッセージ署名機能であり、ウォレットが直接処理します。

ただし、Midnight Networkでの開発全般では、以下の場合にProof Serverが必要になります：

1. **Midnight.jsを使用した直接的なコントラクト操作**
   * スマートコントラクトのデプロイや呼び出し
   * プライベートトランザクションの生成
   * ゼロ知識証明の生成が必要な操作

2. **Proof Serverのセットアップ**

```bash
# Proof Serverイメージをプル
docker pull midnightnetwork/proof-server:latest

# Proof Serverを起動（ポート6300で実行）
docker run -p 6300:6300 midnightnetwork/proof-server:latest -- 'midnight-proof-server --network testnet'
```

**注意事項**:

* Proof Serverは、Chrome拡張機能（Lace Wallet）がインストールされているのと同じマシンで実行する必要があります
* リモート開発マシンで実行すると、拡張機能との接続に問題が発生する可能性があります
* DApp Connector APIの`balanceAndProveTransaction()`メソッドを使用する場合、ウォレットが内部で証明生成を処理するため、ローカルのProof Serverは不要な場合があります

**`signData`メソッドとProof Serverの関係**:

* `signData`は単純なメッセージ署名であり、Proof Serverは不要です
* トランザクション署名（`signTx`）やコントラクト操作とは異なり、`signData`は標準的なEd25519署名を使用します
* 認証やメッセージ検証などの用途では、Proof Serverなしで動作します

## エラー処理

### 一般的なエラーケース

1. **ウォレットがsignDataをサポートしていない**
   ```typescript
   if (!walletApi.signData) {
     throw new Error("This wallet does not support signData");
   }
   ```

2. **ユーザーが署名を拒否**

   ```typescript
   try {
     await walletApi.signData(address, payload);
   } catch (error) {
     // CIP-30のAPIErrorをチェック
     if (error.code === -3) { // Refused
       // ユーザーが署名を拒否した場合の処理
       console.error("User refused to sign:", error.info);
     } else if (error.message.includes("reject") || 
                error.message.includes("denied") || 
                error.message.includes("cancel")) {
       // エラーメッセージから拒否を検出
       console.error("User rejected the signing request");
     }
   }
   ```

   **CIP-30のエラーコード**:

   * `-1` (InvalidRequest): 無効なリクエスト
   * `-2` (InternalError): 内部エラー
   * `-3` (Refused): ユーザーがリクエストを拒否
   * `-4` (AccountChange): アカウントが変更された

3. **無効なアドレス**
   ```typescript
   // アドレスの形式を検証
   if (!address.startsWith("mn_") && !address.startsWith("addr_")) {
     throw new Error("Invalid address format");
   }
   ```

4. **無効なペイロード**
   ```typescript
   // HEX形式の検証
   if (!payload.match(/^(0x)?[0-9a-fA-F]+$/)) {
     throw new Error("Invalid hex payload format");
   }
   ```

## 関連リソース

### 公式ドキュメント

* [CIP-0030: Cardano dApp-Wallet Web Bridge](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0030/README.md)
* [CIP-0008: Message Signing](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0008/README.md)
* [Midnight Network Developer Hub](https://docs.midnight.network/)

### 参考実装

* [cardano-connect-with-wallet](https://github.com/cardano-foundation/cardano-connect-with-wallet) - CIP-30のリファレンス実装
* [Midnight.js SDK](https://www.npmjs.com/package/@midnight-network/midnight-js) - Midnight Network公式SDK

## まとめ

`signData`メソッドは、Midnight Network上でDAppがユーザーのウォレットを使用してデータに署名するための標準的な方法です。CIP-0008仕様に準拠しており、認証、メッセージ検証、トランザクション承認など、さまざまな用途に使用できます。

重要なポイント：

* オプショナルメソッドのため、使用前に存在確認が必要
* ユーザーの明示的な同意が必要
* HEX形式のペイロードを使用
* 適切なエラーハンドリングを実装
* セキュリティベストプラクティスに従う
