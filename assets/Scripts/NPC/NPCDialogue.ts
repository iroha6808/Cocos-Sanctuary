export interface DialogueOption {
    id: string;
    label: string;
}

export interface DialogueContent {
    line: string;
    options: DialogueOption[];
}

export const DialogueOptionId = {
    Trade: "trade",
    Chat: "chat",
    Leave: "leave"
};
