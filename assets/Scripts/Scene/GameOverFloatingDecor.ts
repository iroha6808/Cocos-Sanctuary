const { ccclass, property } = cc._decorator;

interface FloatingDecorItem {
    node: cc.Node;
    baseX: number;
    baseY: number;
    age: number;
    swayAmplitude: number;
    swaySpeed: number;
    baseAngle: number;
    angleAmplitude: number;
    angleSpeed: number;
    phase: number;
    generated: boolean;
    originalOpacity: number;
}

@ccclass
export default class GameOverFloatingDecor extends cc.Component {
    @property(cc.Node)
    decorRoot: cc.Node = null;

    @property([cc.Node])
    floatingNodes: cc.Node[] = [];

    @property([cc.Prefab])
    decorPrefabs: cc.Prefab[] = [];

    @property([cc.SpriteFrame])
    decorSpriteFrames: cc.SpriteFrame[] = [];

    @property(cc.Integer)
    initialCount: number = 8;

    @property(cc.Float)
    spawnInterval: number = 1.2;

    @property(cc.Integer)
    maxAlive: number = 18;

    @property(cc.Float)
    minSwayAmplitude: number = 18;

    @property(cc.Float)
    maxSwayAmplitude: number = 64;

    @property(cc.Float)
    minSwaySpeed: number = 0.6;

    @property(cc.Float)
    maxSwaySpeed: number = 1.4;

    @property(cc.Float)
    minSpinSpeed: number = -18;

    @property(cc.Float)
    maxSpinSpeed: number = 18;

    @property(cc.Float)
    maxAngle: number = 30;

    @property(cc.Float)
    minScale: number = 0.65;

    @property(cc.Float)
    maxScale: number = 1.25;

    @property(cc.Float)
    spawnPadding: number = 80;

    @property(cc.Integer)
    decorZIndex: number = -5;

    @property(cc.Boolean)
    animateAssignedNodes: boolean = true;

    private spawnTimer: number = 0;
    private items: FloatingDecorItem[] = [];
    private warnedMissingAsset: boolean = false;

    onLoad(): void {
        this.decorRoot = this.decorRoot || this.node;
    }

    start(): void {
        this.registerAssignedNodes();
        const count = Math.max(0, this.initialCount);
        for (let i = 0; i < count; i++) {
            this.spawnOne(true);
        }
    }

