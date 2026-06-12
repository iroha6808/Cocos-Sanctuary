const { ccclass, property } = cc._decorator;

enum MenuRollingSpawnMode {
    Horizontal = 0,
    AnyEdge = 1
}

interface RollingItem {
    node: cc.Node;
    velocity: cc.Vec2;
    spinSpeed: number;
}

@ccclass
export default class MenuRollingSpawner extends cc.Component {
    @property(cc.Node)
    spawnRoot: cc.Node = null;

    @property([cc.Prefab])
    rollingPrefabs: cc.Prefab[] = [];

    @property([cc.SpriteFrame])
    rollingSpriteFrames: cc.SpriteFrame[] = [];

    @property({ type: cc.Enum(MenuRollingSpawnMode) })
    spawnMode: MenuRollingSpawnMode = MenuRollingSpawnMode.Horizontal;

    @property(cc.Float)
    spawnInterval: number = 0.45;

    @property(cc.Integer)
    maxAlive: number = 24;

    @property(cc.Float)
    minSpeed: number = 260;

    @property(cc.Float)
    maxSpeed: number = 460;

    @property(cc.Float)
    minScale: number = 0.8;

    @property(cc.Float)
    maxScale: number = 1.4;

    @property(cc.Float)
    minSpinSpeed: number = 160;

    @property(cc.Float)
    maxSpinSpeed: number = 420;

    @property(cc.Float)
    edgeMargin: number = 140;

    @property(cc.Float)
    driftRatio: number = 0.22;

    @property(cc.Integer)
    itemZIndex: number = -10;

    private spawnTimer: number = 0;
    private items: RollingItem[] = [];
    private warnedMissingAsset: boolean = false;

    onLoad(): void {
        this.spawnRoot = this.spawnRoot || this.node;
    }

    update(dt: number): void {
        this.spawnTimer += dt;
        while (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            this.spawnOne();
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.node || !cc.isValid(item.node)) {
                this.items.splice(i, 1);
                continue;
            }

            item.node.x += item.velocity.x * dt;
            item.node.y += item.velocity.y * dt;
            item.node.angle += item.spinSpeed * dt;

            if (this.isOutOfBounds(item.node)) {
                item.node.destroy();
                this.items.splice(i, 1);
            }
        }
    }

    onDestroy(): void {
        for (let i = 0; i < this.items.length; i++) {
            const node = this.items[i].node;
            if (node && cc.isValid(node)) {
                node.destroy();
            }
        }
        this.items = [];
    }

    private spawnOne(): void {
        if (this.items.length >= Math.max(1, this.maxAlive)) {
            return;
        }

        const node = this.createRollingNode();
        if (!node) {
            if (!this.warnedMissingAsset) {
                this.warnedMissingAsset = true;
                cc.warn("[MenuRollingSpawner] Assign rollingPrefabs or rollingSpriteFrames in Inspector.");
            }
            return;
        }

        const root = this.spawnRoot || this.node;
        const bounds = this.getRootBounds(root);
        const direction = this.pickDirection();
        const speed = this.randomRange(this.minSpeed, this.maxSpeed);
        const drift = speed * this.randomRange(-this.driftRatio, this.driftRatio);
        const scale = this.randomRange(this.minScale, this.maxScale);

        root.addChild(node);
        node.setScale(scale, scale);
        node.angle = this.randomRange(0, 360);
        node.zIndex = this.itemZIndex;
        this.disablePhysics(node);

        let velocity = cc.v2();
        if (direction === "left") {
            node.setPosition(-bounds.width * 0.5 - this.edgeMargin, this.randomRange(-bounds.height * 0.5, bounds.height * 0.5));
            velocity = cc.v2(speed, drift);
        } else if (direction === "right") {
            node.setPosition(bounds.width * 0.5 + this.edgeMargin, this.randomRange(-bounds.height * 0.5, bounds.height * 0.5));
            velocity = cc.v2(-speed, drift);
        } else if (direction === "top") {
            node.setPosition(this.randomRange(-bounds.width * 0.5, bounds.width * 0.5), bounds.height * 0.5 + this.edgeMargin);
            velocity = cc.v2(drift, -speed);
        } else {
            node.setPosition(this.randomRange(-bounds.width * 0.5, bounds.width * 0.5), -bounds.height * 0.5 - this.edgeMargin);
            velocity = cc.v2(drift, speed);
        }

        const spinSign = velocity.x >= 0 ? -1 : 1;
        this.items.push({
            node,
            velocity,
            spinSpeed: spinSign * this.randomRange(this.minSpinSpeed, this.maxSpinSpeed)
        });
    }

    private createRollingNode(): cc.Node {
        const prefab = this.pickPrefab();
        if (prefab) {
            return cc.instantiate(prefab);
        }

        const spriteFrame = this.pickSpriteFrame();
        if (!spriteFrame) {
            return null;
        }

        const node = new cc.Node("MenuRollingSprite");
        const sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteFrame;
        return node;
    }

    private pickPrefab(): cc.Prefab {
        const valid: cc.Prefab[] = [];
        for (let i = 0; i < this.rollingPrefabs.length; i++) {
            if (this.rollingPrefabs[i]) {
                valid.push(this.rollingPrefabs[i]);
            }
        }
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : null;
    }

    private pickSpriteFrame(): cc.SpriteFrame {
        const valid: cc.SpriteFrame[] = [];
        for (let i = 0; i < this.rollingSpriteFrames.length; i++) {
            if (this.rollingSpriteFrames[i]) {
                valid.push(this.rollingSpriteFrames[i]);
            }
        }
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : null;
    }

    private pickDirection(): string {
        if (this.spawnMode === MenuRollingSpawnMode.AnyEdge) {
            const directions = ["left", "right", "top", "bottom"];
            return directions[Math.floor(Math.random() * directions.length)];
        }
        return Math.random() < 0.5 ? "left" : "right";
    }

    private getRootBounds(root: cc.Node): { width: number; height: number } {
        const visibleSize = cc.view.getVisibleSize();
        return {
            width: root && root.width > 0 ? root.width : visibleSize.width,
            height: root && root.height > 0 ? root.height : visibleSize.height
        };
    }

    private isOutOfBounds(node: cc.Node): boolean {
        const root = this.spawnRoot || this.node;
        const bounds = this.getRootBounds(root);
        return node.x < -bounds.width * 0.5 - this.edgeMargin * 2
            || node.x > bounds.width * 0.5 + this.edgeMargin * 2
            || node.y < -bounds.height * 0.5 - this.edgeMargin * 2
            || node.y > bounds.height * 0.5 + this.edgeMargin * 2;
    }

    private disablePhysics(node: cc.Node): void {
        const body = node.getComponent(cc.RigidBody);
        if (body) {
            body.enabled = false;
        }

        const colliders = node.getComponents(cc.PhysicsCollider);
        for (let i = 0; i < colliders.length; i++) {
            colliders[i].enabled = false;
        }

        for (let i = 0; i < node.childrenCount; i++) {
            this.disablePhysics(node.children[i]);
        }
    }

    private randomRange(min: number, max: number): number {
        return min + (max - min) * Math.random();
    }
}
