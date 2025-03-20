export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }
    
    preload() {
        // 创建模拟资源（使用生成的几何图形）而不是加载外部资源
        this.createMockResources();
        
        // 显示加载进度
        const loadingText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            '准备游戏...', 
            { fontSize: '32px', fill: '#fff' }
        ).setOrigin(0.5);
        
        // 短暂延迟后开始游戏
        this.time.delayedCall(1000, () => {
            loadingText.destroy();
        });
    }
    
    createMockResources() {
        // 创建各种纹理，使用生成的图形
        this.createCircleTexture('soul', 16, 0x4444ff);
        this.createCircleTexture('particle', 8, 0xff4444);
        this.createCircleTexture('blood', 8, 0xff0000);
        
        this.createRectTexture('player', 32, 48, 0x00ff00);
        this.createRectTexture('enemy', 32, 48, 0xff0000);
        this.createRectTexture('healthbar', 200, 20, 0x00ff00);
        
        this.createRectTexture('pistolBullet', 8, 8, 0xffffff);
        this.createRectTexture('shotgunBullet', 6, 6, 0xff8800);
        this.createRectTexture('rifleBullet', 10, 4, 0x00ff00);
        this.createRectTexture('sniperBullet', 12, 4, 0xff0000);
        this.createRectTexture('enemyBullet', 6, 6, 0xff0000);
        
        this.createRectTexture('button', 100, 40, 0x4444ff, true);
        this.createCircleTexture('joystick', 20, 0x0000ff);
        this.createCircleTexture('joystickBase', 50, 0x000044);
        
        this.createRectTexture('trap', 16, 16, 0xff0000);
        this.createRectTexture('chest', 32, 32, 0xffdd00);
        
        // 创建敌人方向指示箭头
        this.createArrowTexture('directionArrow', 20, 0xffff00);
        
        // 创建精灵表 - 为敌人动画创建多帧
        this.createEnemySpriteSheet();
    }
    
    // 新增：创建箭头纹理
    createArrowTexture(key, size, color) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color);
        
        // 绘制一个简单的三角形箭头
        graphics.beginPath();
        graphics.moveTo(size, 0);         // 箭头尖端
        graphics.lineTo(-size/2, -size/2); // 箭头左边
        graphics.lineTo(-size/2, size/2);  // 箭头右边
        graphics.closePath();
        graphics.fillPath();
        
        graphics.generateTexture(key, size * 1.5, size);
        graphics.clear();
    }
    
    createCircleTexture(key, radius, color) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color);
        graphics.fillCircle(radius, radius, radius);
        graphics.generateTexture(key, radius * 2, radius * 2);
        graphics.clear();
    }
    
    createRectTexture(key, width, height, color, rounded = false) {
        const graphics = this.make.graphics();
        graphics.fillStyle(color);
        
        if (rounded) {
            graphics.fillRoundedRect(0, 0, width, height, 8);
        } else {
            graphics.fillRect(0, 0, width, height);
        }
        
        graphics.generateTexture(key, width, height);
        graphics.clear();
    }
    
    createEnemySpriteSheet() {
        // 创建一个包含多帧的精灵表
        const graphics = this.make.graphics();
        const frameWidth = 32;
        const frameHeight = 48;
        const totalFrames = 9; // 9帧动画
        
        // 创建一个大图像，包含所有帧
        for (let i = 0; i < totalFrames; i++) {
            graphics.fillStyle(i < 4 ? 0xff0000 : 0xff4400); // 不同颜色区分不同动画
            const x = i * frameWidth;
            graphics.fillRect(x, 0, frameWidth - 2, frameHeight - 2);
        }
        
        graphics.generateTexture('enemySheet', frameWidth * totalFrames, frameHeight);
        graphics.clear();
        
        // 创建精灵表配置
        const textureManager = this.textures.get('enemySheet');
        const frames = [];
        
        for (let i = 0; i < totalFrames; i++) {
            frames.push({
                key: 'enemySheet',
                frame: i,
                x: i * frameWidth,
                y: 0,
                width: frameWidth,
                height: frameHeight
            });
        }
        
        this.textures.addSpriteSheet('enemy', 'enemySheet', {
            frameWidth: frameWidth,
            frameHeight: frameHeight
        });
    }
    
    create() {
        // 创建动画
        this.createAnimations();
        
        // 加载完成后跳转到游戏场景
        this.scene.start('Game');
    }
    
    createAnimations() {
        try {
            // 创建敌人走路动画 - 更安全的方式
            if (!this.anims.exists('enemyWalk')) {
                this.anims.create({
                    key: 'enemyWalk',
                    frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                    frameRate: 8,
                    repeat: -1
                });
                console.log("成功创建enemyWalk动画");
            }
            
            if (!this.anims.exists('enemyWalkLeft')) {
                this.anims.create({
                    key: 'enemyWalkLeft',
                    frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                    frameRate: 10,
                    repeat: -1
                });
                console.log("成功创建enemyWalkLeft动画");
            }
            
            if (!this.anims.exists('enemyWalkRight')) {
                this.anims.create({
                    key: 'enemyWalkRight',
                    frames: this.anims.generateFrameNumbers('enemy', { start: 5, end: 8 }),
                    frameRate: 10,
                    repeat: -1
                });
                console.log("成功创建enemyWalkRight动画");
            }
        } catch (error) {
            console.error("Error creating animations:", error);
            
            // 创建简单的后备动画
            try {
                if (!this.anims.exists('enemyWalk')) {
                    this.anims.create({
                        key: 'enemyWalk',
                        frames: [{ key: 'enemy', frame: 0 }],
                        frameRate: 1,
                        repeat: 0
                    });
                }
                
                if (!this.anims.exists('enemyWalkLeft')) {
                    this.anims.create({
                        key: 'enemyWalkLeft',
                        frames: [{ key: 'enemy', frame: 0 }],
                        frameRate: 1,
                        repeat: 0
                    });
                }
                
                if (!this.anims.exists('enemyWalkRight')) {
                    this.anims.create({
                        key: 'enemyWalkRight',
                        frames: [{ key: 'enemy', frame: 0 }],
                        frameRate: 1,
                        repeat: 0
                    });
                }
                console.log("已创建后备动画");
            } catch (e) {
                console.error("创建后备动画失败:", e.message);
            }
        }
    }
}
