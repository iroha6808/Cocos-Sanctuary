import { ItemAmount } from "../Player/InventoryManager";

export interface UserRecord {
    username: string;
    password: string;
    createdAt: number;
}

export interface SaveData {
    username: string;
    score: number;
    exp: number;
    hp: number;
    maxHp: number;
    inventory: ItemAmount[];
    updatedAt: number;
}

export interface LeaderboardEntry {
    username: string;
    score: number;
    updatedAt: number;
}

export interface LastRunData {
    username: string;
    score: number;
    exp: number;
    updatedAt: number;
}

export interface AuthResult {
    ok: boolean;
    message: string;
}

export default class SaveService {
    private static readonly USERS_KEY = "cocos_sanctuary.users";
    private static readonly CURRENT_USER_KEY = "cocos_sanctuary.current_user";
    private static readonly SAVE_PREFIX = "cocos_sanctuary.save.";
    private static readonly LEADERBOARD_KEY = "cocos_sanctuary.leaderboard";
    private static readonly LOAD_NEXT_KEY = "cocos_sanctuary.load_next_game";
    private static readonly LAST_RUN_KEY = "cocos_sanctuary.last_run";

    public static register(username: string, password: string): AuthResult {
        const cleanUsername = this.normalizeUsername(username);
        if (!cleanUsername || !password) {
            return { ok: false, message: "Username and password are required." };
        }

        const users = this.getUsers();
        if (users[cleanUsername]) {
            return { ok: false, message: "User already exists." };
        }

        users[cleanUsername] = {
            username: cleanUsername,
            password,
            createdAt: Date.now()
        };
        this.writeJson(this.USERS_KEY, users);
        this.setCurrentUser(cleanUsername);
        return { ok: true, message: `Registered ${cleanUsername}.` };
    }

    public static login(username: string, password: string): AuthResult {
        const cleanUsername = this.normalizeUsername(username);
        const user = this.getUsers()[cleanUsername];
        if (!user || user.password !== password) {
            return { ok: false, message: "Login failed." };
        }

        this.setCurrentUser(cleanUsername);
        return { ok: true, message: `Logged in as ${cleanUsername}.` };
    }

    public static logout(): void {
        cc.sys.localStorage.removeItem(this.CURRENT_USER_KEY);
        cc.sys.localStorage.removeItem(this.LOAD_NEXT_KEY);
    }

    public static getCurrentUsername(): string {
        return cc.sys.localStorage.getItem(this.CURRENT_USER_KEY) || "";
    }

    public static isLoggedIn(): boolean {
        return !!this.getCurrentUsername();
    }

    public static saveGame(data: SaveData): boolean {
        const username = this.normalizeUsername(data ? data.username : "");
        if (!username) {
            return false;
        }

        const safeData: SaveData = {
            username,
            score: Math.max(0, Math.floor(data.score || 0)),
            exp: Math.max(0, Math.floor(data.exp || 0)),
            hp: Math.max(0, Math.floor(data.hp || 0)),
            maxHp: Math.max(1, Math.floor(data.maxHp || 1)),
            inventory: this.normalizeInventory(data.inventory || []),
            updatedAt: data.updatedAt || Date.now()
        };
        this.writeJson(this.SAVE_PREFIX + username, safeData);
        return true;
    }

    public static loadGame(username: string = this.getCurrentUsername()): SaveData | null {
        const cleanUsername = this.normalizeUsername(username);
        if (!cleanUsername) {
            return null;
        }
        return this.readJson<SaveData>(this.SAVE_PREFIX + cleanUsername, null);
    }

    public static hasSave(username: string = this.getCurrentUsername()): boolean {
        return !!this.loadGame(username);
    }

    public static requestLoadOnNextGame(): boolean {
        if (!this.hasSave()) {
            return false;
        }
        cc.sys.localStorage.setItem(this.LOAD_NEXT_KEY, "1");
        return true;
    }

    public static consumeLoadOnNextGame(): boolean {
        const shouldLoad = cc.sys.localStorage.getItem(this.LOAD_NEXT_KEY) === "1";
        cc.sys.localStorage.removeItem(this.LOAD_NEXT_KEY);
        return shouldLoad;
    }

    public static submitScore(username: string, score: number): LeaderboardEntry[] {
        const cleanUsername = this.normalizeUsername(username) || "guest";
        const safeScore = Math.max(0, Math.floor(score || 0));
        const entries = this.getLeaderboard();
        const existing = entries.find(entry => entry.username === cleanUsername);
        if (existing) {
            existing.score = Math.max(existing.score, safeScore);
            existing.updatedAt = Date.now();
        } else {
            entries.push({
                username: cleanUsername,
                score: safeScore,
                updatedAt: Date.now()
            });
        }

        entries.sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt);
        this.writeJson(this.LEADERBOARD_KEY, entries.slice(0, 10));
        return this.getLeaderboard();
    }

    public static getLeaderboard(): LeaderboardEntry[] {
        const entries = this.readJson<LeaderboardEntry[]>(this.LEADERBOARD_KEY, []);
        return entries
            .filter(entry => !!entry && !!entry.username)
            .map(entry => ({
                username: entry.username,
                score: Math.max(0, Math.floor(entry.score || 0)),
                updatedAt: entry.updatedAt || 0
            }))
            .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
            .slice(0, 10);
    }

    public static setLastRun(data: LastRunData): void {
        const username = this.normalizeUsername(data ? data.username : "") || "guest";
        this.writeJson(this.LAST_RUN_KEY, {
            username,
            score: Math.max(0, Math.floor(data.score || 0)),
            exp: Math.max(0, Math.floor(data.exp || 0)),
            updatedAt: data.updatedAt || Date.now()
        });
    }

    public static getLastRun(): LastRunData {
        return this.readJson<LastRunData>(this.LAST_RUN_KEY, {
            username: this.getCurrentUsername() || "guest",
            score: 0,
            exp: 0,
            updatedAt: Date.now()
        });
    }

    private static setCurrentUser(username: string): void {
        cc.sys.localStorage.setItem(this.CURRENT_USER_KEY, username);
    }

    private static getUsers(): { [username: string]: UserRecord } {
        return this.readJson<{ [username: string]: UserRecord }>(this.USERS_KEY, {});
    }

    private static normalizeUsername(username: string): string {
        return (username || "").trim().toLowerCase();
    }

    private static normalizeInventory(items: ItemAmount[]): ItemAmount[] {
        const totals: { [itemId: string]: number } = {};
        for (const item of items || []) {
            if (!item || !item.itemId || !isFinite(item.count) || item.count <= 0) {
                continue;
            }
            totals[item.itemId] = (totals[item.itemId] || 0) + Math.floor(item.count);
        }
        return Object.keys(totals).map(itemId => ({ itemId, count: totals[itemId] }));
    }

    private static readJson<T>(key: string, fallback: T): T {
        const raw = cc.sys.localStorage.getItem(key);
        if (!raw) {
            return fallback;
        }

        try {
            return JSON.parse(raw) as T;
        } catch (error) {
            cc.warn(`[SaveService] Invalid localStorage JSON for ${key}.`);
            return fallback;
        }
    }

    private static writeJson(key: string, value: any): void {
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    }
}
