import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import SaveService, { MapGenerationState, SaveData } from "../Core/SaveService";
import CameraRig from "../Core/CameraRig";

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

interface ResourceSpec {
    key: string;
    prefab: cc.Prefab;
}

export interface MapGenerationRect {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface TimedGenerationOptions {
    clearExisting?: boolean;
    clearAllExisting?: boolean;
    frameCamera?: boolean;
    publishState?: boolean;
    useRealtimeTimer?: boolean;
    onPlacementSpawned?: (state: any) => void;
    onComplete?: () => void;
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

    @property(cc.Node)
    resourceRoot: cc.Node = null;

    @property(cc.Prefab)
    appleBushPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    oreRockPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    fruitOrePrefab: cc.Prefab = null;

    @property
    seed: string = "sanctuary-jump-map-1";

    @property(cc.Boolean)
    autoGenerateOnStart: boolean = false;

    @property(cc.Boolean)
    manualTriggerOnly: boolean = true;

    @property(cc.Boolean)
    clearGeneratedOnStart: boolean = true;

    @property(cc.Float)
    generationStepInterval: number = 0.25;

    @property(cc.Boolean)
    cancelCurrentGenerationBeforeRestart: boolean = false;

    @property(cc.Boolean)
    frameCameraDuringTimedGeneration: boolean = true;

    @property(cc.Float)
    cameraFrameDuration: number = 1.6;

    @property(cc.Float)
    startAfterCameraDelay: number = 0.5;

    @property(cc.Float)
    returnAfterGenerationDelay: number = 1.0;

    @property(cc.Float)
    cameraReturnDuration: number = 1.6;

    @property(cc.Boolean)
    shakeCameraOnSpawn: boolean = true;

    @property(cc.Float)
    spawnShakeDuration: number = 0.08;

    @property(cc.Float)
    spawnShakeAmplitude: number = 6;

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

    @property(cc.Boolean)
    spawnResourcesOnFlatPlatforms: boolean = true;

    @property(cc.Float)
    resourceSpawnChance: number = 0.55;

    @property(cc.Float)
    resourceEdgePadding: number = 130;

    @property(cc.Float)
    resourceYOffset: number = 24;

    @property(cc.Float)
    resourceScaleMultiplier: number = 1;

    private randomState: number = 1;
    private lastGeneratedPatternCount: number = 0;
    private lastGeneratedSlopePatternCount: number = 0;
    private timedRoot: cc.Node = null;
    private timedPlacements: RockPlacement[] = [];
    private timedSpawnIndex: number = 0;
    private isTimedGenerationRunning: boolean = false;
    private waitingToStartTimedGeneration: boolean = false;
    private waitingToReturnCamera: boolean = false;
    private timedGenerationRect: MapGenerationRect = null;
    private timedGenerationOptions: TimedGenerationOptions = null;
    private generatedRockSerial: number = 0;
    private generatedResourceSerial: number = 0;
    private realtimeStartTimer: any = null;
    private realtimeStepTimer: any = null;
    private realtimeReturnTimer: any = null;

    start(): void {
        if (!this.manualTriggerOnly && this.autoGenerateOnStart) {
            this.regenerate();
        }
    }

    onEnable(): void {
        EventCenter.on(GameEvent.SAVE_LOADED, this.onSaveLoaded, this);
    }

    onDisable(): void {
        EventCenter.off(GameEvent.SAVE_LOADED, this.onSaveLoaded, this);
        this.stopTimedGeneration(false);
    }

    public regenerate(): void {
        this.stopTimedGeneration(true);
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
            this.spawnResourceForPlacement(root, placements[i], i);
        }
        this.publishMapGenerationState(placements);

        if (this.showDebugBounds) {
            this.drawDebugBounds(root, placements);
        }
    }

    public beginTimedGeneration(): boolean {
        return this.beginTimedGenerationInRect(this.getCurrentBounds(), {
            clearExisting: this.clearGeneratedOnStart,
            clearAllExisting: true,
            frameCamera: this.frameCameraDuringTimedGeneration,
            publishState: true
        });
    }

