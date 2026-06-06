import { getItemDefinition } from "../Data/ItemData";

type IconCallback = (spriteFrame: cc.SpriteFrame | null) => void;

export default class ItemIconLoader {
    private static cache: { [itemId: string]: cc.SpriteFrame } = {};
    private static pending: { [itemId: string]: IconCallback[] } = {};

    public static load(itemId: string, callback: IconCallback): void {
        if (!itemId) {
            callback(null);
            return;
        }

        const cached = this.cache[itemId];
        if (cached) {
            callback(cached);
            return;
        }

        const definition = getItemDefinition(itemId);
        if (!definition || !definition.iconPath) {
            callback(null);
            return;
        }

        if (this.pending[itemId]) {
            this.pending[itemId].push(callback);
            return;
        }

        this.pending[itemId] = [callback];
        const path = definition.iconPath.replace(/\.(png|jpg|jpeg)$/i, "");
        cc.resources.load(path, cc.SpriteFrame, (error, asset) => {
            const callbacks = this.pending[itemId] || [];
            delete this.pending[itemId];

            let spriteFrame: cc.SpriteFrame = null;
            if (error) {
                cc.warn(`[ItemIconLoader] Cannot load ${itemId}: ${path}`);
            } else {
                spriteFrame = asset as cc.SpriteFrame;
                this.cache[itemId] = spriteFrame;
            }

            for (const pendingCallback of callbacks) {
                pendingCallback(spriteFrame);
            }
        });
    }

    public static apply(itemId: string, sprite: cc.Sprite): void {
        if (!sprite || !sprite.node || !cc.isValid(sprite.node)) {
            return;
        }

        const requestItemId = itemId;
        sprite.node.active = false;
        sprite.spriteFrame = null;
        (sprite.node as any).__craftingItemId = requestItemId;

        this.load(itemId, spriteFrame => {
            if (
                !sprite
                || !sprite.node
                || !cc.isValid(sprite.node)
                || (sprite.node as any).__craftingItemId !== requestItemId
            ) {
                return;
            }

            sprite.spriteFrame = spriteFrame;
            sprite.node.active = !!spriteFrame;
        });
    }
}

