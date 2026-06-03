# Step 5 - MerchantPool 隨機商品池

## 目標

在 Step 4 固定商品交易可測後，把商人的商品清單改成從 `MerchantPool` weighted roll。

## 要修改 / 新增的 file

```text
assets/Scripts/Data/MerchantPool.ts
assets/Scripts/NPC/MerchantNPC.ts
```

## MerchantPool 修改目標

新增：

```ts
export interface MerchantRollContext {
    gameStage?: number;
    weather?: string;
    merchantTrait?: string;
}

export function rollMerchantStock(
    count: number,
    context?: MerchantRollContext
): MerchantStockItem[];
```

規則：

- 根據 `weight` 抽商品。
- 同一商品預設不重複。
- `stock` 從 `minStock` 到 `maxStock` 隨機。
- `price` 先使用 pool entry 固定價格。

## MerchantNPC 修改目標

新增 Inspector 欄位：

```ts
@property(cc.Integer)
stockItemCount: number = 4;

@property(cc.Boolean)
useRandomStock: boolean = true;
```

初始化：

```text
if useRandomStock:
  shopItems = rollMerchantStock(stockItemCount)
else:
  shopItems = getDefaultMerchantStock()
```

## 相依性

- 依賴 Step 1 的資料型別。
- 依賴 Step 3 / Step 4 的可交易流程。

## 驗證方式

- 每次重新進入場景或重生商人，商品清單有變化。
- 商品 stock 落在 min/max。
- 高 weight 商品較常出現。
- Shop UI 不需要修改也能顯示隨機商品。

## 選配擴充

之後可依照：

- 遊戲階段
- 天氣
- 商人屬性
- 玩家進度

調整：

- 商品是否出現
- weight
- price
- stock
- 商人對話內容
