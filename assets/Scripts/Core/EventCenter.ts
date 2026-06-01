type EventCallback = (...args: any[]) => void;

interface EventListener {
    callback: EventCallback;
    handler: EventCallback;
    target?: any;
}

export default class EventCenter {
    private static _events: Map<string, EventListener[]> = new Map();

    public static on(eventName: string, callback: EventCallback, target?: any) {
        if (!eventName || !callback) {
            return;
        }

        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }

        const listeners = this._events.get(eventName);
        const existed = listeners.some(listener => {
            return listener.callback === callback && listener.target === target;
        });

        if (existed) {
            return;
        }

        listeners.push({
            callback,
            target,
            handler: target ? callback.bind(target) : callback
        });
    }

    public static emit(eventName: string, ...args: any[]) {
        const listeners = this._events.get(eventName);
        if (!listeners || listeners.length === 0) {
            return;
        }

        const snapshot = listeners.slice();
        for (const listener of snapshot) {
            if (!this.hasListener(eventName, listener)) {
                continue;
            }

            listener.handler(...args);
        }
    }

    public static off(eventName: string, callback?: EventCallback, target?: any) {
        const listeners = this._events.get(eventName);
        if (!listeners) {
            return;
        }

        if (!callback) {
            this._events.delete(eventName);
            return;
        }

        const remaining = listeners.filter(listener => {
            const sameCallback = listener.callback === callback;
            const sameTarget = target === undefined || listener.target === target;
            return !(sameCallback && sameTarget);
        });

        if (remaining.length === 0) {
            this._events.delete(eventName);
            return;
        }

        this._events.set(eventName, remaining);
    }

    public static clear() {
        this._events.clear();
    }

    private static hasListener(eventName: string, listener: EventListener) {
        const listeners = this._events.get(eventName);
        return !!listeners && listeners.indexOf(listener) !== -1;
    }
}
