import GameManager from "../Core/GameManager";
import ProjectilePoolManager from "../Attack/ProjectilePoolManager";
import { CombatFaction } from "../Attack/CombatHitbox";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerGun extends cc.Component {
    @property(cc.Prefab)
    public projectilePrefab: cc.Prefab = null;

    @property(ProjectilePoolManager)
    public projectilePool: ProjectilePoolManager = null;

    @property(cc.Node)
    public muzzleNode: cc.Node = null;

    @property(cc.Node)
    public projectileParent: cc.Node = null;

    @property(cc.Float)
    public projectileSpeed: number = 520;

    @property(cc.Float)
    public fireCooldown: number = 0.22;

    @property(cc.Float)
    public damage: number = 12;

    @property(cc.Float)
    public knockbackX: number = 160;

    @property(cc.Float)
    public knockbackY: number = 80;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private canvasNode: cc.Node = null;
    private browserMouseDownHandler: any = null;
    private lastFireAt: number = 0;

    onLoad(): void {
        this.ensurePool();
        this.bindMouseInput();
    }

    onDestroy(): void {
        this.unbindMouseInput();
    }

    public fireAtWorldPosition(targetWorldPosition: cc.Vec2): boolean {
        if (!this.canFire()) {
            return false;
        }

        const pool = this.ensurePool();
        if (!pool) {
            return false;
        }

        const spawnWorld = this.getMuzzleWorldPosition();
        const direction = targetWorldPosition.sub(spawnWorld);
        if (direction.magSqr() <= 0.001) {
            direction.x = this.getFacingSign();
        }
        direction.normalizeSelf();

        const projectile = pool.spawn(
            this.node,
            CombatFaction.PLAYER,
            spawnWorld,
            direction.mul(this.projectileSpeed),
            this.damage,
            this.knockbackX,
            this.knockbackY
        );

        if (!projectile) {
            return false;
        }

        this.lastFireAt = Date.now();
        if (this.debugLog) {
            cc.log(`[PlayerGun] fire direction=(${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}).`);
        }
        return true;
    }

    private canFire(): boolean {
        if (!this.projectilePrefab && !this.projectilePool) {
            cc.warn("[PlayerGun] projectilePrefab or projectilePool is required.");
            return false;
        }

        if (GameManager.instance && GameManager.instance.isGamePaused()) {
            return false;
        }

        const player = this.node.getComponent("PlayerController") as any;
        if (player && typeof player.canUseGameplayAction === "function" && !player.canUseGameplayAction()) {
            return false;
        }

        return Date.now() - this.lastFireAt >= this.fireCooldown * 1000;
    }

    private ensurePool(): ProjectilePoolManager {
        if (this.projectilePool && cc.isValid(this.projectilePool.node)) {
            this.projectilePool.configure(this.projectilePrefab, this.projectileParent);
            return this.projectilePool;
        }

        const existing = this.node.getComponent(ProjectilePoolManager);
        this.projectilePool = existing || this.node.addComponent(ProjectilePoolManager);
        this.projectilePool.configure(this.projectilePrefab, this.projectileParent);
        return this.projectilePool;
    }

    private bindMouseInput(): void {
        const gameCanvas = (cc.game as any).canvas;
        if (gameCanvas && gameCanvas.addEventListener) {
            this.browserMouseDownHandler = (event: any) => {
                if (event.button !== 2) {
                    return;
                }
                this.fireAtWorldPosition(this.getMouseWorldPosition(event));
                if (event.preventDefault) {
                    event.preventDefault();
                }
            };
            gameCanvas.addEventListener("mousedown", this.browserMouseDownHandler, false);
            gameCanvas.addEventListener("contextmenu", this.preventContextMenu, false);
            return;
        }

        this.canvasNode = cc.find("Canvas");
        if (this.canvasNode) {
            this.canvasNode.on(cc.Node.EventType.MOUSE_DOWN, this.onNodeMouseDown, this);
        }
    }

    private unbindMouseInput(): void {
        const gameCanvas = (cc.game as any).canvas;
        if (gameCanvas && this.browserMouseDownHandler) {
            gameCanvas.removeEventListener("mousedown", this.browserMouseDownHandler, false);
            gameCanvas.removeEventListener("contextmenu", this.preventContextMenu, false);
        }
        this.browserMouseDownHandler = null;

        if (this.canvasNode && cc.isValid(this.canvasNode)) {
            this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onNodeMouseDown, this);
        }
        this.canvasNode = null;
    }

    private onNodeMouseDown(event: cc.Event.EventMouse): void {
        if (event.getButton() !== cc.Event.EventMouse.BUTTON_RIGHT) {
            return;
        }
        this.fireAtWorldPosition(this.getEventWorldPosition(event));
    }

    private preventContextMenu = (event: any): void => {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
    };

    private getMuzzleWorldPosition(): cc.Vec2 {
        if (this.muzzleNode && cc.isValid(this.muzzleNode)) {
            return this.muzzleNode.parent
                ? this.muzzleNode.parent.convertToWorldSpaceAR(this.muzzleNode.position)
                : cc.v2(this.muzzleNode.x, this.muzzleNode.y);
        }

        const offset = cc.v2(this.getFacingSign() * 28, 10);
        return this.node.convertToWorldSpaceAR(offset);
    }

    private getMouseWorldPosition(event: any): cc.Vec2 {
        const canvas = (cc.game as any).canvas;
        const rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const uiLocation = cc.v2();
        cc.view.convertToLocationInView(event.clientX, event.clientY, rect, uiLocation);
        return this.screenToWorld(uiLocation);
    }

    private getEventWorldPosition(event: cc.Event.EventMouse): cc.Vec2 {
        return this.screenToWorld(event.getLocation());
    }

    private screenToWorld(screenPosition: cc.Vec2): cc.Vec2 {
        const camera = cc.Camera.main;
        if (camera) {
            return camera.getScreenToWorldPoint(screenPosition);
        }
        return screenPosition;
    }

    private getFacingSign(): number {
        const body = this.node.getChildByName("Sprite_Body");
        if (body) {
            return body.scaleX >= 0 ? 1 : -1;
        }
        return this.node.scaleX >= 0 ? 1 : -1;
    }
}