    public beginTimedGenerationInRect(rect: MapGenerationRect, options: TimedGenerationOptions = {}): boolean {
        if (this.waitingToReturnCamera) {
            this.stopTimedGeneration(false);
        }
        if (this.isTimedGenerationRunning) {
            if (!this.cancelCurrentGenerationBeforeRestart) {
                cc.warn("[AutoMapGenerator] Timed generation is already running.");
                return false;
            }
            this.stopTimedGeneration(false);
        }

        const root = this.getRoot();
        if (!root) {
            cc.warn("[AutoMapGenerator] targetRoot is missing.");
            return false;
        }

        const normalizedRect = this.normalizeRect(rect || this.getCurrentBounds());
        const clearExisting = options.clearExisting !== undefined ? options.clearExisting : false;
        if (clearExisting) {
            if (options.clearAllExisting) {
                this.clearGenerated(root);
            } else {
                this.clearGeneratedInRect(root, normalizedRect);
            }
        }

        const specs = this.createSpecs();
        if (specs.length === 0) {
            cc.warn("[AutoMapGenerator] No rock prefabs assigned.");
            return false;
        }

        const previousBounds = this.getCurrentBounds();
        this.applyBounds(normalizedRect);
        this.resetRandom();
        const placements = this.createPlacements(specs);
        this.applyBounds(previousBounds);
        this.timedRoot = root;
        this.timedPlacements = placements;
        this.timedSpawnIndex = 0;
        this.isTimedGenerationRunning = true;
        this.waitingToStartTimedGeneration = true;
        this.waitingToReturnCamera = false;
        this.timedGenerationRect = normalizedRect;
        this.timedGenerationOptions = options || {};

        if (this.showDebugBounds) {
            this.drawDebugBounds(root, placements);
        }
        this.frameCameraForGeneration();
        if (placements.length === 0) {
            this.finishTimedGeneration();
            return true;
        }
        this.scheduleTimedStart(this.getTimedStartDelaySeconds());
        return true;
    }

    public applyMapGenerationState(state: MapGenerationState, regenerateNow: boolean = true): void {
        if (!state) {
            return;
        }

        this.seed = state.seed || this.seed;
        if (state.bounds) {
            this.minX = state.bounds.minX;
            this.maxX = state.bounds.maxX;
            this.minY = state.bounds.minY;
            this.maxY = state.bounds.maxY;
        }
        this.prefabScale = state.prefabScale || this.prefabScale;
        if (state.settings) {
            this.rowCount = state.settings.rowCount || this.rowCount;
            this.minSeparation = state.settings.minSeparation || this.minSeparation;
            this.connectGapMin = state.settings.connectGapMin || this.connectGapMin;
            this.connectGapMax = state.settings.connectGapMax || this.connectGapMax;
            this.minPatternCount = state.settings.minPatternCount || this.minPatternCount;
            this.maxPatternCount = state.settings.maxPatternCount || this.maxPatternCount;
            this.minSlopePatternCount = state.settings.minSlopePatternCount || this.minSlopePatternCount;
            this.slopePatternChance = state.settings.slopePatternChance || this.slopePatternChance;
        }

        if (regenerateNow) {
            this.regenerate();
        }
    }

    private getRoot(): cc.Node {
        return this.targetRoot || this.node;
    }

    private clearGenerated(root: cc.Node): void {
        this.clearGeneratedInRoot(root);
        const resourcesRoot = this.getResourceRoot(root);
        if (resourcesRoot && resourcesRoot !== root) {
            this.clearGeneratedInRoot(resourcesRoot);
        }
        this.generatedRockSerial = 0;
        this.generatedResourceSerial = 0;
    }

    private clearGeneratedInRoot(root: cc.Node): void {
        for (let i = root.childrenCount - 1; i >= 0; i--) {
            const child = root.children[i];
            if (child.name.indexOf("AutoRock_") === 0
                || child.name.indexOf("AutoResource_") === 0
                || child.name === "AutoMapDebugBounds") {
                child.destroy();
            }
        }
    }

