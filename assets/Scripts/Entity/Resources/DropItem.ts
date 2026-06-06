const { ccclass, property } = cc._decorator;
import { InventoryManager } from '../../Player/InventoryManager';
import { getItemDefinition } from "../../Data/ItemData";

export enum ItemMode{
    Object = 0, // 物件模式：純物理，不可吸附，不可撿起
    Drop = 1, // 掉落物模式：可被吸附、收進背包
}

export enum ItemState {
    Flying = 0,
    Resting = 1,
    Attracting = 2,
    Held = 3,
}

@ccclass
export default class DropItem extends cc.Component {

    // @property({ tooltip: '道具名稱（存入背包用）' })
    // itemName: string = "Item";

    @property({ tooltip: '數量' })
    itemAmount: number = 1;

    @property({ tooltip: '吸引距離' })
    attractDistance: number = 56;

    @property({ tooltip: '收集距離' })
    collectDistance: number = 28;

    @property({ tooltip: '吸引速度' })
    attractSpeed: number = 220;

    @property({ tooltip: '發射速度（X軸）' })
    launchSpeedX: number = 120;

    @property({ tooltip: '發射速度（Y軸）' })
    launchSpeedY: number = 260;

    protected rb: cc.RigidBody = null!;
    protected collider: cc.PhysicsCollider = null!;
    private targetPlayer: cc.Node | null = null;
    protected state: ItemState = ItemState.Flying;
    protected mode: ItemMode = ItemMode.Drop;
    protected itemName: string = "Item";

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.collider = this.getComponent(cc.PhysicsCollider);

        if (this.rb) {
            this.rb.type = cc.RigidBodyType.Dynamic;
            this.rb.gravityScale = 1;
            this.rb.linearDamping = 2;
            this.rb.angularDamping = 8;
        }

        this.loadSprite();
    }

    private loadSprite() {
        const def = getItemDefinition(this.itemName);
        if (!def || !def.iconPath) return;

        // 自動去掉副檔名，避免有人填了 .png
        const path = def.iconPath.replace(/\.(png|jpg|jpeg)$/i, '');

        cc.resources.load(path, cc.SpriteFrame, (err, sf) => {
            if (err) {
                cc.warn(`[DropItem] 找不到 ${this.itemName} 的圖片，路徑: ${path}`);
                return;
            }
            const sprite = this.getComponent(cc.Sprite);
            if (sprite) {
                sprite.spriteFrame = sf as cc.SpriteFrame;
                cc.log(`[DropItem] ${this.itemName} 圖片載入成功`);
            }
        });
    }

    start() {
        this.launch();
    }

    public launch() {
        if (!this.rb) {
            return;
        }

        const direction = Math.random() < 0.5 ? -1 : 1;

        this.state = ItemState.Flying;
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale = 1;
        this.rb.linearVelocity = cc.v2(direction * this.launchSpeedX, this.launchSpeedY);
        this.rb.angularVelocity = 0;
        cc.log(`[DropItem] ${this.node.name} 發射中，方向=${direction > 0 ? '右' : '左'}`);
    }

    public placeAsObject(worldPos: cc.Vec2) {
        this.mode  = ItemMode.Object;
        this.state = ItemState.Flying; // 讓它自然落下

        if (this.node.parent) {
            this.node.setPosition(this.node.parent.convertToNodeSpaceAR(worldPos));
        }

        if (this.rb) {
            this.rb.type           = cc.RigidBodyType.Dynamic;
            this.rb.gravityScale   = 1;
            this.rb.linearVelocity = cc.v2(0, 0);
            this.rb.angularVelocity = 0;
            this.rb.linearDamping  = 2;
            this.rb.angularDamping = 8;
        }

        // Object 模式下恢復 collider（要能碰地、被推動）
        if (this.collider) {
            this.collider.enabled = true;
            this.collider.sensor  = false;
        }

        cc.log(`[DropItem] ${this.node.name} 切換成 Object 模式，放置於 ${worldPos}`);
    }

    update(dt: number) {
        if (this.mode === ItemMode.Object) return;
        if (this.state === ItemState.Held)  return;
        const player = this.findPlayer();
        if (!player) return;

        const distance = this.getWorldDistanceTo(player);

        if (this.state !== ItemState.Attracting && distance <= this.attractDistance) {
            this.startAttract(player);
        }

        if (this.state === ItemState.Attracting) {
            this.moveToPlayer(player, dt);
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.state !== ItemState.Flying) return;
        if (!this.isGround(otherCollider.node)) return;
        this.stopOnGround();
    }

    stopOnGround() {
        if (!this.rb)  return;
        this.state = ItemState.Resting;
        this.rb.linearVelocity = cc.v2(0, 0);
        this.rb.angularVelocity = 0;
        this.rb.gravityScale = 0;
        this.rb.type = cc.RigidBodyType.Static;
        cc.log("Drop item stopped on ground:", this.itemName);
    }

    private startAttract(player: cc.Node) {
        if (this.mode === ItemMode.Object) return;
        this.targetPlayer = player;
        this.state = ItemState.Attracting;
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 0);
            this.rb.angularVelocity = 0;
            this.rb.gravityScale = 0;
            this.rb.type = cc.RigidBodyType.Kinematic;
        }
        if (this.collider) this.collider.enabled = false;
        cc.log("Drop item starts attracting:", this.itemName);
    }

    private moveToPlayer(player: cc.Node, dt: number) {
        if (this.mode === ItemMode.Object) return;
        const dropWorldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const playerWorldPos = player.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const direction = playerWorldPos.sub(dropWorldPos);

        if (direction.mag() <= this.collectDistance) {
            cc.log(`[DropItem] ${this.node.name} 收集完成`);
            this.collect();
            return;
        }

        const movementWorld = direction.normalize().mul(this.attractSpeed * dt);
        const newWorldPos = dropWorldPos.add(movementWorld);
        if (!this.node.parent) return;
        const newLocalPos = this.node.parent.convertToNodeSpaceAR(newWorldPos);
        this.node.setPosition(newLocalPos);
    }

    collect() {
        if (this.mode === ItemMode.Object) return;
        cc.log("Collect item:", this.itemName, this.itemAmount);
        if (!InventoryManager.instance) {
            cc.error('[DropItem] 無法找到 InventoryManager，無法加入背包');
            return;
        }
        const id = this.itemName.toLowerCase();
        const name = this.itemName;
        const added = InventoryManager.instance.addItem(id, this.itemAmount);

        if (added) cc.log(`[DropItem] ${name} 已加入背包`);
        else cc.warn(`[DropItem] 背包已滿，${name} 無法加入`); 
        this.node.destroy();
    }

    private findPlayer(): cc.Node | null {
        const player = cc.find("Canvas/Player");
        if (player) return player;
        return null;
    }

    private getWorldDistanceTo(target: cc.Node): number {
        const selfWorldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const targetWorldPos = target.convertToWorldSpaceAR(cc.Vec2.ZERO);
        return selfWorldPos.sub(targetWorldPos).mag();
    }

    protected isGround(node: cc.Node): boolean {
        if (node.group === "ground") return true;
        if (node.name === "ground" || node.name === "Ground") return true;
        if (node.name === "tempFloor" || node.name === "TempFloor") return true;
        return false;
    }
}