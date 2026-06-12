const { ccclass, property } = cc._decorator;

declare const firebase: any;

@ccclass
export default class AuthUIController extends cc.Component {

    @property(cc.Node)
    authPanel: cc.Node = null;

    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    onLoad() {
        if (this.authPanel) {
            this.authPanel.active = false;
        }
        this.initFirebase();
    }

    private initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyCq9gGI7AFY8zY82HLUdJLuDzK1HeUs1EM",
            authDomain: "coconut-sanctuary.firebaseapp.com",
            projectId: "coconut-sanctuary",
            storageBucket: "coconut-sanctuary.firebasestorage.app",
            messagingSenderId: "300648797657",
            appId: "1:300648797657:web:dce0646506855e761fb5c8",
            measurementId: "G-70LXBJCEZY"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            cc.log("[Firebase] 椰子聖地連線成功！");
        }
    }

    public openAuthPanel() {
        if (this.authPanel) {
            this.authPanel.active = true;
        }
    }

    public closeAuthPanel() {
        if (this.authPanel) {
            this.authPanel.active = false;
        }
    }

    public onLoginSubmit() {
        const email = this.emailInput.string;
        const password = this.passwordInput.string;

        if (!email || !password) {
            cc.warn("請輸入帳號密碼！");
            return;
        }

        cc.log(`嘗試登入: ${email}...`);
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                cc.log("登入成功！跳轉至 Game 場景...");
                cc.director.loadScene("Game"); 
            })
            .catch((error) => {
                cc.error("登入失敗:", error.code, error.message);
            });
    }

    public onRegisterSubmit() {
        const email = this.emailInput.string;
        const password = this.passwordInput.string;

        if (!email || !password) {
            cc.warn("請輸入帳號密碼！");
            return;
        }

        cc.log(`嘗試註冊: ${email}...`);
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                cc.log("註冊成功！跳轉至 Game 場景...");
                cc.director.loadScene("Game");
            })
            .catch((error) => {
                cc.error("註冊失敗:", error.code, error.message);
            });
    }
}