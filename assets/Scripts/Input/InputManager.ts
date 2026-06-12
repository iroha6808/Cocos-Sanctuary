import { getActionForKeyboardEvent, isOneShotAction } from "./InputBindings";
import { InputAction, InputPayload, InputSource } from "./InputAction";
import { InputContext } from "./InputContext";

const { ccclass } = cc._decorator;

export type InputHandler = (payload: InputPayload) => boolean;

interface InputContextEntry {
    context: InputContext;
    handler: InputHandler;
    owner: any;
}

const ONE_SHOT_DEBOUNCE_MS = 160;
const INPUT_EVENT_HANDLED_FLAG = "__cocosSanctuaryInputHandled";

export function isInputEventHandled(event: any): boolean {
    return !!event && !!event[INPUT_EVENT_HANDLED_FLAG];
}

export function markInputEventHandled(event: any): void {
    if (event) {
        event[INPUT_EVENT_HANDLED_FLAG] = true;
    }
}

@ccclass
export default class InputManager extends cc.Component {
    public static instance: InputManager = null;

    private contextStack: InputContextEntry[] = [];
    private lastActionTimes: { [action: string]: number } = {};
    private pressedKeyboardActions: { [action: string]: boolean } = {};
    private canvasNode: cc.Node | null = null;

    public static getOrCreate(hostNode?: cc.Node): InputManager {
        if (InputManager.instance && cc.isValid(InputManager.instance.node)) {
            return InputManager.instance;
        }

        const existingManager = InputManager.findInCurrentScene();
        if (existingManager) {
            return existingManager;
        }

        const targetNode = hostNode || cc.find("Canvas") || cc.director.getScene();
        if (!targetNode) {
            return null;
        }

        let manager = targetNode.getComponent(InputManager);
        if (!manager) {
            manager = targetNode.addComponent(InputManager);
        }
        return manager;
    }

    private static findInCurrentScene(): InputManager {
        const scene = cc.director.getScene();
        if (!scene) {
            return null;
        }

        const managers = scene.getComponentsInChildren(InputManager);
        for (const manager of managers) {
            if (manager && cc.isValid(manager.node)) {
                return manager;
            }
        }
        return null;
    }

    onLoad(): void {
        if (InputManager.instance && InputManager.instance !== this) {
            this.destroy();
            return;
        }

        InputManager.instance = this;
        this.bindInputEvents();
    }

    onDestroy(): void {
        this.unbindInputEvents();
        if (InputManager.instance === this) {
            InputManager.instance = null;
        }
        this.contextStack = [];
        this.lastActionTimes = {};
        this.pressedKeyboardActions = {};
    }

    public pushContext(context: InputContext, handler: InputHandler, owner?: any): void {
        if (!context || !handler) {
            return;
        }

        this.popContext(context, owner);
        this.contextStack.push({
            context,
            handler: owner ? handler.bind(owner) : handler,
            owner
        });
    }

    public popContext(context: InputContext, owner?: any): void {
        for (let index = this.contextStack.length - 1; index >= 0; index--) {
            const entry = this.contextStack[index];
            if (entry.context !== context) {
                continue;
            }
            if (owner !== undefined && entry.owner !== owner) {
                continue;
            }
            this.contextStack.splice(index, 1);
        }
    }

    public clearOwner(owner: any): void {
        if (owner === undefined || owner === null) {
            return;
        }
        this.contextStack = this.contextStack.filter(entry => entry.owner !== owner);
    }

    private bindInputEvents(): void {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.canvasNode = cc.find("Canvas");
        if (this.canvasNode) {
            this.canvasNode.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
            this.canvasNode.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }
    }

    private unbindInputEvents(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        if (this.canvasNode && cc.isValid(this.canvasNode)) {
            this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
            this.canvasNode.off(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }
        this.canvasNode = null;
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        const action = getActionForKeyboardEvent(event);
        if (!action) {
            return;
        }

        if (isOneShotAction(action)) {
            if (this.pressedKeyboardActions[action]) {
                return;
            }
            this.pressedKeyboardActions[action] = true;
        }

        // PlayerController still owns gameplay input. If that handler opened
        // a UI with this event, do not immediately close/confirm the new UI.
        if (isInputEventHandled(event)) {
            return;
        }

        this.dispatch({
            action,
            isDown: true,
            source: InputSource.Keyboard,
            originalEvent: event
        });

        if (handled) {
            markInputEventHandled(event);
            if (event && typeof event.stopPropagation === "function") {
                event.stopPropagation();
            }
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard): void {
        const action = getActionForKeyboardEvent(event);
        if (!action) {
            return;
        }

        if (isOneShotAction(action)) {
            delete this.pressedKeyboardActions[action];
        }

        if (isInputEventHandled(event)) {
            return;
        }

        const handled = this.dispatch({
            action,
            isDown: false,
            source: InputSource.Keyboard,
            originalEvent: event
        });

        if (handled) {
            markInputEventHandled(event);
            if (event && typeof event.stopPropagation === "function") {
                event.stopPropagation();
            }
        }
    }

    private onMouseDown(event: cc.Event.EventMouse): void {
        if (event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) {
            return;
        }

        if (this.isActionCoolingDown(InputAction.Attack)) {
            return;
        }

        this.dispatch({
            action: InputAction.Attack,
            isDown: true,
            source: InputSource.Mouse,
            originalEvent: event
        });
    }

    private onMouseWheel(event: cc.Event.EventMouse): void {
        const wheelY = event.getScrollY();
        if (wheelY === 0) {
            return;
        }

        this.dispatch({
            action: wheelY < 0 ? InputAction.NavigateDown : InputAction.NavigateUp,
            isDown: true,
            source: InputSource.Wheel,
            wheelY,
            originalEvent: event
        });
    }

    private dispatch(payload: InputPayload): boolean {
        for (let index = this.contextStack.length - 1; index >= 0; index--) {
            const entry = this.contextStack[index];
            if (!entry || !entry.handler) {
                continue;
            }
            if (entry.handler(payload)) {
                return true;
            }
        }
        return false;
    }

    private isActionCoolingDown(action: InputAction): boolean {
        const now = Date.now();
        const lastTime = this.lastActionTimes[action] || 0;
        if (now - lastTime < ONE_SHOT_DEBOUNCE_MS) {
            return true;
        }
        this.lastActionTimes[action] = now;
        return false;
    }
}
