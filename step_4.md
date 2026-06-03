# Step 4 - 對話 UI 與商店 UI，做到可測交易

## 目標

把 Step 3 的互動入口接上 UI。  
完成後應能測完整交易：靠近商人、按 F、選交易、購買商品、更新背包。

## 要修改 / 新增的 file

```text
assets/Scripts/UI/DialogueUIController.ts
assets/Scripts/UI/MerchantShopUIController.ts
assets/Scripts/NPC/MerchantNPC.ts
assets/Scripts/Player/PlayerController.ts
assets/Scenes/Game.fire
```

## Dialogue UI 目標

### `DialogueUIController.ts`

UI 狀態：

```text
Hidden
Prompt
Options
```

欄位：

```ts
@property(cc.Node) promptNode
@property(cc.Label) promptLabel
@property(cc.Node) dialoguePanel
@property(cc.Label) dialogueLabel
@property([cc.Label]) optionLabels
```

方法：

```ts
showPrompt(text: string): void
hidePrompt(): void
showOptions(line: string, options: string[]): void
selectNext(): void
selectPrev(): void
getSelectedIndex(): number
hide(): void
```

輸入：

- 玩家接近商人：顯示「按F對話」。
- F：開 options。
- 滾輪：選 `[交易] [閒聊] [離開]`。
- F：確認目前選項。

## Shop UI 目標

### `MerchantShopUIController.ts`

欄位：

```ts
@property(cc.Node) root
@property(cc.Label) currencyLabel
@property(cc.Node) itemListRoot
@property(cc.Label) itemNameLabel
@property(cc.Label) descriptionLabel
@property(cc.Label) priceLabel
@property(cc.Label) stockLabel
@property(cc.Label) playerOwnedLabel
@property(cc.Label) buyAmountLabel
@property(cc.Button) buyButton
```

方法：

```ts
open(merchant: MerchantNPC): void
close(): void
refresh(): void
selectItem(index: number): void
increaseAmount(): void
decreaseAmount(): void
buySelected(): void
```

購買邏輯：

```text
cost = price * amount
canBuy = coconutCount >= cost && stock >= amount
```

買得起：

- button 正常顏色
- 可購買

買不起：

- button 灰色或暗色
- 不可購買

## MerchantNPC 目標

新增：

```ts
public getShopItems(): MerchantStockItem[]
public buy(itemId: string, amount: number): boolean
```

`buy()` 內部：

```text
檢查 stock
檢查玩家 coconut
InventoryManager.removeItem("coconut", cost)
InventoryManager.addItem(...)
stock -= amount
```

## PlayerController 目標

- F 在不同狀態下有不同作用：
  - 顯示 prompt 時：開始對話
  - options 開啟時：確認選項
  - shop 開啟時：可暫時不處理，或做關閉
- 滾輪傳給 `DialogueUIController`。
- 對話 / 商店打開時，暫停玩家攻擊或資源點擊互動。

## 相依性

- 依賴 Step 1 背包 API。
- 依賴 Step 2 `NPC_AI` 共用狀態。
- 依賴 Step 3 `MerchantNPC`。
- Step 5 之後會把固定商品換成隨機商品。

## 實作框架

```text
Player near merchant
  -> DialogueUI.showPrompt("按F對話")

F
  -> merchant.beginInteraction(player)
  -> DialogueUI.showOptions("旅人，要看看貨嗎？", ["交易", "閒聊", "離開"])

Select 交易
  -> MerchantShopUI.open(merchant)

Buy
  -> merchant.buy(itemId, amount)
  -> shop.refresh()
  -> InventoryUI refresh via INVENTORY_CHANGED
```

## 驗證方式

- 接近商人顯示 prompt。
- F 開對話。
- 滾輪切換選項。
- 選交易開商店。
- 商店顯示固定商品、價格、庫存、玩家持有數量、椰子數量。
- 買不起時按鈕變暗。
- 買得起時購買成功，背包更新。
