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

type PatternType = "FlatRun" | "RampUp" | "RampDown" | "Hill" | "Valley";

interface PatternPlacement {
    placements: RockPlacement[];
    bounds: PlacementBounds;
    hasSlope: boolean;
    endGroundY: number;
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

    @property
    connectGapMin: number = 0;

    @property
    connectGapMax: number = 24;

    @property
    patternGapMinX: number = 220;

    @property
    patternGapMaxX: number = 520;

    @property
    patternVerticalJitter: number = 120;

    @property(cc.Integer)
    minPatternCount: number = 5;

    @property(cc.Integer)
    maxPatternCount: number = 8;

    @property(cc.Integer)
    minSlopePatternCount: number = 2;

    @property
    slopePatternChance: number = 0.65;

    @property(cc.Integer)
    scatterCount: number = 3;

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
        this.addSpec(specs, "Rockleft", this.rockLeftPrefab, 76.8 * scale, 51.2 * scale, 0.833, 0.75, 3, "left");
        this.addSpec(specs, "Rockright", this.rockRightPrefab, 76.8 * scale, 51.2 * scale, -0.17, 0.75, 3, "right");
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
        const patternBounds: PlacementBounds[] = [];
        const minPatternCount = Math.max(1, Math.min(this.minPatternCount, this.maxPatternCount));
        const maxPatternCount = Math.max(minPatternCount, this.maxPatternCount);
        const targetPatternCount = this.randomInt(minPatternCount, maxPatternCount);
        const minSlopePatterns = Math.min(this.minSlopePatternCount, targetPatternCount);
        let slopePatternCount = 0;
        let cursorX = this.minX + this.edgePadding + this.randomRange(0, 160);
        let rowIndex = 0;
        let baseGroundY = this.getPatternBaseY(rowIndex);
        let attempts = 0;

        while (patternBounds.length < targetPatternCount && attempts < targetPatternCount * 80) {
            attempts++;
            const remainingSlots = targetPatternCount - patternBounds.length;
            const remainingSlopeNeed = Math.max(0, minSlopePatterns - slopePatternCount);
            const forceSlope = remainingSlopeNeed >= remainingSlots;
            const patternType = this.pickPatternType(forceSlope);
            const groundY = this.clampPatternGroundY(
                baseGroundY + this.randomRange(-this.patternVerticalJitter, this.patternVerticalJitter)
            );
            const pattern = this.createPattern(patternType, cursorX, groundY, specs);

            if (pattern && this.isPatternSeparated(pattern.bounds, patternBounds)) {
                for (let i = 0; i < pattern.placements.length; i++) {
                    placements.push(pattern.placements[i]);
                }
                patternBounds.push(pattern.bounds);
                if (pattern.hasSlope) {
                    slopePatternCount++;
                }
                cursorX = pattern.bounds.x + pattern.bounds.width + this.randomRange(this.patternGapMinX, this.patternGapMaxX);
                baseGroundY = this.clampPatternGroundY(
                    pattern.endGroundY + this.randomRange(-this.patternVerticalJitter, this.patternVerticalJitter)
                );
            } else {
                cursorX += this.randomRange(this.patternGapMinX * 0.5, this.patternGapMaxX * 0.5);
            }

            if (cursorX > this.maxX - this.edgePadding - 768) {
                rowIndex++;
                cursorX = this.minX + this.edgePadding + this.randomRange(0, 180);
                baseGroundY = this.getPatternBaseY(rowIndex);
            }
        }

        const scatterTarget = Math.max(0, this.scatterCount);
        const maxAttempts = scatterTarget * 50;
        let scatterPlaced = 0;
        for (let attempt = 0; attempt < maxAttempts && scatterPlaced < scatterTarget; attempt++) {
            const spec = this.pickSpec(specs);
            const placement = this.createRandomPlacement(spec);
            if (placement && this.isSeparated(placement.bounds, placements)) {
                placements.push(placement);
                scatterPlaced++;
            }
        }

