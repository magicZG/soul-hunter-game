// js/ui/UIManager.js
export class UIManager {
    constructor(scene, player, weaponSystem) {
        this.scene = scene;
        this.player = player;
        this.weaponSystem = weaponSystem;
        
        // UI元素
        this.healthBar = null;
        this.soulPointsText = null;
        this.weaponText = null;
        this.autoFireText = null;
        this.nextWeaponText = null;
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
        
        // 创建射击按钮
        this.fireButton = this.scene.add.image(
            this.scene.cameras.main.width - 100, 
            this.scene.cameras.main.height - 100, 
            'button'
        )
            .setScrollFactor(0)
            .setScale(0.7)
            .setInteractive()
            .setDepth(1000);

        this.scene.add.text(
            this.scene.cameras.main.width - 100,
            this.scene.cameras.main.height - 100, 
            '射击', 
            {
                fontSize: '16px',
                fill: '#ffffff'
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        this.fireButton.on('pointerdown', () => {
            this.weaponSystem.fireBullet();
        });

        // 创建自动射击按钮
        this.autoFireButton = this.scene.add.image(
            this.scene.cameras.main.width - 100, 
            this.scene.cameras.main.height - 180, 
            'button'
        )
            .setScrollFactor(0)
            .setScale(0.7)
            .setInteractive()
            .setDepth(1000);

        this.autoFireText = this.scene.add.text(
            this.scene.cameras.main.width - 100, 
            this.scene.cameras.main.height - 180, 
            '自动: 关', 
            {
                fontSize: '16px',
                fill: '#ffffff'
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        this.autoFireButton.on('pointerdown', () => {
            this.toggleAutoFire();
        });

        // 创建武器升级按钮
        this.upgradeButton = this.scene.add.image(
            this.scene.cameras.main.width - 100, 
            this.scene.cameras.main.height - 260, 
            'button'
        )
            .setScrollFactor(0)
            .setScale(0.7)
            .setInteractive()
            .setDepth(1000);

        const upgradeText = this.scene.add.text(
            this.scene.cameras.main.width - 100, 
            this.scene.cameras.main.height - 260, 
            '升级武器', 
            {
                fontSize: '14px',
                fill: '#ffffff'
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // 下一个武器信息文本
        this.nextWeaponText = this.scene.add.text(
            this.scene.cameras.main.width - 100, 
            this.scene.cameras.main.height - 285, 
            '', 
            {
                fontSize: '12px',
                fill: '#ffff00'
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        this.upgradeButton.on('pointerdown', () => {
            this.upgradeWeapon();
        });
        
        // 键盘控制提示文本
        this.keyboardControlsText = this.scene.add.text(20, 140, '键盘控制: [WASD] 移动  [J] 升级武器  [K] 自动射击切换  [L] 射击', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        })
            .setScrollFactor(0)
            .setDepth(1000);
        
        // 初始化UI状态
        this.updateHealthBar();
        this.updateWeaponText();
        this.updateUpgradeButtonState();
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
        this.updateUpgradeButtonState();
    }
    
    updateWeaponText() {
        const weapon = this.weaponSystem.getCurrentWeapon();
        this.weaponText.setText('武器: ' + weapon.name +
            '\n射程: ' + weapon.range +
            '\n伤害: ' + weapon.damage);
        this.weaponText.setColor('#' + weapon.color.toString(16).padStart(6, '0'));
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
    
    upgradeWeapon() {
        // 尝试升级武器，返回消耗的魂点
        const cost = this.weaponSystem.upgrade(this.scene.soulPoints);
        
        if (cost > 0) {
            // 减少魂点
            this.scene.soulPoints -= cost;
            this.updateSoulPoints(this.scene.soulPoints);
            
            // 更新武器文本
            this.updateWeaponText();
            
            // 更新升级按钮状态
            this.updateUpgradeButtonState();
            
            return true;
        } else if (this.weaponSystem.getNextWeaponInfo() === null) {
            // 已经是最高级武器
            const maxWeaponText = this.scene.add.text(
                this.player.sprite.x, 
                this.player.sprite.y - 50, 
                '已达到最高级武器!', 
                {
                    fontSize: '20px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: maxWeaponText,
                y: this.player.sprite.y - 100,
                alpha: 0,
                duration: 1500,
                onComplete: function() {
                    maxWeaponText.destroy();
                }
            });
        } else {
            // 魂点不足
            const nextWeapon = this.weaponSystem.getNextWeaponInfo();
            const notEnoughText = this.scene.add.text(
                this.player.sprite.x, 
                this.player.sprite.y - 50, 
                '魂点不足! 需要: ' + nextWeapon.cost, 
                {
                    fontSize: '20px',
                    fill: '#ff6666',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: notEnoughText,
                y: this.player.sprite.y - 100,
                alpha: 0,
                duration: 1500,
                onComplete: function() {
                    notEnoughText.destroy();
                }
            });
        }
        
        return false;
    }
    
    toggleAutoFire() {
        const isAutoFire = this.weaponSystem.toggleAutoFire();
        
        this.autoFireText.setText('自动: ' + (isAutoFire ? '开' : '关'));
        
        if (isAutoFire) {
            this.autoFireButton.setTint(0x00ff00);
        } else {
            this.autoFireButton.clearTint();
        }
    }
    
    updateUpgradeButtonState() {
        const nextWeapon = this.weaponSystem.getNextWeaponInfo();
        
        if (nextWeapon) {
            this.nextWeaponText.setText('下一个: ' + nextWeapon.name + ' (' + nextWeapon.cost + ' 魂点)');
            
            if (this.scene.soulPoints >= nextWeapon.cost) {
                this.upgradeButton.setTint(0x00ff00);
                this.nextWeaponText.setColor('#00ff00');
            } else {
                this.upgradeButton.setTint(0x888888);
                this.nextWeaponText.setColor('#ff8800');
            }
        } else {
            this.nextWeaponText.setText('已获得最强武器');
            this.nextWeaponText.setColor('#ffff00');
            this.upgradeButton.setTint(0x888888);
        }
    }
    
    update() {
        // 更新健康条
        this.updateHealthBar();
    }
}
