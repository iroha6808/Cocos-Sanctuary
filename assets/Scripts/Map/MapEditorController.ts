import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import SaveService, { MapEditorPlacementState, MapEditorState, SaveData } from "../Core/SaveService";
import CameraRig from "../Core/CameraRig";
import InputManager from "../Input/InputManager";
import { InputAction, InputPayload } from "../Input/InputAction";
import { InputContext } from "../Input/InputContext";
import { getActionForKeyboardEvent } from "../Input/InputBindings";
import AutoMapGenerator, { MapGenerationRect } from "./AutoMapGenerator";
import PlayerController from "../Player/PlayerController";

const { ccclass, property } = cc._decorator;

enum MapEditorTool {
    Terrain = "Terrain",
    Resource = "Resource",
    BoxGenerate = "BoxGenerate"
}

interface EditorPrefabEntry {
    key: string;
    kind: "terrain" | "resource";
    prefab: cc.Prefab;
}

@ccclass
export default class MapEditorController extends cc.Component {
    @property(cc.Node)
    terrainRoot: cc.Node = null;

    @property(cc.Node)
    resourceRoot: cc.Node = null;

    @property(CameraRig)
    cameraRig: CameraRig = null;

    @property(AutoMapGenerator)
    autoMapGenerator: AutoMapGenerator = null;

    @property(cc.Node)
    playerNode: cc.Node = null;

    @property(cc.Label)
    editorStatusLabel: cc.Label = null;

    @property(cc.Graphics)
    selectionGraphics: cc.Graphics = null;

    @property(cc.Graphics)
    placementDebugGraphics: cc.Graphics = null;

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

    @property(cc.Prefab)
    appleBushPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    oreRockPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    fruitOrePrefab: cc.Prefab = null;

    @property(cc.Float)
    terrainScale: number = 10;

    @property(cc.Float)
    resourceScale: number = 1;

    @property(cc.Float)
    rotationStep: number = 15;

    @property(cc.Float)
    deleteRadius: number = 120;

    @property(cc.Integer)
    previewOpacity: number = 120;

    @property(cc.Boolean)
    alignPlacementCenterToCursor: boolean = true;

    @property(cc.Boolean)
    showPlacementDebug: boolean = false;

    private inputManager: InputManager = null;
    private canvasNode: cc.Node = null;
    private isEditing: boolean = false;
    private tool: MapEditorTool = MapEditorTool.Terrain;
    private terrainIndex: number = 0;
    private resourceIndex: number = 0;
    private rotation: number = 0;
    private placements: MapEditorPlacementState[] = [];
    private selectionStart: cc.Vec2 = null;
    private selectionCurrent: cc.Vec2 = null;
    private previewNode: cc.Node = null;
    private previewKey: string = "";
    private lastMouseRootLocal: cc.Vec2 = null;
    private browserMouseDownHandler: any = null;
    private browserMouseMoveHandler: any = null;
    private browserMouseUpHandler: any = null;
    private browserKeyDownHandler: any = null;
    private preventContextMenuHandler: any = null;
    private placedDuringCurrentClick: boolean = false;
    private runtimePlacementDebugNode: cc.Node = null;

    onLoad(): void {
        this.inputManager = InputManager.getOrCreate(this.node);
        this.canvasNode = cc.find("Canvas");
        this.bindMouseEvents();
        EventCenter.on(GameEvent.SAVE_LOADED, this.onSaveLoaded, this);
    }

    start(): void {
        // Map editor is currently scene-authoritative: do not rebuild from the
        // fake backend on scene start, or it may overwrite freshly edited terrain.
        this.refreshStatus();
    }

    onDestroy(): void {
        this.exitEditorMode();
        this.unbindMouseEvents();
        this.destroyRuntimePlacementDebug();
        EventCenter.off(GameEvent.SAVE_LOADED, this.onSaveLoaded, this);
    }

