export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }
    
    preload() {
        // 加载所有游戏资源
        this.load.image('player', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/phaser-dude.png');
        this.load.spritesheet('enemy', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples/public/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
        
        // 子弹素材
        this.load.image('pistolBullet', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/bullets/bullet7.png');
        this.load.image('shotgunBullet', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/bullets/bullet5.png');
        this.load.image('rifleBullet', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/bullets/bullet8.png');
        this.load.image('sniperBullet', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/bullets/bullet3.png');
        
        this.load.image('soul', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/particles/blue.png');
        this.load.image('trap', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/spike.png');
        this.load.image('chest', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/crate32.png');

        // UI资源
        this.load.image('joystick', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/block.png');
        this.load.image('joystickBase', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/padback.png');
        this.load.image('button', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/ui/blue_button01.png');
        this.load.image('healthbar', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/healthbar.png');

        // 怪物子弹
        this.load.image('enemyBullet', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/bullets/bullet6.png');
        
        // 特效素材
        this.load.image('particle', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/particles/red.png');
        this.load.image('blood', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/particles/red.png');
        
        // 显示加载进度
        const loadingText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            '加载中...', 
            { fontSize: '32px', fill: '#fff' }
        ).setOrigin(0.5);
        
        this.load.on('progress', (value) => {
            loadingText.setText(`加载中: ${Math.floor(value * 100)}%`);
        });
        
        this.load.on('complete', () => {
            loadingText.destroy();
        });
    }
    
    create() {
        // 创建动画
        this.createAnimations();
        
        // 加载完成后跳转到游戏场景
        this.scene.start('Game');
    }
    
    createAnimations() {
        // 创建敌人动画
        this.anims.create({
            key: 'enemyWalk',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemyWalkLeft',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemyWalkRight',
            frames: this.anims.generateFrameNumbers('enemy', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }
}
