export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOver' });
    }
    
    init(data) {
        this.score = data.score || 0;
    }
    
    create() {
        // 创建半透明黑色背景
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        ).setScrollFactor(0).setDepth(1999);

        // 显示游戏结束文本
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 100,
            '游戏结束',
            {
                fontSize: '64px',
                fontStyle: 'bold',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
        
        // 添加闪烁效果
        this.tweens.add({
            targets: gameOverText,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 显示得分
        const scoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '最终魂点: ' + this.score,
            {
                fontSize: '36px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(2000);

        // 重新开始按钮
        const restartButton = this.add.image(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            'button'
        ).setScale(1.5)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setInteractive({ useHandCursor: true });
            
        // 按钮悬停效果
        restartButton.on('pointerover', function() {
            restartButton.setTint(0x88ff88);
        });
        
        restartButton.on('pointerout', function() {
            restartButton.clearTint();
        });

        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            '重新开始',
            {
                fontSize: '28px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        // 添加重新开始点击事件
        restartButton.on('pointerdown', () => {
            this.scene.start('Game');
        });
        
        // 显示键盘控制提示
        const controlsHint = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 150,
            '按J键升级武器 | 按K键切换自动射击 | 按L键射击',
            {
                fontSize: '18px',
                fill: '#cccccc',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
    }
}
