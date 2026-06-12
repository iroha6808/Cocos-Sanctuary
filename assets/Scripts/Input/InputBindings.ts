import { InputAction } from "./InputAction";

const KEY_ESCAPE = 27;
const KEY_M = 77;
const KEY_EQUAL_OR_PLUS = 187;
const KEY_MINUS = 189;
const KEY_NUMPAD_PLUS = 107;
const KEY_NUMPAD_MINUS = 109;
const KEY_G = 71;
const KEY_E = 69;
const KEY_Q = 81;
const KEY_R = 82;
const KEY_1 = 49;
const KEY_2 = 50;
const KEY_3 = 51;
const KEY_NUMPAD_1 = 97;
const KEY_NUMPAD_2 = 98;
const KEY_NUMPAD_3 = 99;
const KEY_LEFT_BRACKET = 219;
const KEY_RIGHT_BRACKET = 221;

export function getActionForKey(keyCode: number): InputAction {
    switch (keyCode) {
        case cc.macro.KEY.a:
            return InputAction.MoveLeft;
        case cc.macro.KEY.d:
            return InputAction.MoveRight;
        case cc.macro.KEY.w:
            return InputAction.MoveUp;
        case cc.macro.KEY.s:
            return InputAction.MoveDown;
        case cc.macro.KEY.up:
            return InputAction.NavigateUp;
        case cc.macro.KEY.down:
            return InputAction.NavigateDown;
        case cc.macro.KEY.left:
            return InputAction.AdjustLeft;
        case cc.macro.KEY.right:
            return InputAction.AdjustRight;
        case cc.macro.KEY.space:
            return InputAction.Jump;
        case cc.macro.KEY.f:
            return InputAction.Interact;
        case cc.macro.KEY.b:
            return InputAction.Inventory;
        case cc.macro.KEY.c:
            return InputAction.Crafting;
        case cc.macro.KEY.enter:
            return InputAction.Confirm;
        case cc.macro.KEY.escape:
        case KEY_ESCAPE:
            return InputAction.Cancel;
        case cc.macro.KEY.m:
        case KEY_M:
            return InputAction.ToggleMute;
        case KEY_EQUAL_OR_PLUS:
        case KEY_NUMPAD_PLUS:
            return InputAction.CameraZoomIn;
        case KEY_MINUS:
        case KEY_NUMPAD_MINUS:
            return InputAction.CameraZoomOut;
        case cc.macro.KEY.g:
        case KEY_G:
            return InputAction.GenerateMap;
        case cc.macro.KEY.e:
        case KEY_E:
            return InputAction.ToggleMapEditor;
        case KEY_1:
        case KEY_NUMPAD_1:
            return InputAction.EditorTerrainTool;
        case KEY_2:
        case KEY_NUMPAD_2:
            return InputAction.EditorResourceTool;
        case KEY_3:
        case KEY_NUMPAD_3:
            return InputAction.EditorBoxGenerateTool;
        case cc.macro.KEY.q:
        case KEY_Q:
            return InputAction.EditorPreviousPrefab;
        case cc.macro.KEY.r:
        case KEY_R:
            return InputAction.EditorNextPrefab;
        case KEY_LEFT_BRACKET:
            return InputAction.EditorRotateLeft;
        case KEY_RIGHT_BRACKET:
            return InputAction.EditorRotateRight;
        case cc.macro.KEY.t:
            return InputAction.DebugAddCoconut;
        case cc.macro.KEY.y:
            return InputAction.DebugAddCraftItems;
        default:
            return null!;
    }
}

export function getActionForKeyboardEvent(event: cc.Event.EventKeyboard): InputAction {
    if (!event) {
        return null!;
    }

    const action = getActionForKey(event.keyCode);
    if (action) {
        return action;
    }

    const key = getKeyboardString(event, "key");
    switch (key) {
        case "1":
            return InputAction.EditorTerrainTool;
        case "2":
            return InputAction.EditorResourceTool;
        case "3":
            return InputAction.EditorBoxGenerateTool;
    }

    const code = getKeyboardString(event, "code");
    switch (code) {
        case "digit1":
        case "numpad1":
            return InputAction.EditorTerrainTool;
        case "digit2":
        case "numpad2":
            return InputAction.EditorResourceTool;
        case "digit3":
        case "numpad3":
            return InputAction.EditorBoxGenerateTool;
    }

    return null!;
}

function getKeyboardString(event: cc.Event.EventKeyboard, field: string): string {
    const anyEvent = event as any;
    const nativeEvent = anyEvent && (anyEvent._event || anyEvent.event || anyEvent.nativeEvent);
    const value = anyEvent && typeof anyEvent[field] === "string"
        ? anyEvent[field]
        : nativeEvent && typeof nativeEvent[field] === "string"
            ? nativeEvent[field]
            : "";
    return value.toLowerCase();
}

export function isOneShotAction(action: InputAction): boolean {
    switch (action) {
        case InputAction.Attack:
        case InputAction.Interact:
        case InputAction.Inventory:
        case InputAction.Crafting:
        case InputAction.Confirm:
        case InputAction.Cancel:
        case InputAction.ToggleMute:
        case InputAction.CameraZoomIn:
        case InputAction.CameraZoomOut:
        case InputAction.GenerateMap:
        case InputAction.DebugAddCoconut:
        case InputAction.DebugAddCraftItems:
            return true;
        default:
            return false;
    }
}
