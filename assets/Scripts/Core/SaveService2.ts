import { ItemAmount } from "../Player/InventoryManager";

declare const firebase: any;

export interface SaveData {
    uid: string;
    score: number;
    exp: number;
    hp: number;
    maxHp: number;
    inventory: ItemAmount[];
    updatedAt: number;
}

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    score: number;
    updatedAt: number;
}

export default class SaveService2 {
    public static async saveToCloud(uid: string, data: Partial<SaveData>): Promise<boolean> {
        if (!uid) return false;
        try {
            const db = firebase.firestore();
            const existingSave = await this.loadFromCloud(uid) || this.getDefaultSave(uid);
            const newData: SaveData = { ...existingSave, ...data, updatedAt: Date.now() };
            await db.collection("players").doc(uid).set(newData, { merge: true });
            cc.log(`[SaveService] ☁️ 玩家 ${uid} 進度已同步至雲端！`);
            return true;
        } catch (error) {
            cc.error("雲端存檔失敗:", error);
            return false;
        }
    }

    public static async loadFromCloud(uid: string): Promise<SaveData | null> {
        if (!uid) return null;
        try {
            const db = firebase.firestore();
            const doc = await db.collection("players").doc(uid).get();
            if (doc.exists) {
                cc.log(`[SaveService] ☁️ 成功讀取雲端存檔！`);
                return doc.data() as SaveData;
            }
            return null;
        } catch (error) {
            cc.error("讀取雲端存檔失敗:", error);
            return null;
        }
    }

    public static async submitScoreToCloud(uid: string, displayName: string, score: number): Promise<void> {
        if (!uid || score <= 0) return;
        try {
            const db = firebase.firestore();
            const lbRef = db.collection("leaderboard").doc(uid);
            const doc = await lbRef.get();

            if (doc.exists) {
                const currentScore = doc.data().score;
                if (score > currentScore) {
                    await lbRef.set({ uid, displayName, score, updatedAt: Date.now() }, { merge: true });
                    cc.log(`[SaveService] ☁️ 破紀錄！排行榜已更新！`);
                }
            } else {
                await lbRef.set({ uid, displayName, score, updatedAt: Date.now() });
                cc.log(`[SaveService] ☁️ 新玩家上榜！`);
            }
        } catch (error) {
            cc.error("上傳分數失敗:", error);
        }
    }

    public static async getTopLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection("leaderboard")
                                     .orderBy("score", "desc")
                                     .limit(10)
                                     .get();
            
            const entries: LeaderboardEntry[] = [];
            snapshot.forEach(doc => entries.push(doc.data() as LeaderboardEntry));
            return entries;
        } catch (error) {
            cc.error("獲取排行榜失敗:", error);
            return [];
        }
    }

    public static getDefaultSave(uid: string): SaveData {
        return { uid, score: 0, exp: 0, hp: 100, maxHp: 100, inventory: [], updatedAt: Date.now() };
    }
}