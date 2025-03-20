export class UIManager {
    constructor(scene, player, weaponSystem) {
        this.scene = scene;
        this.player = player;
        this.weaponSystem = weaponSystem;
        
        // UI元素
        this.healthBar = null;
        this.soulPointsText = null;
        this.weaponText = null;
        this.chestNotification = null;
        
        // 创建UI元素
        this.createUI();
    }
    
    createUI() {
        // 创建UI - 健康和魂点显示
        // 血条背景
        this.scene.add.image(110, 30, 'healthbar')
            .setScrollFactor(0)
            .setScale(0.8)
            .setDepth(1000)
            .setTint(0x000000)
            .setAlpha(0.7);

        // 血条
        this.healthBar = this.scene.add.image(110, 30, 'healthbar')
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setScale(0.8, 0.6)
            .setDepth(1001);

        this.soulPointsText = this.scene.add.text(20, 50, '魂点: 0', {
            fontSize: '22px',
            fill: '#ffffff'
        })
            .setScrollFactor(0)
            .setDepth(1000);

        // 宝箱通知文本
        this.chestNotification = this.scene.add.text(20, 110, '', {
            fontSize: '18px',
            fill: '#ffd700'
        })
            .setScrollFactor(0)
            .setDepth(1000)
            .setAlpha(0);

        // 当前武器显示
        this.weaponText = this.scene.add.text(20, 80, '', {
            fontSize: '18px',
            fill: '#ffffff'
        })
            .setScrollFactor(0)
            .setDepth(1000);
        
        // 键盘控制提示文本（已移除射击和升级武器的提示）
        this.keyboardControlsText = this.scene.add.text(20, 140, '键盘控制: [WASD] 移动', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        })
            .setScrollFactor(0)
            .setDepth(1000);
        
        // 添加自动射击提示
        this.autoFireText = this.scene.add.text(20, 170, '自动射击: 已启用', {
            fontSize: '16px',
            fill: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        })
            .setScrollFactor(0)
            .setDepth(1000);
        
        // 添加自动升级提示
        this.autoUpgradeText = this.scene.add.text(20, 200, '自动升级: 已启用', {
            fontSize: '16px',
            fill: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        })
            .setScrollFactor(0)
            .setDepth(1000);
        
        // 初始化UI状态
        this.updateHealthBar();
        this.updateWeaponText();
    }
    
    updateHealthBar() {
        const healthPercent = Phaser.Math.Clamp(this.player.health / 100, 0, 1);
        this.healthBar.scaleX = 0.8 * healthPercent;

        // 根据血量变色
        if (healthPercent > 0.6) {
            this.healthBar.setTint(0x00ff00); // 绿色
        } else if (healthPercent > 0.3) {
            this.healthBar.setTint(0xffff00); // 黄色
        } else {
            this.healthBar.setTint(0xff0000); // 红色
        }
    }
    
    updateSoulPoints(soulPoints) {
        this.soulPointsText.setText('魂点: ' + soulPoints);
    }
    
    updateWeaponText() {
        const weapon = this.weaponSystem.getCurrentWeapon();
        this.weaponText.setText('武器: ' + weapon.name +
            '\n射程: ' + weapon.range +
            '\n伤害: ' + weapon.damage);
        this.weaponText.setColor('#' + weapon.color.toString(16).padStart(6, '0'));
        
        // 更新下一武器信息
        const nextWeapon = this.weaponSystem.getNextWeaponInfo();
        if (nextWeapon) {
            this.autoUpgradeText.setText('自动升级: ' + nextWeapon.name + 
                ' (需要 ' + nextWeapon.cost + ' 魂点)');
        } else {
            this.autoUpgradeText.setText('武器已升级至最高级');
        }
    }
    
    showChestNotification() {
        this.chestNotification.setText('宝箱出现在地图上!');
        this.chestNotification.setAlpha(1);
        
        this.scene.tweens.add({
            targets: this.chestNotification,
            alpha: 0,
            delay: 3000,
            duration: 1000
        });
    }
    
    showWeaponUpgradeNotification(weaponName) {
        // 显示武器升级通知
        const upgradeText = this.scene.add.text(
            this.player.sprite.x, 
            this.player.sprite.y - 50, 
            '升级到 ' + weaponName + '!', 
            {
                fontSize: '20px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: upgradeText,
            y: this.player.sprite.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                upgradeText.destroy();
            }
        });
    }
    
    update() {
        // 更新健康条
        this.updateHealthBar();
    }
}
