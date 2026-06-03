# Step 1 - ItemData、MerchantPool 與 Inventory API

## 目標

先補齊交易需要的資料與背包操作 API。  
這一步完成後，即使還沒有 NPC 與 UI，也應該能用程式測試「扣椰子、加商品」。

## 要修改 / 新增的 file

```text
assets/Scripts/Data/ItemData.ts
assets/Scripts/Data/MerchantPool.ts
assets/Scripts/Player/InventoryManager.ts
```

## File 修改目標

### `assets/Scripts/Data/ItemData.ts`

新增所有商品的基本資料。

```ts
export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    iconPath?: string;
}

export const ITEM_DATA: { [id: string]: ItemDefinition } = {
    coconut: { ... },
    potion: { ... },
    apple: { ... },
    ore: { ... },
    wood: { ... },
};

export function getItemDefinition(id: string): ItemDefinition | null;
```

### `assets/Scripts/Data/MerchantPool.ts`

先定義固定商品與未來隨機池需要的資料格式。

```ts
export interface MerchantStockItem {
    itemId: string;
    price: number;
    stock: number;
}

export interface MerchantPoolEntry {
    itemId: string;
    weight: number;
    price: number;
    minStock: number;
    maxStock: number;
}
```

先提供最小可測固定清單：

```ts
export function getDefaultMerchantStock(): MerchantStockItem[];
```

### `assets/Scripts/Player/InventoryManager.ts`

擴充：

```ts
getItemCount(id: string): number
hasItem(id: string, count: number): boolean
removeItem(id: string, count: number): boolean
addItem(id: string, name: string, count?: number, description?: string): boolean
```

規則：

- `removeItem()` 不可扣到負數。
- 數量歸零時移除該 item。
- 成功變動後 emit `INVENTORY_CHANGED`。
- `coconut` 先作為商店貨幣。

## 相依性

- 無前置依賴。
- Step 3 的 `MerchantNPC` 固定商品會使用 `getDefaultMerchantStock()`。
- Step 4 的 `MerchantShopUIController` 會使用 `getItemCount()` / `removeItem()` / `addItem()`。
- Step 5 會擴充 `MerchantPool` 的 weighted roll。

## 實作框架

```text
Merchant buy flow
  -> InventoryManager.hasItem("coconut", cost)
  -> InventoryManager.removeItem("coconut", cost)
  -> InventoryManager.addItem(itemId, itemName, amount, description)
```

## 驗證方式

- 背包加入 10 個 coconut。
- 購買價格 3 的商品，扣除後 coconut 剩 7。
- 商品數量 +1。
- coconut 不足時 `removeItem()` 回傳 false。
- Inventory UI 收到 `INVENTORY_CHANGED` 後刷新。
