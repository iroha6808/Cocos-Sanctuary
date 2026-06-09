const { ccclass, property } = cc._decorator;

@ccclass
export default class OceanPrefabBuilder extends cc.Component {
    @property
    buildOnLoad: boolean = true;

    @property
    clearOldGeneratedContent: boolean = true;

    @property
    generatedRootName: string = "GeneratedContent";

    onLoad() {
        if (this.buildOnLoad) {
            this.buildOceanContent();
        }
    }

    private buildOceanContent(): void {
        if (this.clearOldGeneratedContent) {
            this.clearGeneratedContent();
        }

        const root = this.createChild(this.node, this.generatedRootName);
        root.zIndex = -60;

        const skyIslands = this.createChild(root, "SkyIslands");
        const oceanPlatforms = this.createChild(root, "OceanPlatforms");
        const decorations = this.createChild(root, "Decorations");

        this.buildSkyIslands(skyIslands);
        this.buildOceanPlatforms(oceanPlatforms);
        this.buildDecorations(decorations);
    }

    private clearGeneratedContent(): void {
        const oldRoot = this.node.getChildByName(this.generatedRootName);
        if (oldRoot) {
            oldRoot.destroy();
        }
    }

    private buildSkyIslands(parent: cc.Node): void {
        this.createSolidPlatform(parent, "SkyIsland_01", cc.v2(-280, 260), cc.size(260, 36), cc.color(92, 168, 88));
        this.createSolidPlatform(parent, "SkyIsland_02", cc.v2(80, 360), cc.size(220, 36), cc.color(92, 168, 88));
        this.createSolidPlatform(parent, "SkyIsland_03", cc.v2(390, 230), cc.size(280, 36), cc.color(92, 168, 88));
    }

    private buildOceanPlatforms(parent: cc.Node): void {
        this.createSolidPlatform(parent, "OceanRock_01", cc.v2(-360, -210), cc.size(220, 42), cc.color(93, 110, 128));
        this.createSolidPlatform(parent, "OceanRock_02", cc.v2(-40, -330), cc.size(260, 42), cc.color(93, 110, 128));
        this.createSolidPlatform(parent, "OceanRock_03", cc.v2(320, -180), cc.size(240, 42), cc.color(93, 110, 128));
    }

    private buildDecorations(parent: cc.Node): void {
        this.createDecoration(parent, "SeaGrass_01", cc.v2(-450, -450), cc.size(36, 90), cc.color(55, 150, 120));
        this.createDecoration(parent, "SeaGrass_02", cc.v2(-170, -455), cc.size(32, 70), cc.color(55, 150, 120));
        this.createDecoration(parent, "Coral_01", cc.v2(180, -455), cc.size(70, 58), cc.color(200, 92, 120));
        this.createDecoration(parent, "Coral_02", cc.v2(430, -455), cc.size(64, 52), cc.color(220, 130, 85));
    }

    private createSolidPlatform(parent: cc.Node, name: string, position: cc.Vec2, size: cc.Size, color: cc.Color): cc.Node {
        const platform = this.createChild(parent, name);
        platform.setPosition(position.x, position.y);
        platform.width = size.width;
        platform.height = size.height;
        platform.zIndex = -50;

        const graphics = platform.addComponent(cc.Graphics);
        graphics.fillColor = color;
        graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
        graphics.fill();

        const rigidBody = platform.addComponent(cc.RigidBody);
        rigidBody.type = cc.RigidBodyType.Static;

        const collider = platform.addComponent(cc.PhysicsBoxCollider);
        collider.sensor = false;
        collider.size = size;
        collider.offset = cc.v2(0, 0);
        collider.apply();

        return platform;
    }

    private createDecoration(parent: cc.Node, name: string, position: cc.Vec2, size: cc.Size, color: cc.Color): cc.Node {
        const decoration = this.createChild(parent, name);
        decoration.setPosition(position.x, position.y);
        decoration.width = size.width;
        decoration.height = size.height;
        decoration.zIndex = -65;

        const graphics = decoration.addComponent(cc.Graphics);
        graphics.fillColor = color;
        graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
        graphics.fill();

        return decoration;
    }

    private createChild(parent: cc.Node, name: string): cc.Node {
        const child = new cc.Node(name);
        child.parent = parent;
        child.setPosition(0, 0);
        return child;
    }
}