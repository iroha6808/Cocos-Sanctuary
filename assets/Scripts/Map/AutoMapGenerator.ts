const { ccclass, property } = cc._decorator;

interface RockSpec {
    key: string;
    prefab: cc.Prefab;
    width: number;
    height: number;
    anchorX: number;
    anchorY: number;
    weight: number;
    slope: "none" | "left" | "right";
}

interface PlacementBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface RockPlacement {
    spec: RockSpec;
    position: cc.Vec2;
    bounds: PlacementBounds;
}

@ccclass
export default class AutoMapGenerator extends cc.Component {

    @property(cc.Node)
    targetRoot: cc.Node = null;

    @property(cc.Prefab)
    rockLeftPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    rockRightPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    rockPlatform3Prefab: cc.Prefab = null;

    @property(cc.Prefab)
    rockPlatform4Prefab: cc.Prefab = null;

    @property(cc.Prefab)
    rockPlatform5Prefab: cc.Prefab = null;

    @property
    seed: string = "sanctuary-jump-map-1";

    @property(cc.Boolean)
    autoGenerateOnStart: boolean = true;

    @property(cc.Boolean)
    clearGeneratedOnStart: boolean = true;

    @property(cc.Integer)
    minPlatformCount: number = 18;

    @property(cc.Integer)
    maxPlatformCount: number = 28;

    @property
    minX: number = -5000;

    @property
    maxX: number = 0;

    @property
    minY: number = -2000;

    @property
    maxY: number = 0;

    @property
    prefabScale: number = 10;

    @property
    minSeparation: number = 90;

    @property(cc.Integer)
    rowCount: number = 5;

    @property
    verticalJitter: number = 90;

    @property
    edgePadding: number = 40;

    @property(cc.Boolean)
    showDebugBounds: boolean = false;

    private randomState: number = 1;

    start(): void {
        if (this.autoGenerateOnStart) {
            this.regenerate();
        }
    }

    public regenerate(): void {
        const root = this.getRoot();
        if (!root) {
            cc.warn("[AutoMapGenerator] targetRoot is missing.");
            return;
        }

        if (this.clearGeneratedOnStart) {
            this.clearGenerated(root);
        }

        const specs = this.createSpecs();
        if (specs.length === 0) {
            cc.warn("[AutoMapGenerator] No rock prefabs assigned.");
            return;
        }

        this.resetRandom();
        const placements = this.createPlacements(specs);
        for (let i = 0; i < placements.length; i++) {
            this.spawnRock(root, placements[i], i);
        }

        if (this.showDebugBounds) {
            this.drawDebugBounds(root, placements);
        }
    }

    private getRoot(): cc.Node {
        return this.targetRoot || this.node;
    }

    private clearGenerated(root: cc.Node): void {
        for (let i = root.childrenCount - 1; i >= 0; i--) {
            const child = root.children[i];
            if (child.name.indexOf("AutoRock_") === 0 || child.name === "AutoMapDebugBounds") {
                child.destroy();
            }
        }
    }

    private createSpecs(): RockSpec[] {
        const scale = this.prefabScale;
        const specs: RockSpec[] = [];
        this.addSpec(specs, "Rockplatform3", this.rockPlatform3Prefab, 76.8 * scale, 17.5 * scale, 0.5, 0.5, 4, "none");
        this.addSpec(specs, "Rockplatform4", this.rockPlatform4Prefab, 102.4 * scale, 17.5 * scale, 0.375, 0.5, 3, "none");
        this.addSpec(specs, "Rockplatform5", this.rockPlatform5Prefab, 128 * scale, 17.5 * scale, 0.3, 0.5, 2, "none");
        this.addSpec(specs, "Rockleft", this.rockLeftPrefab, 76.8 * scale, 51.2 * scale, 0.833, 0.75, 1, "left");
        this.addSpec(specs, "Rockright", this.rockRightPrefab, 76.8 * scale, 51.2 * scale, -0.17, 0.75, 1, "right");
        return specs;
    }

    private addSpec(
        specs: RockSpec[],
        key: string,
        prefab: cc.Prefab,
        width: number,
        height: number,
        anchorX: number,
        anchorY: number,
        weight: number,
        slope: "none" | "left" | "right"
    ): void {
        if (!prefab) {
            cc.warn("[AutoMapGenerator] Missing prefab: " + key);
            return;
        }
        specs.push({ key, prefab, width, height, anchorX, anchorY, weight, slope });
    }

    private createPlacements(specs: RockSpec[]): RockPlacement[] {
        const placements: RockPlacement[] = [];
        const minCount = Math.max(1, Math.min(this.minPlatformCount, this.maxPlatformCount));
        const maxCount = Math.max(minCount, this.maxPlatformCount);
        const targetCount = this.randomInt(minCount, maxCount);
        const maxAttempts = targetCount * 90;

        for (let attempt = 0; attempt < maxAttempts && placements.length < targetCount; attempt++) {
            const spec = this.pickSpec(specs);
            const placement = this.createPlacement(spec);
            if (!placement) {
                continue;
            }
            if (this.isSeparated(placement.bounds, placements)) {
                placements.push(placement);
            }
        }

        if (placements.length < minCount) {
            cc.warn("[AutoMapGenerator] Generated only " + placements.length + " rocks. Reduce minSeparation or platform count.");
        }
        return placements;
    }

