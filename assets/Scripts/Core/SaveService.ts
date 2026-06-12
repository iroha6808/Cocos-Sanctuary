import { ItemAmount } from "../Player/InventoryManager";

export interface UserRecord {
    username: string;
    password: string;
    createdAt: number;
    lastLoginAt: number;
    lastLogoutAt: number;
    loginCount: number;
}

export interface SaveData {
    username: string;
    score: number;
    exp: number;
    hp: number;
    maxHp: number;
    inventory: ItemAmount[];
    mapState?: MapGenerationState;
    mapEditorState?: MapEditorState;
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

export interface RealtimePlayerState {
    clientId: string;
    sessionId: string;
    username: string;
    displayName: string;
    scene: string;
    position: {
        x: number;
        y: number;
    };
    hp: number;
    maxHp: number;
    score: number;
    exp: number;
    inventorySummary: ItemAmount[];
    inventorySlotCount: number;
    inventoryTotalCount: number;
    status: string;
    updatedAt: number;
}

export interface MapGenerationState {
    mapId: string;
    seed: string;
    generatorVersion: string;
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    prefabScale: number;
    patternCount: number;
    slopePatternCount: number;
    rockCount: number;
    slopeRockCount: number;
    scatterCount: number;
    settings: {
        rowCount: number;
        minSeparation: number;
        connectGapMin: number;
        connectGapMax: number;
        minPatternCount: number;
        maxPatternCount: number;
        minSlopePatternCount: number;
        slopePatternChance: number;
    };
    updatedAt: number;
}

export interface MapEditorPlacementState {
    id: string;
    kind: "terrain" | "resource";
    prefabKey: string;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    source: "manual" | "box-generate";
    updatedAt: number;
}

export interface MapEditorState {
    mapId: string;
    editorVersion: string;
    placements: MapEditorPlacementState[];
    updatedAt: number;
}

export interface AuthResult {
    ok: boolean;
    message: string;
}

export interface UserSummary {
    username: string;
    createdAt: number;
    lastLoginAt: number;
    lastLogoutAt: number;
    loginCount: number;
    hasSave: boolean;
    saveUpdatedAt: number;
}

export interface SaveSummary {
    username: string;
    score: number;
    exp: number;
    hp: number;
    maxHp: number;
    inventorySlotCount: number;
    inventoryTotalCount: number;
    hasMapState: boolean;
    mapSeed: string;
    mapGeneratedAt: number;
    updatedAt: number;
}

export interface BackendSnapshot {
    currentUsername: string;
    isLoggedIn: boolean;
    clientId: string;
    sessionId: string;
    generatedAt: number;
    users: UserSummary[];
    saves: SaveSummary[];
    leaderboard: LeaderboardEntry[];
    realtimePlayers: RealtimePlayerState[];
    currentMap: MapGenerationState;
    currentMapEditor: MapEditorState;
    lastRun: LastRunData;
    storageKeys: string[];
}

export default class SaveService {
    private static readonly USERS_KEY = "cocos_sanctuary.users";
    private static readonly CURRENT_USER_KEY = "cocos_sanctuary.current_user";
    private static readonly SAVE_PREFIX = "cocos_sanctuary.save.";
    private static readonly LEADERBOARD_KEY = "cocos_sanctuary.leaderboard";
    private static readonly LOAD_NEXT_KEY = "cocos_sanctuary.load_next_game";
    private static readonly MAP_EDITOR_NEXT_KEY = "cocos_sanctuary.map_editor_next_game";
    private static readonly LAST_RUN_KEY = "cocos_sanctuary.last_run";
    private static readonly REALTIME_PLAYERS_KEY = "cocos_sanctuary.realtime.players";
    private static readonly CLIENT_ID_KEY = "cocos_sanctuary.client_id";
    private static readonly CURRENT_MAP_KEY = "cocos_sanctuary.map_generation.current";
    private static readonly CURRENT_MAP_EDITOR_KEY = "cocos_sanctuary.map_editor.current";
    private static readonly SESSION_ID = `session_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

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
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            lastLogoutAt: 0,
            loginCount: 1
        };
        this.writeJson(this.USERS_KEY, users);
        this.setCurrentUser(cleanUsername);
        return { ok: true, message: `Registered ${cleanUsername}.` };
    }

    public static login(username: string, password: string): AuthResult {
        const cleanUsername = this.normalizeUsername(username);
        const users = this.getUsers();
        const user = users[cleanUsername];
        if (!user || user.password !== password) {
            return { ok: false, message: "Login failed." };
        }

        user.lastLoginAt = Date.now();
        user.loginCount = Math.max(0, Math.floor(user.loginCount || 0)) + 1;
        users[cleanUsername] = this.normalizeUserRecord(user, cleanUsername);
        this.writeJson(this.USERS_KEY, users);
        this.setCurrentUser(cleanUsername);
        return { ok: true, message: `Logged in as ${cleanUsername}.` };
    }

    public static logout(): void {
        const username = this.getCurrentUsername();
        if (username) {
            const users = this.getUsers();
            const user = users[username];
            if (user) {
                user.lastLogoutAt = Date.now();
                users[username] = this.normalizeUserRecord(user, username);
                this.writeJson(this.USERS_KEY, users);
            }
        }
        cc.sys.localStorage.removeItem(this.CURRENT_USER_KEY);
        cc.sys.localStorage.removeItem(this.LOAD_NEXT_KEY);
        cc.sys.localStorage.removeItem(this.MAP_EDITOR_NEXT_KEY);
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
            mapState: this.normalizeMapGenerationState(data.mapState || this.getCurrentMapGenerationState()),
            mapEditorState: this.normalizeMapEditorState(data.mapEditorState || this.getCurrentMapEditorState()),
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
        return this.normalizeSaveData(this.readJson<SaveData>(this.SAVE_PREFIX + cleanUsername, null), cleanUsername);
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

    public static requestMapEditorOnNextGame(): void {
        cc.sys.localStorage.setItem(this.MAP_EDITOR_NEXT_KEY, "1");
    }

    public static consumeLoadOnNextGame(): boolean {
        const shouldLoad = cc.sys.localStorage.getItem(this.LOAD_NEXT_KEY) === "1";
        cc.sys.localStorage.removeItem(this.LOAD_NEXT_KEY);
        return shouldLoad;
    }

    public static consumeMapEditorOnNextGame(): boolean {
        const shouldOpen = cc.sys.localStorage.getItem(this.MAP_EDITOR_NEXT_KEY) === "1";
        cc.sys.localStorage.removeItem(this.MAP_EDITOR_NEXT_KEY);
        return shouldOpen;
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

    public static upsertRealtimePlayerState(data: RealtimePlayerState): RealtimePlayerState[] {
        if (!data) {
            return this.getRealtimePlayers();
        }

        const username = this.normalizeUsername(data.username) || "guest";
        const entries = this.getRealtimePlayers();
        const safeState = this.normalizeRealtimeState(data, username);
        const existing = entries.find(entry =>
            entry.clientId === safeState.clientId && entry.sessionId === safeState.sessionId
        );

        if (existing) {
            existing.clientId = safeState.clientId;
            existing.sessionId = safeState.sessionId;
            existing.displayName = safeState.displayName;
            existing.scene = safeState.scene;
            existing.position = safeState.position;
            existing.hp = safeState.hp;
            existing.maxHp = safeState.maxHp;
            existing.score = safeState.score;
            existing.exp = safeState.exp;
            existing.inventorySummary = safeState.inventorySummary;
            existing.inventorySlotCount = safeState.inventorySlotCount;
            existing.inventoryTotalCount = safeState.inventoryTotalCount;
            existing.status = safeState.status;
            existing.updatedAt = safeState.updatedAt;
        } else {
            entries.push(safeState);
        }

        entries.sort((a, b) => b.updatedAt - a.updatedAt);
        this.writeJson(this.REALTIME_PLAYERS_KEY, entries);
        return this.getRealtimePlayers();
    }

    public static getRealtimePlayers(): RealtimePlayerState[] {
        const entries = this.readJson<RealtimePlayerState[]>(this.REALTIME_PLAYERS_KEY, []);
        return (entries || [])
            .filter(entry => !!entry && !!entry.username)
            .map(entry => this.normalizeRealtimeState(entry, this.normalizeUsername(entry.username) || "guest"))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }

    public static clearStaleRealtimePlayers(staleAfterMs: number = 10000): RealtimePlayerState[] {
        const now = Date.now();
        const safeStaleAfterMs = Math.max(1000, staleAfterMs || 10000);
        const entries = this.getRealtimePlayers().filter(entry => now - entry.updatedAt <= safeStaleAfterMs);
        this.writeJson(this.REALTIME_PLAYERS_KEY, entries);
        return entries;
    }

    public static getClientId(): string {
        let clientId = cc.sys.localStorage.getItem(this.CLIENT_ID_KEY);
        if (!clientId) {
            clientId = `client_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
            cc.sys.localStorage.setItem(this.CLIENT_ID_KEY, clientId);
        }
        return clientId;
    }

    public static getSessionId(): string {
        return this.SESSION_ID;
    }

    public static setCurrentMapGenerationState(data: MapGenerationState): MapGenerationState {
        const safeState = this.normalizeMapGenerationState(data);
        if (safeState) {
            this.writeJson(this.CURRENT_MAP_KEY, safeState);
        }
        return safeState;
    }

    public static getCurrentMapGenerationState(): MapGenerationState {
        return this.normalizeMapGenerationState(this.readJson<MapGenerationState>(this.CURRENT_MAP_KEY, null));
    }

    public static setCurrentMapEditorState(data: MapEditorState): MapEditorState {
        const safeState = this.normalizeMapEditorState(data);
        if (safeState) {
            this.writeJson(this.CURRENT_MAP_EDITOR_KEY, safeState);
        }
        return safeState;
    }

    public static getCurrentMapEditorState(): MapEditorState {
        return this.normalizeMapEditorState(this.readJson<MapEditorState>(this.CURRENT_MAP_EDITOR_KEY, null));
    }

    public static getUserSummaries(): UserSummary[] {
        const users = this.getUsers();
        return Object.keys(users)
            .sort()
            .map(username => {
                const user = this.normalizeUserRecord(users[username], username);
                const save = this.loadGame(username);
                return {
                    username: user.username,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    lastLogoutAt: user.lastLogoutAt,
                    loginCount: user.loginCount,
                    hasSave: !!save,
                    saveUpdatedAt: save ? save.updatedAt || 0 : 0
                };
            });
    }

    public static getSaveSummaries(): SaveSummary[] {
        const users = this.getUsers();
        const summaries: SaveSummary[] = [];
        for (const username of Object.keys(users)) {
            const save = this.loadGame(username);
            if (!save) {
                continue;
            }
            const inventory = this.normalizeInventory(save.inventory || []);
            summaries.push({
                username,
                score: Math.max(0, Math.floor(save.score || 0)),
                exp: Math.max(0, Math.floor(save.exp || 0)),
                hp: Math.max(0, Math.floor(save.hp || 0)),
                maxHp: Math.max(1, Math.floor(save.maxHp || 1)),
                inventorySlotCount: inventory.length,
                inventoryTotalCount: this.getInventoryTotalCount(inventory),
                hasMapState: !!save.mapState,
                mapSeed: save.mapState ? save.mapState.seed : "",
                mapGeneratedAt: save.mapState ? save.mapState.updatedAt : 0,
                updatedAt: save.updatedAt || 0
            });
        }
        return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    public static getStorageKeys(): string[] {
        const storage = cc.sys.localStorage as any;
        const keys: string[] = [];
        if (storage && typeof storage.length === "number" && typeof storage.key === "function") {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (typeof key === "string" && key.indexOf("cocos_sanctuary.") === 0) {
                    keys.push(key);
                }
            }
        }
        return keys.sort();
    }

    public static getBackendSnapshot(): BackendSnapshot {
        return {
            currentUsername: this.getCurrentUsername(),
            isLoggedIn: this.isLoggedIn(),
            clientId: this.getClientId(),
            sessionId: this.getSessionId(),
            generatedAt: Date.now(),
            users: this.getUserSummaries(),
            saves: this.getSaveSummaries(),
            leaderboard: this.getLeaderboard(),
            realtimePlayers: this.getRealtimePlayers(),
            currentMap: this.getCurrentMapGenerationState(),
            currentMapEditor: this.getCurrentMapEditorState(),
            lastRun: this.getLastRun(),
            storageKeys: this.getStorageKeys()
        };
    }

    private static setCurrentUser(username: string): void {
        cc.sys.localStorage.setItem(this.CURRENT_USER_KEY, username);
    }

    private static getUsers(): { [username: string]: UserRecord } {
        const rawUsers = this.readJson<{ [username: string]: UserRecord }>(this.USERS_KEY, {});
        const users: { [username: string]: UserRecord } = {};
        for (const username of Object.keys(rawUsers || {})) {
            const cleanUsername = this.normalizeUsername(username);
            if (!cleanUsername) {
                continue;
            }
            users[cleanUsername] = this.normalizeUserRecord(rawUsers[username], cleanUsername);
        }
        return users;
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

    private static normalizeSaveData(data: SaveData, username: string): SaveData | null {
        if (!data) {
            return null;
        }
        return {
            username,
            score: Math.max(0, Math.floor(data.score || 0)),
            exp: Math.max(0, Math.floor(data.exp || 0)),
            hp: Math.max(0, Math.floor(data.hp || 0)),
            maxHp: Math.max(1, Math.floor(data.maxHp || 1)),
            inventory: this.normalizeInventory(data.inventory || []),
            mapState: this.normalizeMapGenerationState(data.mapState),
            mapEditorState: this.normalizeMapEditorState(data.mapEditorState),
            updatedAt: data.updatedAt || 0
        };
    }

    private static normalizeUserRecord(user: UserRecord, username: string): UserRecord {
        return {
            username,
            password: user && user.password ? user.password : "",
            createdAt: user && user.createdAt ? user.createdAt : Date.now(),
            lastLoginAt: user && user.lastLoginAt ? user.lastLoginAt : 0,
            lastLogoutAt: user && user.lastLogoutAt ? user.lastLogoutAt : 0,
            loginCount: Math.max(0, Math.floor(user && user.loginCount ? user.loginCount : 0))
        };
    }

    private static normalizeRealtimeState(data: RealtimePlayerState, username: string): RealtimePlayerState {
        const position = data.position || { x: 0, y: 0 };
        const inventory = this.normalizeInventory(data.inventorySummary || []);
        return {
            clientId: data.clientId || this.getClientId(),
            sessionId: data.sessionId || this.getSessionId(),
            username,
            displayName: data.displayName || username,
            scene: data.scene || "Game",
            position: {
                x: isFinite(position.x) ? position.x : 0,
                y: isFinite(position.y) ? position.y : 0
            },
            hp: Math.max(0, Math.floor(data.hp || 0)),
            maxHp: Math.max(1, Math.floor(data.maxHp || 1)),
            score: Math.max(0, Math.floor(data.score || 0)),
            exp: Math.max(0, Math.floor(data.exp || 0)),
            inventorySummary: inventory,
            inventorySlotCount: Math.max(0, Math.floor(data.inventorySlotCount || inventory.length)),
            inventoryTotalCount: Math.max(0, Math.floor(data.inventoryTotalCount || this.getInventoryTotalCount(inventory))),
            status: data.status || "online",
            updatedAt: data.updatedAt || Date.now()
        };
    }

    private static getInventoryTotalCount(items: ItemAmount[]): number {
        return (items || []).reduce((total, item) => total + Math.max(0, Math.floor(item.count || 0)), 0);
    }

    private static normalizeMapGenerationState(data: MapGenerationState): MapGenerationState {
        if (!data) {
            return null;
        }
        const bounds = data.bounds || { minX: -5000, maxX: 0, minY: -2000, maxY: 0 };
        const settings = data.settings || {
            rowCount: 0,
            minSeparation: 0,
            connectGapMin: 0,
            connectGapMax: 0,
            minPatternCount: 0,
            maxPatternCount: 0,
            minSlopePatternCount: 0,
            slopePatternChance: 0
        };
        return {
            mapId: data.mapId || "auto-map",
            seed: data.seed || "sanctuary-jump-map-1",
            generatorVersion: data.generatorVersion || "unknown",
            bounds: {
                minX: isFinite(bounds.minX) ? bounds.minX : -5000,
                maxX: isFinite(bounds.maxX) ? bounds.maxX : 0,
                minY: isFinite(bounds.minY) ? bounds.minY : -2000,
                maxY: isFinite(bounds.maxY) ? bounds.maxY : 0
            },
            prefabScale: Math.max(0.01, data.prefabScale || 1),
            patternCount: Math.max(0, Math.floor(data.patternCount || 0)),
            slopePatternCount: Math.max(0, Math.floor(data.slopePatternCount || 0)),
            rockCount: Math.max(0, Math.floor(data.rockCount || 0)),
            slopeRockCount: Math.max(0, Math.floor(data.slopeRockCount || 0)),
            scatterCount: Math.max(0, Math.floor(data.scatterCount || 0)),
            settings: {
                rowCount: Math.max(0, Math.floor(settings.rowCount || 0)),
                minSeparation: Math.max(0, settings.minSeparation || 0),
                connectGapMin: Math.max(0, settings.connectGapMin || 0),
                connectGapMax: Math.max(0, settings.connectGapMax || 0),
                minPatternCount: Math.max(0, Math.floor(settings.minPatternCount || 0)),
                maxPatternCount: Math.max(0, Math.floor(settings.maxPatternCount || 0)),
                minSlopePatternCount: Math.max(0, Math.floor(settings.minSlopePatternCount || 0)),
                slopePatternChance: Math.max(0, Math.min(1, settings.slopePatternChance || 0))
            },
            updatedAt: data.updatedAt || Date.now()
        };
    }

    private static normalizeMapEditorState(data: MapEditorState): MapEditorState {
        if (!data) {
            return null;
        }
        const placements = (data.placements || [])
            .filter(placement => !!placement && !!placement.prefabKey && !!placement.kind)
            .map(placement => this.normalizeMapEditorPlacement(placement))
            .filter(placement => !!placement);
        return {
            mapId: data.mapId || "game-map-editor",
            editorVersion: data.editorVersion || "1",
            placements,
            updatedAt: data.updatedAt || Date.now()
        };
    }

    private static normalizeMapEditorPlacement(data: MapEditorPlacementState): MapEditorPlacementState {
        const kind = data.kind === "resource" ? "resource" : "terrain";
        const source = data.source === "box-generate" ? "box-generate" : "manual";
        return {
            id: data.id || `editor_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            kind,
            prefabKey: data.prefabKey || "",
            x: isFinite(data.x) ? data.x : 0,
            y: isFinite(data.y) ? data.y : 0,
            rotation: isFinite(data.rotation) ? data.rotation : 0,
            scaleX: isFinite(data.scaleX) ? data.scaleX : 1,
            scaleY: isFinite(data.scaleY) ? data.scaleY : 1,
            source,
            updatedAt: data.updatedAt || Date.now()
        };
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