        if (patternBounds.length < minPatternCount) {
            cc.warn("[AutoMapGenerator] Generated only " + patternBounds.length + " patterns. Reduce minSeparation or pattern count.");
        }
        if (slopePatternCount < minSlopePatterns) {
            cc.warn("[AutoMapGenerator] Generated only " + slopePatternCount + " slope patterns. Check Rockleft/Rockright prefabs or reduce minSlopePatternCount.");
        }
        return placements;
    }

    private createRandomPlacement(spec: RockSpec): RockPlacement {
        const minX = this.minX + this.edgePadding;
        const maxX = this.maxX - this.edgePadding - spec.width;
        if (maxX <= minX) {
            return null;
        }

        const startX = this.randomRange(minX, maxX);
        const groundY = spec.slope === "left"
            ? this.randomSurfaceY(spec.height, false)
            : this.randomSurfaceY(spec.height, true);
        return this.createPlacementAt(spec, startX, groundY);
    }

    private createPlacementAt(spec: RockSpec, startX: number, groundY: number): RockPlacement {
        let bounds: PlacementBounds = null;
        let position = cc.v2(0, 0);

        if (spec.slope === "left") {
            bounds = { x: startX, y: groundY, width: spec.width, height: spec.height };
            position = cc.v2(startX + spec.anchorX * spec.width, groundY + spec.anchorY * spec.height);
        } else if (spec.slope === "right") {
            bounds = { x: startX, y: groundY - spec.height, width: spec.width, height: spec.height };
            position = cc.v2(startX - spec.anchorX * spec.width, groundY - (1 - spec.anchorY) * spec.height);
        } else {
            bounds = { x: startX, y: groundY - spec.height, width: spec.width, height: spec.height };
            position = cc.v2(startX + spec.anchorX * spec.width, groundY - (1 - spec.anchorY) * spec.height);
        }

        if (!this.isInsideRange(bounds)) {
            return null;
        }
        return { spec, position, bounds };
    }

    private createPattern(type: PatternType, startX: number, groundY: number, specs: RockSpec[]): PatternPlacement {
        const sequence = this.createPatternSequence(type, specs);
        if (sequence.length === 0) {
            return null;
        }

        const placements: RockPlacement[] = [];
        let cursorX = startX;
        let cursorY = groundY;
        let hasSlope = false;

        for (let i = 0; i < sequence.length; i++) {
            const spec = sequence[i];
            const placement = this.createPlacementAt(spec, cursorX, cursorY);
            if (!placement) {
                return null;
            }

            placements.push(placement);
            if (spec.slope !== "none") {
                hasSlope = true;
            }

            cursorX += spec.width + this.randomRange(this.connectGapMin, this.connectGapMax);
            cursorY = this.getConnectedNextGroundY(spec, cursorY);
        }

        const bounds = this.combineBounds(placements);
        if (!this.isInsideRange(bounds)) {
            return null;
        }
        return { placements, bounds, hasSlope, endGroundY: cursorY };
    }

    private createPatternSequence(type: PatternType, specs: RockSpec[]): RockSpec[] {
        const leftSlope = this.getSpecByKey(specs, "Rockleft");
        const rightSlope = this.getSpecByKey(specs, "Rockright");
        const sequence: RockSpec[] = [];

        if (type === "FlatRun") {
            const count = this.randomInt(2, 4);
            for (let i = 0; i < count; i++) {
                sequence.push(this.pickHorizontalSpec(specs));
            }
            return sequence;
        }

        if (type === "RampUp" && leftSlope) {
            sequence.push(this.pickHorizontalSpec(specs), leftSlope, this.pickHorizontalSpec(specs));
        } else if (type === "RampDown" && rightSlope) {
            sequence.push(this.pickHorizontalSpec(specs), rightSlope, this.pickHorizontalSpec(specs));
        } else if (type === "Hill" && leftSlope && rightSlope) {
            sequence.push(leftSlope, this.pickHorizontalSpec(specs), rightSlope);
        } else if (type === "Valley" && leftSlope && rightSlope) {
            sequence.push(rightSlope, this.pickHorizontalSpec(specs), leftSlope);
        }

        return sequence.length > 0 ? sequence : [this.pickHorizontalSpec(specs), this.pickHorizontalSpec(specs)];
    }

    private pickPatternType(forceSlope: boolean): PatternType {
        const slopeTypes: PatternType[] = ["RampUp", "RampDown", "Hill", "Valley"];
        if (forceSlope || this.nextRandom() < this.slopePatternChance) {
            return slopeTypes[this.randomInt(0, slopeTypes.length - 1)];
        }
        return "FlatRun";
    }

    private pickHorizontalSpec(specs: RockSpec[]): RockSpec {
        const horizontalSpecs: RockSpec[] = [];
        for (let i = 0; i < specs.length; i++) {
            if (specs[i].slope === "none") {
                horizontalSpecs.push(specs[i]);
            }
        }
        return horizontalSpecs.length > 0
            ? this.pickSpec(horizontalSpecs)
            : specs[0];
    }

    private getSpecByKey(specs: RockSpec[], key: string): RockSpec {
        for (let i = 0; i < specs.length; i++) {
            if (specs[i].key === key) {
                return specs[i];
            }
        }
        return null;
    }

    private getConnectedNextGroundY(spec: RockSpec, currentY: number): number {
        if (spec.slope === "left") {
            return currentY + spec.height;
        }
        if (spec.slope === "right") {
            return currentY - spec.height;
        }
        return currentY;
    }

    private getPatternBaseY(rowIndex: number): number {
        const rows = Math.max(1, this.rowCount);
        const row = rowIndex % rows;
        const low = this.minY + this.edgePadding + 512;
        const high = this.maxY - this.edgePadding - 512;
        if (high <= low) {
            return (this.minY + this.maxY) * 0.5;
        }
        const t = rows === 1 ? 0.5 : row / (rows - 1);
        return this.clampPatternGroundY(low + (high - low) * t + this.randomRange(-this.verticalJitter, this.verticalJitter));
    }

    private clampPatternGroundY(value: number): number {
        const low = this.minY + this.edgePadding + 512;
        const high = this.maxY - this.edgePadding - 512;
        if (high <= low) {
            return (this.minY + this.maxY) * 0.5;
        }
        return this.clamp(value, low, high);
    }

    private combineBounds(placements: RockPlacement[]): PlacementBounds {
        let minX = placements[0].bounds.x;
        let minY = placements[0].bounds.y;
        let maxX = placements[0].bounds.x + placements[0].bounds.width;
        let maxY = placements[0].bounds.y + placements[0].bounds.height;

        for (let i = 1; i < placements.length; i++) {
            const bounds = placements[i].bounds;
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    private isPatternSeparated(bounds: PlacementBounds, patternBounds: PlacementBounds[]): boolean {
        const expanded = this.expandBounds(bounds, this.minSeparation);
        for (let i = 0; i < patternBounds.length; i++) {
            if (this.intersects(expanded, patternBounds[i])) {
                return false;
            }
        }
        return true;
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
