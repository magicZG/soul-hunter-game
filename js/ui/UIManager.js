export class UIManager {
    constructor(scene, player, weaponSystem, passiveSkillSystem, elementSystem) {
        this.scene = scene;
        this.player = player;
        this.weaponSystem = weaponSystem;
        this.passiveSkillSystem = passiveSkillSystem;
        this.elementSystem = elementSystem;
        
        // UI元素
        this.healthBar = null;
        this.soulPointsText = null;
        this.weaponText = null;
        this.chestNotification = null;
        this.elementText = null;
        this.enemyDirectionArrows = []; // 敌人方向箭头数组
        
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

        // 魂点
        this.soulPointsText = this.scene.add.text(20, 50, '魂点: 0', {
            fontSize: '22px',
            fill: '#ffffff'
        })
            .setScrollFactor(0)
            .setDepth(1000);

        // 波次信息
        this.waveText = this.scene.add.text(20, 80, '波次: 等待开始', {
            fontSize: '18px',
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
        this.weaponText = this.scene.add.text(20, 140, '', {
            fontSize: '18px',
            fill: '#ffffff'
        })
            .setScrollFactor(0)
            .setDepth(1000);
            
        // 元素效果显示
        this.elementText = this.scene.add.text(20, 170, '元素: 无', {
            fontSize: '18px',
            fill: '#ffffff'
        })
            .setScrollFactor(0)
            .setDepth(1000);
        
        // 键盘控制提示文本
        this.keyboardControlsText = this.scene.add.text(20, this.scene.cameras.main.height - 30, '键盘控制: [WASD] 移动', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        })
            .setScrollFactor(0)
            .setDepth(1000);
        
        // 初始化敌人方向指示箭头
        this.createDirectionArrows();
        
        // 初始化UI状态
        this.updateHealthBar();
        this.updateWeaponText();
    }
    
    // 创建敌人方向指示箭头
    createDirectionArrows() {
        // 清除旧箭头
        this.enemyDirectionArrows.forEach(arrow => arrow.destroy());
        this.enemyDirectionArrows = [];
        
        // 创建5个方向指示箭头（可以同时显示5个敌人方向）
        for (let i = 0; i < 5; i++) {
            const arrow = this.scene.add.image(0, 0, 'directionArrow')
                .setScrollFactor(0)
                .setScale(1.2)
                .setAlpha(0.8)
                .setDepth(1100)
                .setVisible(false);
            
            this.enemyDirectionArrows.push(arrow);
        }
    }
    
    // 更新敌人方向指示箭头
    updateDirectionArrows() {
        if (!this.scene.enemyManager || !this.player || !this.player.sprite) {
            return;
        }
        
        // 获取所有敌人
        const enemies = this.scene.enemyManager.enemies.getChildren();
        if (!enemies || enemies.length === 0) {
            // 隐藏所有箭头
            this.enemyDirectionArrows.forEach(arrow => arrow.setVisible(false));
            return;
        }
        
        // 获取屏幕边界
        const camera = this.scene.cameras.main;
        const screenBounds = new Phaser.Geom.Rectangle(
            camera.scrollX,
            camera.scrollY,
            camera.width,
            camera.height
        );
        
        // 筛选出在屏幕外的敌人，并按距离排序
        const offScreenEnemies = enemies
            .filter(enemy => !screenBounds.contains(enemy.x, enemy.y))
            .map(enemy => {
                return {
                    enemy: enemy,
                    distance: Phaser.Math.Distance.Between(
                        this.player.sprite.x,
                        this.player.sprite.y,
                        enemy.x,
                        enemy.y
                    )
                };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, this.enemyDirectionArrows.length); // 只处理最近的几个敌人
        
        // 隐藏所有箭头
        this.enemyDirectionArrows.forEach(arrow => arrow.setVisible(false));
        
        // 对每个屏幕外的敌人更新箭头
        offScreenEnemies.forEach((enemyData, index) => {
            const arrow = this.enemyDirectionArrows[index];
            const enemy = enemyData.enemy;
            
            // 计算敌人相对于屏幕中心的角度
            const angle = Phaser.Math.Angle.Between(
                camera.midPoint.x,
                camera.midPoint.y,
                enemy.x,
                enemy.y
            );
            
            // 计算箭头位置（固定在屏幕边缘）
            const radius = Math.min(camera.width, camera.height) * 0.4;
            let arrowX = camera.midPoint.x + Math.cos(angle) * radius;
            let arrowY = camera.midPoint.y + Math.sin(angle) * radius;
            
            // 保证箭头在屏幕内
            const padding = 30;
            arrowX = Phaser.Math.Clamp(arrowX, camera.scrollX + padding, camera.scrollX + camera.width - padding);
            arrowY = Phaser.Math.Clamp(arrowY, camera.scrollY + padding, camera.scrollY + camera.height - padding);
            
            // 根据敌人类型设置箭头颜色
            if (enemy.enemyType === 'boss') {
                arrow.setTint(0xff0000); // Boss红色
                arrow.setScale(1.8);     // 更大的箭头
            } else if (enemy.enemyType === 'elite') {
                arrow.setTint(0xff8800); // 精英橙色
                arrow.setScale(1.5);
            } else if (enemy.enemyType === 'healer') {
                arrow.setTint(0xff00ff); // 治疗粉色
                arrow.setScale(1.2);
            } else {
                arrow.setTint(0xffff00); // 普通敌人黄色
                arrow.setScale(1.2);
            }
            
            // 设置箭头位置和旋转
            arrow.setPosition(arrowX, arrowY);
            arrow.setRotation(angle);
            arrow.setVisible(true);
            
            // 根据敌人距离设置透明度
            const maxDistance = 1500;
            const minAlpha = 0.4;
            const alphaRange = 0.6; // 0.4 - 1.0
            
            const distanceRatio = Phaser.Math.Clamp(enemyData.distance / maxDistance, 0, 1);
            const alpha = 1.0 - (distanceRatio * alphaRange);
            arrow.setAlpha(alpha);
            
            // 为Boss添加脉动效果
            if (enemy.enemyType === 'boss' && !arrow.pulseTween) {
                arrow.pulseTween = this.scene.tweens.add({
                    targets: arrow,
                    scaleX: 2.2,
                    scaleY: 2.2,
                    duration: 600,
                    yoyo: true,
                    repeat: -1
                });
            }
        });
    }
    
    updateHealthBar() {
        const healthPercent = Phaser.Math.Clamp(this.player.health / this.player.maxHealth, 0, 1);
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
    
    updateWaveInfo(waveNumber, totalWaves, remainingEnemies) {
        if (waveNumber === 0) {
            this.waveText.setText('波次: 等待开始');
        } else {
            this.waveText.setText(`波次: ${waveNumber}/${totalWaves}\n剩余敌人: ${remainingEnemies}`);
        }
    }
    
    updateWeaponText() {
        const weapon = this.weaponSystem.getCurrentWeapon();
        this.weaponText.setText('武器: ' + weapon.name +
            '\n射程: ' + weapon.range +
            '\n伤害: ' + weapon.damage +
            '\n下一级: ' + (this.weaponSystem.getNextWeaponInfo() ? 
                            this.weaponSystem.getNextWeaponInfo().name + 
                            ' (' + this.weaponSystem.getNextWeaponInfo().cost + ' 魂点)' : 
                            '已达最高级'));
        this.weaponText.setColor('#' + weapon.color.toString(16).padStart(6, '0'));
    }
    
    updateElementText() {
        if (this.elementSystem) {
            const element = this.elementSystem.getActiveElement();
            if (element) {
                this.elementText.setText('元素: ' + element.name);
                this.elementText.setColor('#' + element.color.toString(16).padStart(6, '0'));
            } else {
                this.elementText.setText('元素: 无');
                this.elementText.setColor('#ffffff');
            }
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
    
    update(time) {
        // 更新健康条
        this.updateHealthBar();
        
        // 更新元素文本
        this.updateElementText();
        
        // 更新波次信息
        if (this.scene.waveSystem) {
            this.updateWaveInfo(
                this.scene.waveSystem.getCurrentWave(),
                this.scene.waveSystem.getTotalWaves(),
                this.scene.waveSystem.getEnemiesRemaining()
            );
        }
        
        // 更新敌人方向箭头
        this.updateDirectionArrows();
    }
}
