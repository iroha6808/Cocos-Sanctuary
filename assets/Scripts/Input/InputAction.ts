export enum InputAction {
    MoveLeft = "MoveLeft",
    MoveRight = "MoveRight",
    MoveUp = "MoveUp",
    MoveDown = "MoveDown",
    Jump = "Jump",
    Attack = "Attack",
    Interact = "Interact",
    Inventory = "Inventory",
    Crafting = "Crafting",
    Confirm = "Confirm",
    Cancel = "Cancel",
    NavigateUp = "NavigateUp",
    NavigateDown = "NavigateDown",
    AdjustLeft = "AdjustLeft",
    AdjustRight = "AdjustRight",
    ToggleMute = "ToggleMute",
    CameraZoomIn = "CameraZoomIn",
    CameraZoomOut = "CameraZoomOut",
    GenerateMap = "GenerateMap",
    ToggleMapEditor = "ToggleMapEditor",
    EditorTerrainTool = "EditorTerrainTool",
    EditorResourceTool = "EditorResourceTool",
    EditorBoxGenerateTool = "EditorBoxGenerateTool",
    EditorPreviousPrefab = "EditorPreviousPrefab",
    EditorNextPrefab = "EditorNextPrefab",
    EditorRotateLeft = "EditorRotateLeft",
    EditorRotateRight = "EditorRotateRight",
    DebugAddCoconut = "DebugAddCoconut",
    DebugAddCraftItems = "DebugAddCraftItems"
}

export enum InputSource {
    Keyboard = "Keyboard",
    Mouse = "Mouse",
    Wheel = "Wheel"
}

export interface InputPayload {
    action: InputAction;
    isDown: boolean;
    source: InputSource;
    wheelY?: number;
    originalEvent?: any;
}
