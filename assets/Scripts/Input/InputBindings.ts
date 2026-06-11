import { InputAction } from "./InputAction";

const KEY_ESCAPE = 27;
const KEY_M = 77;
const KEY_EQUAL_OR_PLUS = 187;
const KEY_MINUS = 189;
const KEY_NUMPAD_PLUS = 107;
const KEY_NUMPAD_MINUS = 109;

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
        case cc.macro.KEY.t:
            return InputAction.DebugAddCoconut;
        case cc.macro.KEY.y:
            return InputAction.DebugAddCraftItems;
        default:
            return null!;
    }
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
        case InputAction.DebugAddCoconut:
        case InputAction.DebugAddCraftItems:
            return true;
        default:
            return false;
    }
}