    public enterEditorMode(): void {
        if (this.isEditing) {
            return;
        }
        this.isEditing = true;
        this.inputManager = this.inputManager || InputManager.getOrCreate(this.node);
        if (this.inputManager) {
            this.inputManager.pushContext(InputContext.MapEditor, this.handleEditorInput, this);
        }
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onEditorKeyDownFallback, this);
        this.bindEditorKeyboardFallback();
        this.setPlayerLocked(true);
        this.refreshStatus();
        cc.log("[MapEditor] Enter editor mode.");
        EventCenter.emit(GameEvent.MAP_EDITOR_MODE_CHANGED, true);
    }

    public exitEditorMode(): void {
        if (!this.isEditing) {
            return;
        }
        this.isEditing = false;
        if (this.inputManager) {
            this.inputManager.popContext(InputContext.MapEditor, this);
        }
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onEditorKeyDownFallback, this);
        this.unbindEditorKeyboardFallback();
        this.setPlayerLocked(false);
        this.destroyPlacementPreview();
        this.clearPlacementDebug();
        this.clearSelection();
        this.commitEditorChangesToScene();
        this.refreshStatus();
        cc.log("[MapEditor] Exit editor mode.");
        EventCenter.emit(GameEvent.MAP_EDITOR_MODE_CHANGED, false);
        this.scheduleOnce(this.refreshEditedPhysics, 0);
    }

    public toggleEditorMode(): void {
        if (this.isEditing) {
            this.exitEditorMode();
        } else {
            this.enterEditorMode();
        }
    }

    public isEditorModeActive(): boolean {
        return this.isEditing;
    }

    public handleEditorKeyboardEvent(event: cc.Event.EventKeyboard): boolean {
        if (!this.isEditing) {
            return false;
        }

        switch (this.getEditorActionFromEvent(event)) {
            case InputAction.ToggleMapEditor:
            case InputAction.Cancel:
                this.toggleEditorMode();
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.EditorTerrainTool:
                this.setTool(MapEditorTool.Terrain);
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.EditorResourceTool:
                this.setTool(MapEditorTool.Resource);
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.EditorBoxGenerateTool:
                this.setTool(MapEditorTool.BoxGenerate);
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.EditorPreviousPrefab:
                this.selectPrefab(-1);
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.EditorNextPrefab:
                this.selectPrefab(1);
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.EditorRotateLeft:
                this.adjustRotation(-1);
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.EditorRotateRight:
                this.adjustRotation(1);
                this.stopEditorKeyEvent(event);
                return true;
            case InputAction.CameraZoomIn:
            case InputAction.CameraZoomOut:
                return false;
            default:
                return false;
        }
    }

    private handleRawEditorKeyboardEvent(key: string, code: string, keyCode: number, event?: any): boolean {
        if (!this.isEditing) {
            return false;
        }

        switch (this.getEditorActionFromRaw(key, code, keyCode)) {
            case InputAction.ToggleMapEditor:
            case InputAction.Cancel:
                this.toggleEditorMode();
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.EditorTerrainTool:
                this.setTool(MapEditorTool.Terrain);
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.EditorResourceTool:
                this.setTool(MapEditorTool.Resource);
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.EditorBoxGenerateTool:
                this.setTool(MapEditorTool.BoxGenerate);
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.EditorPreviousPrefab:
                this.selectPrefab(-1);
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.EditorNextPrefab:
                this.selectPrefab(1);
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.EditorRotateLeft:
                this.adjustRotation(-1);
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.EditorRotateRight:
                this.adjustRotation(1);
                this.stopRawEditorKeyEvent(event);
                return true;
            case InputAction.CameraZoomIn:
            case InputAction.CameraZoomOut:
                return false;
            default:
                return false;
        }
    }

    private handleEditorInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return true;
        }

        const action = payload.originalEvent
            ? this.getEditorActionFromEvent(payload.originalEvent)
            : payload.action;
        switch (action) {
            case InputAction.ToggleMapEditor:
            case InputAction.Cancel:
                this.toggleEditorMode();
                return true;
            case InputAction.EditorTerrainTool:
                this.setTool(MapEditorTool.Terrain);
                return true;
            case InputAction.EditorResourceTool:
                this.setTool(MapEditorTool.Resource);
                return true;
            case InputAction.EditorBoxGenerateTool:
                this.setTool(MapEditorTool.BoxGenerate);
                return true;
            case InputAction.EditorPreviousPrefab:
                this.selectPrefab(-1);
                return true;
            case InputAction.EditorNextPrefab:
            case InputAction.NavigateDown:
                this.selectPrefab(1);
                return true;
            case InputAction.NavigateUp:
                this.selectPrefab(-1);
                return true;
            case InputAction.EditorRotateLeft:
                this.adjustRotation(-1);
                return true;
            case InputAction.EditorRotateRight:
                this.adjustRotation(1);
                return true;
            case InputAction.CameraZoomIn:
            case InputAction.CameraZoomOut:
                return false;
            default:
                return true;
        }
    }

    private onEditorKeyDownFallback(event: cc.Event.EventKeyboard): void {
        this.handleEditorKeyboardEvent(event);
    }

    private getEditorActionFromEvent(event: cc.Event.EventKeyboard): InputAction {
        const keyCode = event ? event.keyCode : 0;
        return this.getEditorActionFromRaw(
            this.getKeyboardString(event, "key"),
            this.getKeyboardString(event, "code"),
            keyCode
        ) || getActionForKeyboardEvent(event);
    }

    private getEditorActionFromRaw(key: string, code: string, keyCode: number): InputAction {
        key = (key || "").toLowerCase();
        code = (code || "").toLowerCase();

        switch (key) {
            case "escape":
            case "esc":
                return InputAction.Cancel;
            case "e":
                return InputAction.ToggleMapEditor;
            case "1":
                return InputAction.EditorTerrainTool;
            case "2":
                return InputAction.EditorResourceTool;
            case "3":
                return InputAction.EditorBoxGenerateTool;
            case "q":
                return InputAction.EditorPreviousPrefab;
            case "r":
                return InputAction.EditorNextPrefab;
            case "[":
                return InputAction.EditorRotateLeft;
            case "]":
                return InputAction.EditorRotateRight;
        }

        switch (code) {
            case "escape":
                return InputAction.Cancel;
            case "keye":
                return InputAction.ToggleMapEditor;
            case "digit1":
            case "numpad1":
                return InputAction.EditorTerrainTool;
            case "digit2":
            case "numpad2":
                return InputAction.EditorResourceTool;
            case "digit3":
            case "numpad3":
                return InputAction.EditorBoxGenerateTool;
            case "keyq":
                return InputAction.EditorPreviousPrefab;
            case "keyr":
                return InputAction.EditorNextPrefab;
            case "bracketleft":
                return InputAction.EditorRotateLeft;
            case "bracketright":
                return InputAction.EditorRotateRight;
        }

        if (keyCode === 27) {
            return InputAction.Cancel;
        }
        if (keyCode === 69) {
            return InputAction.ToggleMapEditor;
        }
        if (keyCode === 49 || keyCode === 97) {
            return InputAction.EditorTerrainTool;
        }
        if (keyCode === 50 || keyCode === 98) {
            return InputAction.EditorResourceTool;
        }
        if (keyCode === 51 || keyCode === 99) {
            return InputAction.EditorBoxGenerateTool;
        }
        if (keyCode === 81) {
            return InputAction.EditorPreviousPrefab;
        }
        if (keyCode === 82) {
            return InputAction.EditorNextPrefab;
        }
        if (keyCode === 219) {
            return InputAction.EditorRotateLeft;
        }
        if (keyCode === 221) {
            return InputAction.EditorRotateRight;
        }

        return null!;
    }

    private getKeyboardString(event: cc.Event.EventKeyboard, field: string): string {
        const anyEvent = event as any;
        const nativeEvent = anyEvent && (anyEvent._event || anyEvent.event || anyEvent.nativeEvent);
        const value = anyEvent && typeof anyEvent[field] === "string"
            ? anyEvent[field]
            : nativeEvent && typeof nativeEvent[field] === "string"
                ? nativeEvent[field]
                : "";
        return value.toLowerCase();
    }

    private stopEditorKeyEvent(event: cc.Event.EventKeyboard): void {
        const maybeEvent = event as any;
        if (maybeEvent && typeof maybeEvent.stopPropagation === "function") {
            maybeEvent.stopPropagation();
        }
    }

    private stopRawEditorKeyEvent(event: any): void {
        if (!event) {
            return;
        }
        if (typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        } else if (typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }
    }

    private bindEditorKeyboardFallback(): void {
        const globalWindow = typeof window !== "undefined" ? window as any : null;
        if (!globalWindow || this.browserKeyDownHandler) {
            return;
        }

        this.browserKeyDownHandler = (event: any) => {
            this.handleRawEditorKeyboardEvent(
                typeof event.key === "string" ? event.key : "",
                typeof event.code === "string" ? event.code : "",
                typeof event.keyCode === "number" ? event.keyCode : 0,
                event
            );
        };
        globalWindow.addEventListener("keydown", this.browserKeyDownHandler, true);
    }

    private unbindEditorKeyboardFallback(): void {
        const globalWindow = typeof window !== "undefined" ? window as any : null;
        if (!globalWindow || !this.browserKeyDownHandler) {
            this.browserKeyDownHandler = null;
            return;
        }

        globalWindow.removeEventListener("keydown", this.browserKeyDownHandler, true);
        this.browserKeyDownHandler = null;
    }

    private bindMouseEvents(): void {
        const gameCanvas = (cc.game as any).canvas;
        if (gameCanvas && gameCanvas.addEventListener) {
            this.bindBrowserMouseEvents(gameCanvas);
            return;
        }

        if (!this.canvasNode) {
            return;
        }
        this.canvasNode.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.canvasNode.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.canvasNode.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    private unbindMouseEvents(): void {
        const gameCanvas = (cc.game as any).canvas;
        if (gameCanvas && gameCanvas.removeEventListener) {
            if (this.browserMouseDownHandler) {
                gameCanvas.removeEventListener("mousedown", this.browserMouseDownHandler, false);
            }
            if (this.browserMouseMoveHandler) {
                gameCanvas.removeEventListener("mousemove", this.browserMouseMoveHandler, false);
            }
            if (this.browserMouseUpHandler) {
                gameCanvas.removeEventListener("mouseup", this.browserMouseUpHandler, false);
            }
            if (this.preventContextMenuHandler) {
                gameCanvas.removeEventListener("contextmenu", this.preventContextMenuHandler, false);
            }
        }

        if (!this.canvasNode || !cc.isValid(this.canvasNode)) {
            return;
        }
        this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.canvasNode.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.canvasNode.off(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    private bindBrowserMouseEvents(gameCanvas: any): void {
        this.browserMouseDownHandler = (event: any) => {
            if (!this.isEditing) {
                return;
            }
            const input = this.getBrowserMouseInput(event);
            this.handleEditorMouseDown(event.button, input.rootLocal, input.world);
            this.preventBrowserMouseDefault(event);
        };
        this.browserMouseMoveHandler = (event: any) => {
            if (!this.isEditing) {
                return;
            }
            const input = this.getBrowserMouseInput(event);
            this.handleEditorMouseMove(input.rootLocal);
            this.preventBrowserMouseDefault(event);
        };
        this.browserMouseUpHandler = (event: any) => {
            if (!this.isEditing) {
                return;
            }
            const input = this.getBrowserMouseInput(event);
            this.handleEditorMouseUp(event.button, input.rootLocal);
            this.preventBrowserMouseDefault(event);
        };
        this.preventContextMenuHandler = (event: any) => {
            if (this.isEditing) {
                this.preventBrowserMouseDefault(event);
            }
        };

        gameCanvas.addEventListener("mousedown", this.browserMouseDownHandler, false);
        gameCanvas.addEventListener("mousemove", this.browserMouseMoveHandler, false);
        gameCanvas.addEventListener("mouseup", this.browserMouseUpHandler, false);
        gameCanvas.addEventListener("contextmenu", this.preventContextMenuHandler, false);
    }

    private onMouseDown(event: cc.Event.EventMouse): void {
        if (!this.isEditing) {
            return;
        }
        const rootLocal = this.getMouseRootLocal(event);
        this.handleEditorMouseDown(event.getButton(), rootLocal, this.getMouseWorld(event));
    }

    private onMouseMove(event: cc.Event.EventMouse): void {
        if (!this.isEditing) {
            return;
        }
        this.handleEditorMouseMove(this.getMouseRootLocal(event));
    }

    private onMouseUp(event: cc.Event.EventMouse): void {
        if (!this.isEditing) {
            return;
        }
        this.handleEditorMouseUp(event.getButton(), this.getMouseRootLocal(event));
    }

    private handleEditorMouseDown(button: number, rootLocal: cc.Vec2, world: cc.Vec2): void {
        if (!rootLocal) {
            return;
        }
        this.lastMouseRootLocal = rootLocal.clone();
        this.placedDuringCurrentClick = false;

        if (button === cc.Event.EventMouse.BUTTON_RIGHT) {
            this.deleteAtWorld(world);
            return;
        }

        if (button !== cc.Event.EventMouse.BUTTON_LEFT) {
            return;
        }

        if (this.tool === MapEditorTool.BoxGenerate) {
            this.destroyPlacementPreview();
            this.selectionStart = rootLocal;
            this.selectionCurrent = rootLocal.clone();
            this.drawSelection();
            return;
        }

        this.placedDuringCurrentClick = this.placeAt(rootLocal);
    }

    private handleEditorMouseMove(rootLocal: cc.Vec2): void {
        if (!rootLocal) {
            return;
        }
        this.lastMouseRootLocal = rootLocal.clone();

        if (this.tool === MapEditorTool.BoxGenerate) {
            this.destroyPlacementPreview();
            if (this.selectionStart) {
                this.selectionCurrent = rootLocal;
                this.drawSelection();
            }
            return;
        }

        this.updatePlacementPreview(rootLocal);
    }

    private handleEditorMouseUp(button: number, rootLocal: cc.Vec2): void {
        if (button !== cc.Event.EventMouse.BUTTON_LEFT || !rootLocal) {
            this.placedDuringCurrentClick = false;
            return;
        }

        if (this.selectionStart) {
            this.selectionCurrent = rootLocal;
            this.generateInSelection();
            this.clearSelection();
            this.placedDuringCurrentClick = false;
            return;
        }

        if (!this.placedDuringCurrentClick && this.tool !== MapEditorTool.BoxGenerate) {
            this.placeAt(rootLocal);
        }
        this.placedDuringCurrentClick = false;
    }

    private placeAt(rootLocal: cc.Vec2): boolean {
        const entry = this.getCurrentEntry();
        if (!entry || !entry.prefab) {
            cc.warn("[MapEditor] No prefab assigned for current tool.");
            return false;
        }

        const parent = entry.kind === "resource" ? this.getResourceRoot() : this.getTerrainRoot();
        if (!parent) {
            cc.warn("[MapEditor] Missing terrainRoot/resourceRoot.");
            return false;
        }

        const node = cc.instantiate(entry.prefab);
        node.name = this.createNodeName(entry.kind, entry.key);
        const scale = entry.kind === "resource" ? this.resourceScale : this.terrainScale;
        node.setScale(scale, scale);
        node.angle = this.rotation;

        if (entry.kind === "terrain") {
            node.setPosition(this.convertRootLocalToParentLocal(parent, rootLocal));
            parent.addChild(node);
        } else {
            parent.addChild(node);
            this.setPlacementNodePosition(node, parent, rootLocal, entry);
        }
        this.finalizePlacedNode(node, entry.kind);

        this.upsertPlacement(this.createPlacementState(node, entry.kind, entry.key, "manual"));
        this.commitEditorChangesToScene();
        return true;
    }

    private deleteAtWorld(world: cc.Vec2): void {
        const root = this.getTerrainRoot();
        if (!root || !world) {
            return;
        }

        const target = this.findGeneratedNodeAt(world);
        if (!target) {
            return;
        }

        this.removePlacement(target.name);
        target.destroy();
        this.commitEditorChangesToScene();
    }

    private generateInSelection(): void {
        if (!this.selectionStart || !this.selectionCurrent) {
            return;
        }
        const rect = this.createRect(this.selectionStart, this.selectionCurrent);
        if (rect.maxX - rect.minX < 64 || rect.maxY - rect.minY < 64) {
            return;
        }

        this.removePlacementsInRect(rect);
        const generator = this.getAutoMapGenerator();
        if (!generator) {
            cc.warn("[MapEditor] AutoMapGenerator is missing.");
            return;
        }
        const started = generator.beginTimedGenerationInRect(rect, {
            clearExisting: true,
            useRealtimeTimer: true,
            onPlacementSpawned: (state: MapEditorPlacementState) => {
                this.upsertPlacement(state);
                this.commitEditorChangesToScene();
            },
            onComplete: () => {
                this.commitEditorChangesToScene();
            }
        });
        if (!started) {
            this.commitEditorChangesToScene();
        }
    }

    private setTool(tool: MapEditorTool): void {
        this.tool = tool;
        if (this.tool === MapEditorTool.BoxGenerate) {
            this.destroyPlacementPreview();
            this.clearPlacementDebug();
        } else {
            this.clearSelection();
            this.previewKey = "";
            if (this.lastMouseRootLocal) {
                this.updatePlacementPreview(this.lastMouseRootLocal);
            }
        }
        this.refreshStatus();
        cc.log(`[MapEditor] Tool: ${tool} / ${this.getCurrentEntryKey()}`);
        EventCenter.emit(GameEvent.MAP_EDITOR_SELECTION_CHANGED, tool, this.getCurrentEntryKey());
    }

    private selectPrefab(direction: number): void {
        if (this.tool === MapEditorTool.Resource) {
            this.resourceIndex = this.wrapIndex(this.resourceIndex + direction, this.getResourceEntries().length);
        } else {
            this.terrainIndex = this.wrapIndex(this.terrainIndex + direction, this.getTerrainEntries().length);
        }
        this.previewKey = "";
        if (this.isEditing && this.tool !== MapEditorTool.BoxGenerate && this.lastMouseRootLocal) {
            this.updatePlacementPreview(this.lastMouseRootLocal);
        }
        this.refreshStatus();
        EventCenter.emit(GameEvent.MAP_EDITOR_SELECTION_CHANGED, this.tool, this.getCurrentEntryKey());
    }

    private adjustRotation(direction: number): void {
        this.rotation += this.rotationStep * direction;
        if (this.previewNode && cc.isValid(this.previewNode)) {
            this.previewNode.angle = this.rotation;
        }
        this.refreshStatus();
    }

    private rebuildFromState(state: MapEditorState): void {
        this.clearEditorNodes();
        this.placements = [];
        if (!state || !state.placements) {
            this.persistState(false);
            return;
        }

        for (let i = 0; i < state.placements.length; i++) {
            this.restorePlacement(state.placements[i]);
        }
        this.persistState(false);
    }

    private restorePlacement(state: MapEditorPlacementState): void {
        const entry = this.getEntryByKey(state.kind, state.prefabKey);
        const parent = state.kind === "resource" ? this.getResourceRoot() : this.getTerrainRoot();
        if (!entry || !entry.prefab || !parent) {
            return;
        }

        const node = cc.instantiate(entry.prefab);
        node.name = state.id || this.createNodeName(state.kind, state.prefabKey);
        node.scaleX = state.scaleX;
        node.scaleY = state.scaleY;
        node.angle = state.rotation;
        parent.addChild(node);
        this.setNodePositionFromRootLocal(node, parent, cc.v2(state.x, state.y));
        this.upsertPlacement(state);
    }

    private persistState(emitEvent: boolean = true): void {
        const state: MapEditorState = {
            mapId: "game-map-editor",
            editorVersion: "1",
            placements: this.placements.slice(),
            updatedAt: Date.now()
        };
        SaveService.setCurrentMapEditorState(state);
        if (emitEvent) {
            EventCenter.emit(GameEvent.MAP_EDITOR_STATE_CHANGED, state);
        }
        this.refreshStatus();
    }

    private commitEditorChangesToScene(): void {
        this.persistState(true);
        this.setGeneratedNodesVisible(this.getTerrainRoot());
        const resourceRoot = this.getResourceRoot();
        if (resourceRoot !== this.getTerrainRoot()) {
            this.setGeneratedNodesVisible(resourceRoot);
        }
    }

    private setGeneratedNodesVisible(root: cc.Node): void {
        if (!root) {
            return;
        }

        for (let i = 0; i < root.childrenCount; i++) {
            const child = root.children[i];
            if (this.isEditorOwnedNode(child) || this.isAutoGeneratedNode(child)) {
                child.active = true;
            }
        }
    }

    private refreshEditedPhysics(): void {
        this.applyPhysicsColliders(this.getTerrainRoot());
        const resourceRoot = this.getResourceRoot();
        if (resourceRoot !== this.getTerrainRoot()) {
            this.applyPhysicsColliders(resourceRoot);
        }

        const physicsManager = cc.director.getPhysicsManager() as any;
        if (physicsManager && typeof physicsManager.syncPosition === "function") {
            physicsManager.syncPosition();
        }
    }

    private applyPhysicsColliders(root: cc.Node): void {
        if (!root) {
            return;
        }

        for (let i = 0; i < root.childrenCount; i++) {
            const child = root.children[i];
            if (this.isEditorOwnedNode(child) || this.isAutoGeneratedNode(child)) {
                this.applyNodePhysicsColliders(child);
            }
        }
    }

    private applyNodePhysicsColliders(node: cc.Node): void {
        const colliders = node.getComponents(cc.PhysicsCollider);
        for (let i = 0; i < colliders.length; i++) {
            const collider = colliders[i] as any;
            if (collider && collider.enabled && typeof collider.apply === "function") {
                collider.apply();
            }
        }

        for (let i = 0; i < node.childrenCount; i++) {
            this.applyNodePhysicsColliders(node.children[i]);
        }
    }

    private finalizePlacedNode(node: cc.Node, kind: "terrain" | "resource"): void {
        if (!node || kind !== "terrain") {
            return;
        }

        // Manual terrain should become live terrain immediately, like AutoMapGenerator output.
        this.applyNodePhysicsColliders(node);
        this.syncPhysicsPosition();
    }

    private syncPhysicsPosition(): void {
        this.syncPhysicsPosition();
    }

    private onSaveLoaded(_saveData: SaveData): void {
        // Intentionally ignore backend/editor save data for now. Manual terrain
        // edits should stay in the live scene until the editor save flow is stable.
        this.refreshStatus();
    }

    private getTerrainEntries(): EditorPrefabEntry[] {
        const generator = this.getAutoMapGenerator();
        return [
            { key: "Rockleft", kind: "terrain", prefab: this.rockLeftPrefab || (generator && generator.rockLeftPrefab) },
            { key: "Rockright", kind: "terrain", prefab: this.rockRightPrefab || (generator && generator.rockRightPrefab) },
            { key: "Rockplatform3", kind: "terrain", prefab: this.rockPlatform3Prefab || (generator && generator.rockPlatform3Prefab) },
            { key: "Rockplatform4", kind: "terrain", prefab: this.rockPlatform4Prefab || (generator && generator.rockPlatform4Prefab) },
            { key: "Rockplatform5", kind: "terrain", prefab: this.rockPlatform5Prefab || (generator && generator.rockPlatform5Prefab) }
        ].filter(entry => !!entry.prefab);
    }

    private getResourceEntries(): EditorPrefabEntry[] {
        const generator = this.getAutoMapGenerator();
        return [
            { key: "applebush", kind: "resource", prefab: this.appleBushPrefab || (generator && generator.appleBushPrefab) },
            { key: "orerock", kind: "resource", prefab: this.oreRockPrefab || (generator && generator.oreRockPrefab) },
            { key: "fruitore", kind: "resource", prefab: this.fruitOrePrefab || (generator && generator.fruitOrePrefab) }
        ].filter(entry => !!entry.prefab);
    }

    private getCurrentEntry(): EditorPrefabEntry {
        const entries = this.tool === MapEditorTool.Resource ? this.getResourceEntries() : this.getTerrainEntries();
        if (entries.length === 0) {
            return null;
        }
        const index = this.tool === MapEditorTool.Resource ? this.resourceIndex : this.terrainIndex;
        return entries[this.wrapIndex(index, entries.length)];
    }

    private getEntryByKey(kind: "terrain" | "resource", key: string): EditorPrefabEntry {
        const entries = kind === "resource" ? this.getResourceEntries() : this.getTerrainEntries();
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].key === key) {
                return entries[i];
            }
        }
        return null;
    }

    private getCurrentEntryKey(): string {
        const entry = this.getCurrentEntry();
        return entry ? entry.key : "none";
    }

    private wrapIndex(index: number, length: number): number {
        if (length <= 0) {
            return 0;
        }
        return ((index % length) + length) % length;
    }

    private getTerrainRoot(): cc.Node {
        if (this.terrainRoot && cc.isValid(this.terrainRoot)) {
            return this.terrainRoot;
        }
        if (this.autoMapGenerator && cc.isValid(this.autoMapGenerator.node)) {
            const generatorRoot = this.autoMapGenerator.targetRoot;
            if (generatorRoot && cc.isValid(generatorRoot)) {
                return generatorRoot;
            }
            return this.autoMapGenerator.node;
        }
        return this.node;
    }

    private getResourceRoot(): cc.Node {
        if (this.resourceRoot && cc.isValid(this.resourceRoot)) {
            return this.resourceRoot;
        }
        if (this.autoMapGenerator && cc.isValid(this.autoMapGenerator.node)) {
            const generatorResourceRoot = this.autoMapGenerator.resourceRoot;
            if (generatorResourceRoot && cc.isValid(generatorResourceRoot)) {
                return generatorResourceRoot;
            }
        }
        return this.getTerrainRoot();
    }

    private getAutoMapGenerator(): AutoMapGenerator {
        if (this.autoMapGenerator && cc.isValid(this.autoMapGenerator.node)) {
            return this.autoMapGenerator;
        }
        this.autoMapGenerator = this.getComponent(AutoMapGenerator) || this.getTerrainRoot().getComponent(AutoMapGenerator);
        return this.autoMapGenerator;
    }

    private setPlayerLocked(locked: boolean): void {
        const player = this.playerNode && cc.isValid(this.playerNode)
            ? this.playerNode.getComponent(PlayerController)
            : null;
        if (player) {
            player.setExternalControlLocked(locked, "map-editor");
        }
    }

    private getMouseRootLocal(event: cc.Event.EventMouse): cc.Vec2 {
        const root = this.getTerrainRoot();
        const world = this.getMouseWorld(event);
        return root && world ? root.convertToNodeSpaceAR(world) : null;
    }

    private getMouseWorld(event: cc.Event.EventMouse): cc.Vec2 {
        return this.getWorldFromScreenLocation(this.getMouseScreenLocation(event));
    }

    private getBrowserMouseInput(event: any): { rootLocal: cc.Vec2, world: cc.Vec2 } {
        if (!event || typeof event.clientX !== "number" || typeof event.clientY !== "number") {
            return { rootLocal: null, world: null };
        }

        const screenLocation = this.getScreenLocationFromClient(event.clientX, event.clientY);
        const world = this.getWorldFromScreenLocation(screenLocation);
        const root = this.getTerrainRoot();
        return {
            rootLocal: root && world ? root.convertToNodeSpaceAR(world) : null,
            world
        };
    }

    private getWorldFromScreenLocation(screenLocation: cc.Vec2): cc.Vec2 {
        const camera = this.getCamera();
        if (camera) {
            return this.screenToWorld(camera, screenLocation);
        }
        return screenLocation;
    }

    private getMouseScreenLocation(event: cc.Event.EventMouse): cc.Vec2 {
        const anyEvent = event as any;
        const nativeEvent = anyEvent && (anyEvent._event || anyEvent.event || anyEvent.nativeEvent);
        if (nativeEvent && typeof nativeEvent.clientX === "number" && typeof nativeEvent.clientY === "number") {
            return this.getScreenLocationFromClient(nativeEvent.clientX, nativeEvent.clientY);
        }
        return event.getLocation();
    }

    private getScreenLocationFromClient(clientX: number, clientY: number): cc.Vec2 {
        const canvas = (cc.game as any).canvas;
        const rect = canvas && canvas.getBoundingClientRect
            ? canvas.getBoundingClientRect()
            : { left: 0, top: 0 };
        const location = cc.v2();
        cc.view.convertToLocationInView(clientX, clientY, rect, location);
        return location;
    }

    private screenToWorld(camera: cc.Camera, screenLocation: cc.Vec2): cc.Vec2 {
        const cameraNode = camera.node;
        const cameraWorld = cameraNode.parent
            ? cameraNode.parent.convertToWorldSpaceAR(cameraNode.position)
            : cc.v2(cameraNode.x, cameraNode.y);
        const visibleSize = cc.view.getVisibleSize();
        const zoom = Math.max(0.01, (camera as any).zoomRatio || 1);
        return cc.v2(
            cameraWorld.x + (screenLocation.x - visibleSize.width * 0.5) / zoom,
            cameraWorld.y + (screenLocation.y - visibleSize.height * 0.5) / zoom
        );
    }

    private preventBrowserMouseDefault(event: any): void {
        if (!event) {
            return;
        }
        if (typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        if (typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }
    }

    private getCamera(): cc.Camera {
        if (this.cameraRig && cc.isValid(this.cameraRig.node)) {
            return this.cameraRig.getComponent(cc.Camera);
        }
        if (CameraRig.instance && cc.isValid(CameraRig.instance.node)) {
            return CameraRig.instance.getComponent(cc.Camera);
        }
        const cameraNode = cc.find("Canvas/Main Camera");
        return cameraNode ? cameraNode.getComponent(cc.Camera) : null;
    }

    private setNodePositionFromRootLocal(node: cc.Node, parent: cc.Node, rootLocal: cc.Vec2): void {
        node.setPosition(this.convertRootLocalToParentLocal(parent, rootLocal));
    }

    private setEditorNodePosition(node: cc.Node, parent: cc.Node, rootLocal: cc.Vec2): void {
        this.setNodePositionFromRootLocal(node, parent, rootLocal);
        if (!this.alignPlacementCenterToCursor) {
            return;
        }

        const box = node.getBoundingBox();
        if (!box || box.width <= 0 || box.height <= 0) {
            return;
        }

        const visualCenterX = box.x + box.width * 0.5;
        const visualCenterY = box.y + box.height * 0.5;
        node.setPosition(
            node.x - (visualCenterX - node.x),
            node.y - (visualCenterY - node.y)
        );
    }

    private setPlacementNodePosition(
        node: cc.Node,
        parent: cc.Node,
        rootLocal: cc.Vec2,
        entry: EditorPrefabEntry
    ): void {
        if (entry.kind === "terrain") {
            this.setTerrainNodePosition(node, parent, rootLocal, entry.key);
            return;
        }
        this.setEditorNodePosition(node, parent, rootLocal);
    }

    private setTerrainNodePosition(node: cc.Node, parent: cc.Node, cursorRootLocal: cc.Vec2, _prefabKey: string): void {
        node.setPosition(this.convertRootLocalToParentLocal(parent, cursorRootLocal));
    }

    private convertRootLocalToParentLocal(parent: cc.Node, rootLocal: cc.Vec2): cc.Vec2 {
        const root = this.getTerrainRoot();
        if (!root || parent === root) {
            return rootLocal;
        }
        const world = root.convertToWorldSpaceAR(rootLocal);
        return parent.convertToNodeSpaceAR(world);
    }

    private createPlacementState(
        node: cc.Node,
        kind: "terrain" | "resource",
        prefabKey: string,
        source: "manual" | "box-generate"
    ): MapEditorPlacementState {
        const root = this.getTerrainRoot();
        const world = node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
        const local = root ? root.convertToNodeSpaceAR(world) : cc.v2(node.x, node.y);
        return {
            id: node.name,
            kind,
            prefabKey,
            x: local.x,
            y: local.y,
            rotation: node.angle || 0,
            scaleX: node.scaleX,
            scaleY: node.scaleY,
            source,
            updatedAt: Date.now()
        };
    }

    private createNodeName(kind: "terrain" | "resource", key: string): string {
        const prefix = kind === "resource" ? "EditorResource_" : "EditorRock_";
        return `${prefix}${Date.now()}_${Math.floor(Math.random() * 100000)}_${key}`;
    }

    private upsertPlacement(state: MapEditorPlacementState): void {
        if (!state || !state.id) {
            return;
        }
        this.removePlacement(state.id);
        this.placements.push(state);
    }

    private removePlacement(id: string): void {
        this.placements = this.placements.filter(placement => placement.id !== id);
    }

    private removePlacementsInRect(rect: MapGenerationRect): void {
        this.placements = this.placements.filter(placement =>
            placement.x < rect.minX || placement.x > rect.maxX || placement.y < rect.minY || placement.y > rect.maxY
        );
    }

    private clearEditorNodes(): void {
        this.clearEditorNodesInRoot(this.getTerrainRoot());
        const resourceRoot = this.getResourceRoot();
        if (resourceRoot !== this.getTerrainRoot()) {
            this.clearEditorNodesInRoot(resourceRoot);
        }
    }

    private clearEditorNodesInRoot(root: cc.Node): void {
        if (!root) {
            return;
        }
        for (let i = root.childrenCount - 1; i >= 0; i--) {
            const child = root.children[i];
            if (this.isEditorOwnedNode(child)) {
                child.destroy();
            }
        }
    }

    private findGeneratedNodeAt(world: cc.Vec2): cc.Node {
        const roots = [this.getResourceRoot(), this.getTerrainRoot()];
        for (let i = 0; i < roots.length; i++) {
            const found = this.findGeneratedNodeAtRoot(roots[i], world);
            if (found) {
                return found;
            }
        }
        return null;
    }

    private findGeneratedNodeAtRoot(root: cc.Node, world: cc.Vec2): cc.Node {
        if (!root) {
            return null;
        }
        for (let i = root.childrenCount - 1; i >= 0; i--) {
            const child = root.children[i];
            if (!this.isEditorOwnedNode(child)) {
                continue;
            }
            const box = child.getBoundingBoxToWorld();
            if (box && box.contains(world)) {
                return child;
            }
            const childWorld = child.parent ? child.parent.convertToWorldSpaceAR(child.position) : cc.v2(child.x, child.y);
            if (childWorld.sub(world).mag() <= this.deleteRadius) {
                return child;
            }
        }
        return null;
    }

    private isEditorOwnedNode(node: cc.Node): boolean {
        return !!node && (
            node.name.indexOf("EditorRock_") === 0
            || node.name.indexOf("EditorResource_") === 0
        );
    }

    private isAutoGeneratedNode(node: cc.Node): boolean {
        return !!node && (
            node.name.indexOf("AutoRock_") === 0
            || node.name.indexOf("AutoResource_") === 0
        );
    }

    private createRect(a: cc.Vec2, b: cc.Vec2): MapGenerationRect {
        return {
            minX: Math.min(a.x, b.x),
            minY: Math.min(a.y, b.y),
            maxX: Math.max(a.x, b.x),
            maxY: Math.max(a.y, b.y)
        };
    }

    private updatePlacementPreview(rootLocal: cc.Vec2): void {
        const entry = this.getCurrentEntry();
        if (!entry || !entry.prefab) {
            this.destroyPlacementPreview();
            return;
        }

        const parent = entry.kind === "resource" ? this.getResourceRoot() : this.getTerrainRoot();
        if (!parent) {
            this.destroyPlacementPreview();
            return;
        }

        const scale = entry.kind === "resource" ? this.resourceScale : this.terrainScale;
        const key = `${entry.kind}:${entry.key}:${scale}`;
        if (!this.previewNode || !cc.isValid(this.previewNode) || this.previewKey !== key || this.previewNode.parent !== parent) {
            this.destroyPlacementPreview();
            this.previewNode = cc.instantiate(entry.prefab);
            this.previewNode.name = `EditorPreview_${entry.key}`;
            this.previewNode.setScale(scale, scale);
            parent.addChild(this.previewNode);
            this.previewNode.active = true;
            this.previewNode.zIndex = 9998;
            this.disablePreviewPhysics(this.previewNode);
            this.setPreviewOpacity(this.previewNode, this.previewOpacity);
            this.previewKey = key;
        }

        this.previewNode.angle = this.rotation;
        this.previewNode.active = true;
        this.previewNode.zIndex = 9998;
        this.setPreviewOpacity(this.previewNode, this.previewOpacity);
        this.setPlacementNodePosition(this.previewNode, parent, rootLocal, entry);
        this.clearPlacementDebug();
    }

    private destroyPlacementPreview(): void {
        if (this.previewNode && cc.isValid(this.previewNode)) {
            this.previewNode.destroy();
        }
        this.previewNode = null;
        this.previewKey = "";
    }

    private drawTerrainPlacementDebug(cursorRootLocal: cc.Vec2, previewNode: cc.Node): void {
        if (!this.showPlacementDebug) {
            this.clearPlacementDebug();
            return;
        }

        const graphics = this.getOrCreatePlacementDebugGraphics();
        if (!graphics) {
            this.clearPlacementDebug();
            return;
        }

        graphics.clear();
        graphics.lineWidth = 3;

        const root = this.getTerrainRoot();
        if (previewNode && root) {
            const worldBox = previewNode.getBoundingBoxToWorld();
            if (worldBox && worldBox.width > 0 && worldBox.height > 0) {
                const min = root.convertToNodeSpaceAR(cc.v2(worldBox.x, worldBox.y));
                const max = root.convertToNodeSpaceAR(cc.v2(worldBox.x + worldBox.width, worldBox.y + worldBox.height));
                graphics.strokeColor = cc.Color.MAGENTA;
                graphics.rect(min.x, min.y, max.x - min.x, max.y - min.y);
                graphics.stroke();
            }
        }

        this.drawDebugCross(graphics, cursorRootLocal, 26, cc.Color.YELLOW);
        this.drawDebugCross(graphics, cursorRootLocal, 18, cc.Color.CYAN);
    }

    private drawDebugCross(graphics: cc.Graphics, point: cc.Vec2, size: number, color: cc.Color): void {
        graphics.strokeColor = color;
        graphics.moveTo(point.x - size, point.y);
        graphics.lineTo(point.x + size, point.y);
        graphics.moveTo(point.x, point.y - size);
        graphics.lineTo(point.x, point.y + size);
        graphics.stroke();
    }

    private getOrCreatePlacementDebugGraphics(): cc.Graphics {
        if (this.placementDebugGraphics && cc.isValid(this.placementDebugGraphics.node)) {
            this.placementDebugGraphics.node.active = true;
            return this.placementDebugGraphics;
        }

        const root = this.getTerrainRoot() || this.node;
        if (!this.runtimePlacementDebugNode || !cc.isValid(this.runtimePlacementDebugNode)) {
            this.runtimePlacementDebugNode = new cc.Node("MapEditorPlacementDebug");
            this.runtimePlacementDebugNode.zIndex = 9999;
            root.addChild(this.runtimePlacementDebugNode);
            this.placementDebugGraphics = this.runtimePlacementDebugNode.addComponent(cc.Graphics);
        } else if (this.runtimePlacementDebugNode.parent !== root) {
            this.runtimePlacementDebugNode.removeFromParent(false);
            root.addChild(this.runtimePlacementDebugNode);
        }

        this.runtimePlacementDebugNode.active = true;
        return this.placementDebugGraphics;
    }

    private clearPlacementDebug(): void {
        if (this.placementDebugGraphics && cc.isValid(this.placementDebugGraphics.node)) {
            this.placementDebugGraphics.clear();
        }
    }

    private destroyRuntimePlacementDebug(): void {
        if (this.runtimePlacementDebugNode && cc.isValid(this.runtimePlacementDebugNode)) {
            this.runtimePlacementDebugNode.destroy();
        }
        this.runtimePlacementDebugNode = null;
    }

    private disablePreviewPhysics(node: cc.Node): void {
        if (!node) {
            return;
        }

        const body = node.getComponent(cc.RigidBody);
        if (body) {
            body.enabled = false;
        }

        const colliders = node.getComponents(cc.PhysicsCollider);
        for (let i = 0; i < colliders.length; i++) {
            colliders[i].enabled = false;
        }

        for (let i = 0; i < node.childrenCount; i++) {
            this.disablePreviewPhysics(node.children[i]);
        }
    }

    private setPreviewOpacity(node: cc.Node, opacity: number): void {
        if (!node) {
            return;
        }

        node.opacity = Math.max(0, Math.min(255, opacity));
        for (let i = 0; i < node.childrenCount; i++) {
            this.setPreviewOpacity(node.children[i], opacity);
        }
    }

    private drawSelection(): void {
        const graphics = this.getSelectionGraphics();
        if (!graphics || !this.selectionStart || !this.selectionCurrent) {
            return;
        }
        const rect = this.createRect(this.selectionStart, this.selectionCurrent);
        graphics.clear();
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.Color.YELLOW;
        graphics.fillColor = new cc.Color(255, 220, 40, 32);
        graphics.rect(rect.minX, rect.minY, rect.maxX - rect.minX, rect.maxY - rect.minY);
        graphics.fill();
        graphics.stroke();
    }

    private clearSelection(): void {
        this.selectionStart = null;
        this.selectionCurrent = null;
        if (this.selectionGraphics) {
            this.selectionGraphics.clear();
        }
    }

    private getSelectionGraphics(): cc.Graphics {
        if (this.selectionGraphics && cc.isValid(this.selectionGraphics.node)) {
            return this.selectionGraphics;
        }

        const root = this.getTerrainRoot() || this.node;
        if (!root) {
            return null;
        }

        const node = new cc.Node("EditorSelectionPreview");
        root.addChild(node);
        this.selectionGraphics = node.addComponent(cc.Graphics);
        return this.selectionGraphics;
    }

    private refreshStatus(): void {
        if (!this.editorStatusLabel) {
            return;
        }
        this.editorStatusLabel.string = this.isEditing
            ? `Editor: ${this.tool} / ${this.getCurrentEntryKey()} / rot ${this.rotation}`
            : "Editor: off";
    }
}