    private createPlacement(spec: RockSpec): RockPlacement {
        const minX = this.minX + this.edgePadding;
        const maxX = this.maxX - this.edgePadding - spec.width;
        if (maxX <= minX) {
            return null;
        }

        const startX = this.randomRange(minX, maxX);
        let bounds: PlacementBounds = null;
        let position = cc.v2(0, 0);

        if (spec.slope === "left") {
            const startY = this.randomSurfaceY(spec.height, false);
            bounds = { x: startX, y: startY, width: spec.width, height: spec.height };
            position = cc.v2(startX + spec.anchorX * spec.width, startY + spec.anchorY * spec.height);
        } else if (spec.slope === "right") {
            const topY = this.randomSurfaceY(spec.height, true);
            bounds = { x: startX, y: topY - spec.height, width: spec.width, height: spec.height };
            position = cc.v2(startX - spec.anchorX * spec.width, topY - (1 - spec.anchorY) * spec.height);
        } else {
            const groundY = this.randomSurfaceY(spec.height, true);
            bounds = { x: startX, y: groundY - spec.height, width: spec.width, height: spec.height };
            position = cc.v2(startX + spec.anchorX * spec.width, groundY - (1 - spec.anchorY) * spec.height);
        }

        if (!this.isInsideRange(bounds)) {
            return null;
        }
        return { spec, position, bounds };
    }

    private randomSurfaceY(height: number, useTopSurface: boolean): number {
        const low = useTopSurface
            ? this.minY + this.edgePadding + height
            : this.minY + this.edgePadding;
        const high = useTopSurface
            ? this.maxY - this.edgePadding
            : this.maxY - this.edgePadding - height;
        if (high <= low) {
            return low;
        }

        const rows = Math.max(1, this.rowCount);
        const row = this.randomInt(0, rows - 1);
        const t = rows === 1 ? 0.5 : row / (rows - 1);
        const base = low + (high - low) * t;
        return this.clamp(base + this.randomRange(-this.verticalJitter, this.verticalJitter), low, high);
    }

    private isSeparated(bounds: PlacementBounds, placements: RockPlacement[]): boolean {
        const expanded = this.expandBounds(bounds, this.minSeparation);
        for (let i = 0; i < placements.length; i++) {
            if (this.intersects(expanded, placements[i].bounds)) {
                return false;
            }
        }
        return true;
    }

    private isInsideRange(bounds: PlacementBounds): boolean {
        return bounds.x >= this.minX
            && bounds.y >= this.minY
            && bounds.x + bounds.width <= this.maxX
            && bounds.y + bounds.height <= this.maxY;
    }

    private spawnRock(root: cc.Node, placement: RockPlacement, index: number): void {
        const node = cc.instantiate(placement.spec.prefab);
        node.name = "AutoRock_" + index + "_" + placement.spec.key;
        node.setScale(this.prefabScale, this.prefabScale);
        node.setPosition(placement.position);
        root.addChild(node);
    }

    private drawDebugBounds(root: cc.Node, placements: RockPlacement[]): void {
        const debugNode = new cc.Node("AutoMapDebugBounds");
        const graphics = debugNode.addComponent(cc.Graphics);
        root.addChild(debugNode);

        graphics.lineWidth = 3;
        graphics.strokeColor = new cc.Color(80, 180, 255, 180);
        graphics.rect(this.minX, this.minY, this.maxX - this.minX, this.maxY - this.minY);
        graphics.stroke();

        graphics.lineWidth = 2;
        graphics.strokeColor = new cc.Color(255, 210, 80, 180);
        for (let i = 0; i < placements.length; i++) {
            const b = placements[i].bounds;
            graphics.rect(b.x, b.y, b.width, b.height);
        }
        graphics.stroke();
    }

    private pickSpec(specs: RockSpec[]): RockSpec {
        let total = 0;
        for (let i = 0; i < specs.length; i++) {
            total += specs[i].weight;
        }

        let roll = this.randomRange(0, total);
        for (let i = 0; i < specs.length; i++) {
            roll -= specs[i].weight;
            if (roll <= 0) {
                return specs[i];
            }
        }
        return specs[specs.length - 1];
    }

    private expandBounds(bounds: PlacementBounds, amount: number): PlacementBounds {
        return {
            x: bounds.x - amount,
            y: bounds.y - amount,
            width: bounds.width + amount * 2,
            height: bounds.height + amount * 2
        };
    }

    private intersects(a: PlacementBounds, b: PlacementBounds): boolean {
        return a.x < b.x + b.width
            && a.x + a.width > b.x
            && a.y < b.y + b.height
            && a.y + a.height > b.y;
    }

    private resetRandom(): void {
        this.randomState = this.hashSeed(this.seed);
    }

    private hashSeed(seed: string): number {
        let hash = 2166136261;
        for (let i = 0; i < seed.length; i++) {
            hash ^= seed.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return (hash >>> 0) || 1;
    }

    private nextRandom(): number {
        this.randomState = (1664525 * this.randomState + 1013904223) >>> 0;
        return this.randomState / 4294967296;
    }

    private randomRange(min: number, max: number): number {
        return min + (max - min) * this.nextRandom();
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(this.randomRange(min, max + 1));
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}