    update(dt: number): void {
        this.spawnTimer += dt;
        if (this.spawnInterval > 0 && this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnOne(false);
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.node || !cc.isValid(item.node)) {
                this.items.splice(i, 1);
                continue;
            }

            item.age += dt;
            item.node.x = item.baseX + Math.sin(item.age * item.swaySpeed + item.phase) * item.swayAmplitude;
            item.node.y = item.baseY + Math.sin(item.age * item.swaySpeed * 0.7 + item.phase) * item.swayAmplitude * 0.22;
            item.node.angle = this.clamp(
                item.baseAngle + Math.sin(item.age * item.angleSpeed + item.phase) * item.angleAmplitude,
                -this.maxAngle,
                this.maxAngle
            );
        }
    }

    onDestroy(): void {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const node = item.node;
            if (node && cc.isValid(node) && item.generated) {
                node.destroy();
            } else if (node && cc.isValid(node)) {
                node.opacity = item.originalOpacity;
            }
        }
        this.items = [];
    }

    private registerAssignedNodes(): void {
        if (!this.animateAssignedNodes) {
            return;
        }

        for (let i = 0; i < this.floatingNodes.length; i++) {
            const node = this.floatingNodes[i];
            if (!node || !cc.isValid(node)) {
                continue;
            }

            this.disablePhysics(node);
            this.items.push({
                node,
                baseX: node.x,
                baseY: node.y,
                age: this.randomRange(0, 4),
                swayAmplitude: this.randomRange(this.minSwayAmplitude, this.maxSwayAmplitude),
                swaySpeed: this.randomRange(this.minSwaySpeed, this.maxSwaySpeed),
                baseAngle: this.clamp(node.angle, -this.maxAngle, this.maxAngle),
                angleAmplitude: this.randomRange(4, this.maxAngle),
                angleSpeed: Math.abs(this.randomRange(this.minSpinSpeed, this.maxSpinSpeed)) / 30,
                phase: this.randomRange(0, Math.PI * 2),
                generated: false,
                originalOpacity: node.opacity
            });
        }
    }

    private spawnOne(placeAnywhere: boolean): void {
        if (this.items.length >= Math.max(1, this.maxAlive)) {
            return;
        }

        const node = this.createDecorNode();
        if (!node) {
            if (!this.hasAssignedFloatingNodes() && !this.warnedMissingAsset) {
                this.warnedMissingAsset = true;
                cc.warn("[GameOverFloatingDecor] Assign decorPrefabs or decorSpriteFrames in Inspector.");
            }
            return;
        }

        const root = this.decorRoot || this.node;
        const bounds = this.getRootBounds(root);
        const scale = this.randomRange(this.minScale, this.maxScale);
        const startX = this.randomRange(-bounds.width * 0.5 + this.spawnPadding, bounds.width * 0.5 - this.spawnPadding);
        const startY = this.randomRange(-bounds.height * 0.45, bounds.height * 0.45);

        root.addChild(node);
        node.setPosition(startX, startY);
        node.setScale(scale, scale);
        node.angle = this.randomRange(-18, 18);
        node.opacity = 255;
        node.zIndex = this.decorZIndex;
        this.disablePhysics(node);

        this.items.push({
            node,
            baseX: startX,
            baseY: startY,
            age: placeAnywhere ? this.randomRange(0, 4) : 0,
            swayAmplitude: this.randomRange(this.minSwayAmplitude, this.maxSwayAmplitude),
            swaySpeed: this.randomRange(this.minSwaySpeed, this.maxSwaySpeed),
            baseAngle: this.clamp(node.angle, -this.maxAngle, this.maxAngle),
            angleAmplitude: this.randomRange(4, this.maxAngle),
            angleSpeed: Math.abs(this.randomRange(this.minSpinSpeed, this.maxSpinSpeed)) / 30,
            phase: this.randomRange(0, Math.PI * 2),
            generated: true,
            originalOpacity: node.opacity
        });
    }

    private createDecorNode(): cc.Node {
        const prefab = this.pickPrefab();
        if (prefab) {
            return cc.instantiate(prefab);
        }

        const spriteFrame = this.pickSpriteFrame();
        if (!spriteFrame) {
            return null;
        }

        const node = new cc.Node("GameOverFloatingSprite");
        const sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteFrame;
        return node;
    }

    private pickPrefab(): cc.Prefab {
        const valid: cc.Prefab[] = [];
        for (let i = 0; i < this.decorPrefabs.length; i++) {
            if (this.decorPrefabs[i]) {
                valid.push(this.decorPrefabs[i]);
            }
        }
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : null;
    }

    private pickSpriteFrame(): cc.SpriteFrame {
        const valid: cc.SpriteFrame[] = [];
        for (let i = 0; i < this.decorSpriteFrames.length; i++) {
            if (this.decorSpriteFrames[i]) {
                valid.push(this.decorSpriteFrames[i]);
            }
        }
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : null;
    }

    private hasAssignedFloatingNodes(): boolean {
        for (let i = 0; i < this.floatingNodes.length; i++) {
            if (this.floatingNodes[i] && cc.isValid(this.floatingNodes[i])) {
                return true;
            }
        }
        return false;
    }

    private getRootBounds(root: cc.Node): { width: number; height: number } {
        const visibleSize = cc.view.getVisibleSize();
        return {
            width: root && root.width > 0 ? root.width : visibleSize.width,
            height: root && root.height > 0 ? root.height : visibleSize.height
        };
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

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}