    private clearGeneratedInRect(root: cc.Node, rect: MapGenerationRect): void {
        this.clearGeneratedInRectRoot(root, root, rect);
        const resourcesRoot = this.getResourceRoot(root);
        if (resourcesRoot && resourcesRoot !== root) {
            this.clearGeneratedInRectRoot(resourcesRoot, root, rect);
        }
    }

    private clearGeneratedInRectRoot(root: cc.Node, coordinateRoot: cc.Node, rect: MapGenerationRect): void {
        if (!root || !coordinateRoot) {
            return;
        }

        for (let i = root.childrenCount - 1; i >= 0; i--) {
            const child = root.children[i];
            if (child.name.indexOf("AutoRock_") !== 0
                && child.name.indexOf("AutoResource_") !== 0
                && child.name !== "AutoMapDebugBounds") {
                continue;
            }

            const localPoint = this.getNodePositionInRoot(child, coordinateRoot);
            if (localPoint.x >= rect.minX && localPoint.x <= rect.maxX
                && localPoint.y >= rect.minY && localPoint.y <= rect.maxY) {
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
        this.lastGeneratedPatternCount = patternBounds.length;
        this.lastGeneratedSlopePatternCount = slopePatternCount;
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

    private spawnRock(root: cc.Node, placement: RockPlacement, index: number): cc.Node {
        const node = cc.instantiate(placement.spec.prefab);
        node.name = "AutoRock_" + this.generatedRockSerial + "_" + placement.spec.key;
        this.generatedRockSerial++;
        node.setScale(this.prefabScale, this.prefabScale);
        node.setPosition(placement.position);
        root.addChild(node);
        return node;
    }

    private spawnResourceForPlacement(root: cc.Node, placement: RockPlacement, index: number): void {
        if (!this.spawnResourcesOnFlatPlatforms || placement.spec.slope !== "none") {
            return;
        }

        const resourceSpec = this.pickResourceSpec();
        const chance = this.clamp(this.resourceSpawnChance, 0, 1);
        if (!resourceSpec || this.nextRandom() > chance) {
            return;
        }

        const safePadding = Math.max(0, Math.min(this.resourceEdgePadding, placement.bounds.width * 0.45));
        const minX = placement.bounds.x + safePadding;
        const maxX = placement.bounds.x + placement.bounds.width - safePadding;
        const x = maxX > minX ? this.randomRange(minX, maxX) : placement.bounds.x + placement.bounds.width * 0.5;
        const y = placement.bounds.y + placement.bounds.height + this.resourceYOffset;
        const parent = this.getResourceRoot(root);
        const node = cc.instantiate(resourceSpec.prefab);
        node.name = "AutoResource_" + this.generatedResourceSerial + "_" + resourceSpec.key;
        this.generatedResourceSerial++;
        if (this.resourceScaleMultiplier > 0 && this.resourceScaleMultiplier !== 1) {
            node.scaleX *= this.resourceScaleMultiplier;
            node.scaleY *= this.resourceScaleMultiplier;
        }
        parent.addChild(node);
        this.setNodePositionFromRootLocal(node, parent, root, cc.v2(x, y));
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

    private spawnNextTimedPlacement(): void {
        if (!this.isTimedGenerationRunning) {
            return;
        }
        if (!this.timedRoot || !cc.isValid(this.timedRoot)) {
            this.stopTimedGeneration(true);
            return;
        }

        if (this.timedSpawnIndex >= this.timedPlacements.length) {
            this.finishTimedGeneration();
            return;
        }

        const index = this.timedSpawnIndex;
        const node = this.spawnRock(this.timedRoot, this.timedPlacements[index], index);
        this.spawnResourceForPlacement(this.timedRoot, this.timedPlacements[index], index);
        if (this.timedGenerationOptions && this.timedGenerationOptions.onPlacementSpawned) {
            this.timedGenerationOptions.onPlacementSpawned(this.createPlacementState(node, this.timedPlacements[index]));
        }
        this.shakeCameraForSpawn();
        this.timedSpawnIndex++;
        EventCenter.emit(GameEvent.MAP_GENERATION_PROGRESS, this.timedSpawnIndex, this.timedPlacements.length);

        if (this.timedSpawnIndex >= this.timedPlacements.length) {
            this.finishTimedGeneration();
        }
    }

    private startTimedPlacementSpawning(): void {
        if (!this.isTimedGenerationRunning) {
            return;
        }

        this.waitingToStartTimedGeneration = false;
        if (this.shouldUseRealtimeTimer()) {
            this.clearRealtimeStartTimer();
            this.clearRealtimeStepTimer();
            this.realtimeStepTimer = setInterval(() => {
                this.spawnNextTimedPlacement();
            }, Math.max(0.01, this.generationStepInterval) * 1000);
        } else {
            this.schedule(
                this.spawnNextTimedPlacement,
                Math.max(0.01, this.generationStepInterval)
            );
        }
        this.spawnNextTimedPlacement();
    }

    private finishTimedGeneration(): void {
        if (!this.isTimedGenerationRunning) {
            return;
        }

        this.unschedule(this.spawnNextTimedPlacement);
        this.unschedule(this.startTimedPlacementSpawning);
        this.clearRealtimeStartTimer();
        this.clearRealtimeStepTimer();
        const placements = this.timedPlacements.slice();
        this.isTimedGenerationRunning = false;
        this.waitingToStartTimedGeneration = false;
        this.waitingToReturnCamera = true;
        this.timedRoot = null;
        this.timedPlacements = [];
        this.timedSpawnIndex = 0;
        const options = this.timedGenerationOptions || {};
        if (options.publishState !== false) {
            this.publishMapGenerationState(placements, this.timedGenerationRect || this.getCurrentBounds());
        }
        if (options.onComplete) {
            options.onComplete();
        }
        this.timedGenerationRect = null;
        this.timedGenerationOptions = null;
        this.scheduleTimedReturn(Math.max(0, this.returnAfterGenerationDelay), options);
    }

    private stopTimedGeneration(returnCamera: boolean): void {
        if (!this.isTimedGenerationRunning && !this.waitingToStartTimedGeneration && !this.waitingToReturnCamera) {
            return;
        }

        const shouldReturnCamera = returnCamera && this.shouldFrameCameraForTimedGeneration();
        this.unschedule(this.spawnNextTimedPlacement);
        this.unschedule(this.startTimedPlacementSpawning);
        this.unschedule(this.returnCameraToTargetAfterDelay);
        this.clearRealtimeTimers();
        this.isTimedGenerationRunning = false;
        this.waitingToStartTimedGeneration = false;
        this.waitingToReturnCamera = false;
        this.timedRoot = null;
        this.timedPlacements = [];
        this.timedSpawnIndex = 0;
        this.timedGenerationRect = null;
        this.timedGenerationOptions = null;
        if (shouldReturnCamera) {
            this.returnCameraToTarget();
        }
    }

    private scheduleTimedStart(delaySeconds: number): void {
        this.clearRealtimeStartTimer();
        if (this.shouldUseRealtimeTimer()) {
            this.realtimeStartTimer = setTimeout(() => {
                this.realtimeStartTimer = null;
                this.startTimedPlacementSpawning();
            }, delaySeconds * 1000);
            return;
        }

        this.scheduleOnce(this.startTimedPlacementSpawning, delaySeconds);
    }

    private scheduleTimedReturn(delaySeconds: number, options: TimedGenerationOptions): void {
        this.clearRealtimeReturnTimer();
        if ((options && options.frameCamera === false) || !this.frameCameraDuringTimedGeneration) {
            this.waitingToReturnCamera = false;
            return;
        }

        if (options && options.useRealtimeTimer) {
            this.realtimeReturnTimer = setTimeout(() => {
                this.realtimeReturnTimer = null;
                this.returnCameraToTargetAfterDelay();
            }, delaySeconds * 1000);
            return;
        }

        this.scheduleOnce(this.returnCameraToTargetAfterDelay, delaySeconds);
    }

    private shouldUseRealtimeTimer(): boolean {
        return !!(this.timedGenerationOptions && this.timedGenerationOptions.useRealtimeTimer);
    }

    private clearRealtimeTimers(): void {
        this.clearRealtimeStartTimer();
        this.clearRealtimeStepTimer();
        this.clearRealtimeReturnTimer();
    }

    private clearRealtimeStartTimer(): void {
        if (this.realtimeStartTimer !== null) {
            clearTimeout(this.realtimeStartTimer);
            this.realtimeStartTimer = null;
        }
    }

    private clearRealtimeStepTimer(): void {
        if (this.realtimeStepTimer !== null) {
            clearInterval(this.realtimeStepTimer);
            this.realtimeStepTimer = null;
        }
    }

    private clearRealtimeReturnTimer(): void {
        if (this.realtimeReturnTimer !== null) {
            clearTimeout(this.realtimeReturnTimer);
            this.realtimeReturnTimer = null;
        }
    }

    private shakeCameraForSpawn(): void {
        if (!this.shakeCameraOnSpawn || this.spawnShakeAmplitude <= 0 || this.spawnShakeDuration <= 0) {
            return;
        }

        const rig = CameraRig.instance;
        if (rig && cc.isValid(rig.node)) {
            rig.addShake(this.spawnShakeDuration, this.spawnShakeAmplitude);
        }
    }

    private frameCameraForGeneration(): void {
        if (!this.shouldFrameCameraForTimedGeneration()) {
            return;
        }

        const rig = CameraRig.instance;
        if (!rig || !cc.isValid(rig.node)) {
            return;
        }

        const rect = this.getGenerationWorldRect(this.timedGenerationRect || this.getCurrentBounds());
        rig.frameWorldRect(rect.minX, rect.minY, rect.maxX, rect.maxY, this.cameraFrameDuration);
    }

    private returnCameraToTarget(): void {
        if (!this.shouldFrameCameraForTimedGeneration()) {
            return;
        }

        const rig = CameraRig.instance;
        if (rig && cc.isValid(rig.node)) {
            rig.returnToTarget(this.cameraReturnDuration);
        }
    }

    private getTimedStartDelaySeconds(): number {
        if (!this.shouldFrameCameraForTimedGeneration()) {
            return 0;
        }
        if (this.shouldUseRealtimeTimer()) {
            return Math.max(0, this.cameraFrameDuration);
        }
        return Math.max(0, this.cameraFrameDuration + this.startAfterCameraDelay);
    }

    private shouldFrameCameraForTimedGeneration(): boolean {
        const options = this.timedGenerationOptions || {};
        return options.frameCamera !== false && this.frameCameraDuringTimedGeneration;
    }

    private getGenerationWorldRect(bounds: MapGenerationRect): { minX: number; minY: number; maxX: number; maxY: number } {
        const root = this.getRoot();
        const bottomLeft = cc.v2(bounds.minX, bounds.minY);
        const topRight = cc.v2(bounds.maxX, bounds.maxY);
        const worldBottomLeft = root && cc.isValid(root)
            ? root.convertToWorldSpaceAR(bottomLeft)
            : bottomLeft;
        const worldTopRight = root && cc.isValid(root)
            ? root.convertToWorldSpaceAR(topRight)
            : topRight;
        return {
            minX: Math.min(worldBottomLeft.x, worldTopRight.x),
            minY: Math.min(worldBottomLeft.y, worldTopRight.y),
            maxX: Math.max(worldBottomLeft.x, worldTopRight.x),
            maxY: Math.max(worldBottomLeft.y, worldTopRight.y)
        };
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

    private pickResourceSpec(): ResourceSpec {
        const specs: ResourceSpec[] = [];
        this.addResourceSpec(specs, "applebush", this.appleBushPrefab);
        this.addResourceSpec(specs, "orerock", this.oreRockPrefab);
        this.addResourceSpec(specs, "fruitore", this.fruitOrePrefab);
        if (specs.length === 0) {
            return null;
        }
        return specs[this.randomInt(0, specs.length - 1)];
    }

    private addResourceSpec(specs: ResourceSpec[], key: string, prefab: cc.Prefab): void {
        if (prefab) {
            specs.push({ key, prefab });
        }
    }

    private getResourceRoot(root: cc.Node): cc.Node {
        return this.resourceRoot && cc.isValid(this.resourceRoot) ? this.resourceRoot : root;
    }

    private setNodePositionFromRootLocal(node: cc.Node, parent: cc.Node, root: cc.Node, rootLocalPosition: cc.Vec2): void {
        if (!parent || parent === root) {
            node.setPosition(rootLocalPosition);
            return;
        }

        const worldPosition = root.convertToWorldSpaceAR(rootLocalPosition);
        node.setPosition(parent.convertToNodeSpaceAR(worldPosition));
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

    private publishMapGenerationState(placements: RockPlacement[], bounds: MapGenerationRect = this.getCurrentBounds()): void {
        let slopeRockCount = 0;
        for (let i = 0; i < placements.length; i++) {
            if (placements[i].spec.slope !== "none") {
                slopeRockCount++;
            }
        }

        const state: MapGenerationState = {
            mapId: this.node ? this.node.name || "auto-map" : "auto-map",
            seed: this.seed,
            generatorVersion: "pattern-jump-v2",
            bounds: {
                minX: bounds.minX,
                maxX: bounds.maxX,
                minY: bounds.minY,
                maxY: bounds.maxY
            },
            prefabScale: this.prefabScale,
            patternCount: this.lastGeneratedPatternCount,
            slopePatternCount: this.lastGeneratedSlopePatternCount,
            rockCount: placements.length,
            slopeRockCount,
            scatterCount: Math.max(0, this.scatterCount),
            settings: {
                rowCount: this.rowCount,
                minSeparation: this.minSeparation,
                connectGapMin: this.connectGapMin,
                connectGapMax: this.connectGapMax,
                minPatternCount: this.minPatternCount,
                maxPatternCount: this.maxPatternCount,
                minSlopePatternCount: this.minSlopePatternCount,
                slopePatternChance: this.slopePatternChance
            },
            updatedAt: Date.now()
        };

        SaveService.setCurrentMapGenerationState(state);
        EventCenter.emit(GameEvent.MAP_GENERATION_UPDATED, state);
    }

    private onSaveLoaded(saveData: SaveData): void {
        if (saveData && saveData.mapState) {
            this.applyMapGenerationState(saveData.mapState, false);
            SaveService.setCurrentMapGenerationState(saveData.mapState);
        }
    }

    private returnCameraToTargetAfterDelay(): void {
        this.waitingToReturnCamera = false;
        this.returnCameraToTarget();
    }

    private getCurrentBounds(): MapGenerationRect {
        return {
            minX: this.minX,
            minY: this.minY,
            maxX: this.maxX,
            maxY: this.maxY
        };
    }

    private applyBounds(bounds: MapGenerationRect): void {
        const normalized = this.normalizeRect(bounds);
        this.minX = normalized.minX;
        this.minY = normalized.minY;
        this.maxX = normalized.maxX;
        this.maxY = normalized.maxY;
    }

    private normalizeRect(rect: MapGenerationRect): MapGenerationRect {
        const minX = Math.min(rect.minX, rect.maxX);
        const maxX = Math.max(rect.minX, rect.maxX);
        const minY = Math.min(rect.minY, rect.maxY);
        const maxY = Math.max(rect.minY, rect.maxY);
        return { minX, minY, maxX, maxY };
    }

    private getNodePositionInRoot(node: cc.Node, root: cc.Node): cc.Vec2 {
        if (!node || !root) {
            return cc.v2();
        }

        if (node.parent === root) {
            return cc.v2(node.x, node.y);
        }

        const world = node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
        return root.convertToNodeSpaceAR(world);
    }

    private createPlacementState(node: cc.Node, placement: RockPlacement): any {
        return {
            id: node ? node.name : "AutoRock_" + Date.now() + "_" + placement.spec.key,
            kind: "terrain",
            prefabKey: placement.spec.key,
            x: placement.position.x,
            y: placement.position.y,
            rotation: 0,
            scaleX: this.prefabScale,
            scaleY: this.prefabScale,
            source: "box-generate",
            updatedAt: Date.now()
        };
    }
}
