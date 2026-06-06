import { EntityType } from "../Core/Constants";
import { getItemDefinition } from "../Data/ItemData";
import { getDefaultMerchantStock, MerchantStockItem, rollMerchantStock } from "../Data/MerchantPool";
import { InventoryManager } from "../Player/InventoryManager";
import NPC_AI, { NPCAttackType, NPCMoveMode } from "./NPC_AI";
import { DialogueContent, DialogueOptionId } from "./NPCDialogue";

const { ccclass, property } = cc._decorator;

export enum MerchantState {
    Wandering = 0,
    Talking = 1,
    Trading = 2,
    Leaving = 3
}

cc.Enum(MerchantState);

@ccclass
export default class MerchantNPC extends cc.Component {

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Boolean)
    public useRandomStock: boolean = true;

    @property(cc.Integer)
    public stockItemCount: number = 4;

    @property(cc.Float)
    public maxLifeTime: number = 180;

    @property(cc.Float)
    public noTradeDespawnTime: number = 60;

    public shopItems: MerchantStockItem[] = [];

    private npcAI: NPC_AI = null;
    private currentPlayer: cc.Node = null;
    private state: MerchantState = MerchantState.Wandering;
    private lifeTimer: number = 0;
    private noTradeTimer: number = 0;

    onLoad() {
        this.npcAI = this.getComponent(NPC_AI);
        if (!this.npcAI) {
            cc.warn(`[MerchantNPC] ${this.node.name} needs NPC_AI on the same node.`);
            return;
        }

        this.npcAI.type = EntityType.NPC_PEACE;
        this.npcAI.moveMode = NPCMoveMode.WANDER;
        this.npcAI.attackType = NPCAttackType.NONE;

        this.shopItems = this.createStock();
        this.logStock("loaded stock");
    }

    update(dt: number) {
        if (this.state === MerchantState.Leaving) {
            return;
        }

        if (this.state === MerchantState.Talking || this.state === MerchantState.Trading) {
            return;
        }

        this.lifeTimer += dt;
        this.noTradeTimer += dt;

        if (this.maxLifeTime > 0 && this.lifeTimer >= this.maxLifeTime) {
            this.log("leaving: max lifetime reached.");
            this.leave();
            return;
        }

        if (this.noTradeDespawnTime > 0 && this.noTradeTimer >= this.noTradeDespawnTime) {
            this.log("leaving: no trade timeout reached.");
            this.leave();
        }
    }

    public canInteract(player: cc.Node): boolean {
        return !!this.npcAI
            && this.state !== MerchantState.Leaving
            && this.npcAI.isPlayerInInteractRange(player);
    }

    public beginInteraction(player: cc.Node): void {
        if (!this.canInteract(player)) {
            this.log("cannot interact: player is too far or merchant is leaving.");
            return;
        }

        this.currentPlayer = player;
        this.state = MerchantState.Talking;
        this.noTradeTimer = 0;
        this.npcAI.beginTalk(player);
        this.log("interaction started. Next UI step should show dialogue options.");
    }

    public openTrade(): void {
        if (!this.npcAI || this.state === MerchantState.Leaving) {
            return;
        }

        this.state = MerchantState.Trading;
        this.noTradeTimer = 0;
        this.npcAI.beginTrading();
        this.logStock("trade opened");
    }

    public closeTrade(): void {
        if (!this.npcAI) {
            return;
        }

        this.state = MerchantState.Wandering;
        this.currentPlayer = null;
        this.noTradeTimer = 0;
        this.npcAI.endTrading();
        this.npcAI.endTalk();
        this.log("trade closed.");
    }

    public leave(): void {
        this.state = MerchantState.Leaving;
        this.currentPlayer = null;

        if (this.npcAI) {
            this.npcAI.endTrading();
            this.npcAI.endTalk();
            this.npcAI.stopMovement();
        }

        this.log("leaving.");
        this.node.destroy();
    }

    public buy(itemId: string, amount: number): boolean {
        if (this.state !== MerchantState.Trading) {
            this.log("buy failed: merchant is not trading.");
            return false;
        }

        if (amount <= 0) {
            return false;
        }

        const stockItem = this.shopItems.find(item => item.itemId === itemId);
        if (!stockItem || stockItem.stock < amount) {
            this.log(`buy failed: not enough merchant stock for ${itemId}.`);
            return false;
        }

        const itemDefinition = getItemDefinition(itemId);
        if (!itemDefinition) {
            this.log(`buy failed: unknown item ${itemId}.`);
            return false;
        }

        const cost = stockItem.price * amount;
        if (!InventoryManager.instance.hasItem("coconut", cost)) {
            this.log(`buy failed: need ${cost} coconut.`);
            return false;
        }

        if (!InventoryManager.instance.removeItem("coconut", cost)) {
            return false;
        }

        InventoryManager.instance.addItem(
            itemDefinition.id,
            amount
        );

        stockItem.stock -= amount;
        this.log(`bought ${itemDefinition.name} x${amount}, cost=${cost}, stockLeft=${stockItem.stock}`);
        return true;
    }

    public getShopItems(): MerchantStockItem[] {
        return this.shopItems;
    }

    public getState(): MerchantState {
        return this.state;
    }

    public isInteracting(): boolean {
        return this.state === MerchantState.Talking || this.state === MerchantState.Trading;
    }

    public isTrading(): boolean {
        return this.state === MerchantState.Trading;
    }

    public getDialogueContent(): DialogueContent {
        return {
            line: "Welcome, traveler.",
            options: [
                { id: DialogueOptionId.Trade, label: "Trade" },
                { id: DialogueOptionId.Chat, label: "Chat" },
                { id: DialogueOptionId.Leave, label: "Leave" }
            ]
        };
    }

    public getChatDialogueContent(): DialogueContent {
        return {
            line: "The road is quiet today.",
            options: [
                { id: DialogueOptionId.Trade, label: "Trade" },
                { id: DialogueOptionId.Chat, label: "Chat" },
                { id: DialogueOptionId.Leave, label: "Leave" }
            ]
        };
    }

    public handleDialogueOption(optionId: string, player: cc.Node): void {
        this.noTradeTimer = 0;
        this.currentPlayer = player;
        this.log(`dialogue option selected: ${optionId}`);
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[MerchantNPC] ${this.node.name}: ${message}`);
        }
    }

    private createStock(): MerchantStockItem[] {
        if (!this.useRandomStock) {
            return getDefaultMerchantStock();
        }

        const rolledStock = rollMerchantStock(this.stockItemCount);
        return rolledStock.length > 0 ? rolledStock : getDefaultMerchantStock();
    }

    private logStock(prefix: string): void {
        if (!this.debugLog) {
            return;
        }

        const stockText = this.shopItems
            .map(item => `${item.itemId}(price=${item.price}, stock=${item.stock})`)
            .join(", ");

        cc.log(`[MerchantNPC] ${this.node.name}: ${prefix}: ${stockText}`);
    }
}
