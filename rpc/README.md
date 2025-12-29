# Midnight Network RPC CLI Tool

Midnight NetworkのRPCエンドポイントと対話するためのコマンドラインインターフェースツールです。

## インストール

```bash
cd rpc
bun install
```

## ビルド

```bash
bun run build
```

## 開発

### リントとフォーマット

このプロジェクトは[Biome](https://biomejs.dev/) v2を使用しています。

```bash
# リントチェック
bun run lint

# リントとフォーマットの自動修正
bun run lint:fix

# フォーマットのみ
bun run format

# 型チェック
bun run typecheck
```

## 使用方法

### 基本的な使い方

```bash
# ヘルプを表示
bun run dev --help

# 開発モードで実行
bun run dev -- <method> [options]

# ビルド後に実行
bun run build
bun run start -- <method> [options]
```

### グローバルオプション

* `-e, --endpoint <url>`: RPCエンドポイントURL（デフォルト: `https://rpc.testnet-02.midnight.network/`）
* `-t, --timeout <ms>`: リクエストタイムアウト（ミリ秒、デフォルト: 30000）
* `-h, --help`: ヘルプを表示
* `-V, --version`: バージョンを表示

### RPCメソッド

すべてのRPCメソッドは直接コマンドとして呼び出すことができます。

#### システム情報

```bash
# チェーン名を取得
bun run dev -- system_chain

# ノード名を取得
bun run dev -- system_name

# ノードバージョンを取得
bun run dev -- system_version

# ノードのヘルス状態を取得
bun run dev -- system_health

# 接続されているピアのリストを取得
bun run dev -- system_peers

# チェーンのプロパティを取得
bun run dev -- system_properties
```

#### ブロックチェーン情報

```bash
# ブロックのヘッダーとボディを取得
bun run dev -- chain_getBlock [hash]

# 特定のブロックのハッシュを取得
bun run dev -- chain_getBlockHash [blockNumber]

# 最終確定されたブロックのハッシュを取得
bun run dev -- chain_getFinalizedHead

# 特定のブロックのヘッダーを取得
bun run dev -- chain_getHeader [hash]
```

#### ストレージとランタイム状態

```bash
# ストレージエントリを取得
bun run dev -- state_getStorage --key <key> [--at <hash>]

# ランタイムメタデータを取得
bun run dev -- state_getMetadata [--at <hash>]

# ランタイムバージョンを取得
bun run dev -- state_getRuntimeVersion [--at <hash>]
```

#### RPCメソッド

```bash
# 利用可能なRPCメソッドのリストを取得
bun run dev -- rpc_methods
```

#### Midnight固有メソッド

```bash
# JSONエンコードされたコントラクト状態を取得
bun run dev -- midnight_jsonContractState --address <address> [--block <hash>]

# 生の（バイナリエンコードされた）コントラクト状態を取得
bun run dev -- midnight_contractState --address <address> [--block <hash>]

# 未請求トークンまたは報酬の額を取得
bun run dev -- midnight_unclaimedAmount --beneficiary <beneficiary> [--at <hash>]

# ZSwapチェーン状態を取得
bun run dev -- midnight_zswapChainState --address <address> [--block <hash>]

# サポートされているRPC APIバージョンのリストを取得
bun run dev -- midnight_apiVersions

# レジャーバージョンを取得
bun run dev -- midnight_ledgerVersion [--at <hash>]
```

### カスタムRPCコール

任意のRPCメソッドを呼び出すことができます:

```bash
bun run dev -- call --method <method> [--params <params>]
```

例:

```bash
# system_chainメソッドを呼び出す（パラメータなし）
bun run dev -- call --method system_chain --params "[]"

# パラメータ付きで呼び出す
bun run dev -- call --method midnight_jsonContractState --params '["contract_address"]'
```

## 使用例

### チェーン情報を取得

```bash
bun run dev -- system_chain
# 出力: "testnet-02-1"
```

### APIバージョンを取得

```bash
bun run dev -- midnight_apiVersions
# 出力: [2]
```

### コントラクト状態を取得

```bash
bun run dev -- midnight_jsonContractState --address "your_contract_address"
```

### トランザクション検索

```bash
# トランザクションハッシュで検索
bun run dev -- search-tx <transaction_hash>

# ブロック範囲を指定して検索
bun run dev -- search-tx <transaction_hash> --startBlock 1000 --endBlock 2000

# 最大検索ブロック数を指定
bun run dev -- search-tx <transaction_hash> --maxBlocks 500
```

### アカウントアドレスでトランザクション検索

```bash
# アカウントアドレスに関連するトランザクションを検索
bun run dev -- search-account <account_address>

# ブロック範囲を指定して検索
bun run dev -- search-account <account_address> --startBlock 1000 --endBlock 2000

# 最大検索ブロック数を指定（デフォルト: 100）
bun run dev -- search-account <account_address> --maxBlocks 200
```

### カスタムエンドポイントを使用

```bash
bun run dev -- --endpoint https://custom-endpoint.com system_chain
```

### ヘルプの表示

```bash
# メインコマンドのヘルプ
bun run dev --help

# 特定のメソッドのヘルプ
bun run dev -- system_chain --help
bun run dev -- midnight_jsonContractState --help
bun run dev -- search-tx --help
bun run dev -- search-account --help
```

## ドキュメント

* [RPC_API.md](./RPC_API.md) - 詳細なRPC APIリファレンス
* [INDEXER.md](./INDEXER.md) - Midnight Network Indexerについて

## ライセンス

Apache-2.0

