export default class EventCenter {
    private static _events: Map<string, Function[]> = new Map();

    public static on(eventName: string, callback: Function, target?: any) {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        this._events.get(eventName).push(callback.bind(target));
    }

    public static emit(eventName: string, ...args: any[]) {
        if (this._events.has(eventName)) {
            let callbacks = this._events.get(eventName);
            for (let cb of callbacks) {
                cb(...args);
            }
        }
    }

    public static off(eventName: string, callback: Function) {
        if (this._events.has(eventName)) {
            let callbacks = this._events.get(eventName);
            let index = callbacks.findIndex(cb => cb === callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}