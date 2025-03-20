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
        this.skillsText = null;
        this.skillButtonsGroup = null;
        
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
        this.elementText = this.scene.add.text(20, 200, '元素: 无', {
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
        
        // 初始化技能按钮
        this.createSkillButtons();
        
        // 初始化UI状态
        this.updateHealthBar();
        this.updateWeaponText();
        this.updateSkillsText();
    }
    
    // 创建技能按钮
    createSkillButtons() {
        this.skillButtonsGroup = this.scene.add.group();
        
        const skills = this.passiveSkillSystem ? this.passiveSkillSystem.getAvailableSkills() : [];
        
        // 如果有可用技能，显示技能标题
        if (skills.length > 0) {
            this.skillsText = this.scene.add.text(
                this.scene.cameras.main.width - 200,
                200,
                '可用技能:',
                { fontSize: '18px', fill: '#ffffff' }
            )
                .setScrollFactor(0)
                .setDepth(1000);
                
            // 创建每个技能的按钮
            let yOffset = 230;
            const buttonWidth = 180;
            
            skills.forEach((skill, index) => {
                // 创建技能按钮背景
                const button = this.scene.add.rectangle(
                    this.scene.cameras.main.width - 200,
                    yOffset,
                    buttonWidth,
                    60,
                    0x333333,
                    0.8
                )
                    .setScrollFactor(0)
                    .setDepth(1000)
                    .setInteractive({ useHandCursor: true })
                    .setOrigin(0.5, 0);
                    
                // 添加边框
                const border = this.scene.add.rectangle(
                    this.scene.cameras.main.width - 200,
                    yOffset,
                    buttonWidth,
                    60,
                    0xffffff,
                    0
                )
                    .setScrollFactor(0)
                    .setDepth(1000)
                    .setStrokeStyle(1, 0xffffff, 0.5)
                    .setOrigin(0.5, 0);
                
                // 技能名称
                const nameText = this.scene.add.text(
                    this.scene.cameras.main.width - 200,
                    yOffset + 10,
                    skill.name,
                    { fontSize: '16px', fill: '#ffffff' }
                )
                    .setScrollFactor(0)
                    .setDepth(1001)
                    .setOrigin(0.5, 0);
                
                // 技能描述
                const descText = this.scene.add.text(
                    this.scene.cameras.main.width - 200,
                    yOffset + 30,
                    skill.description,
                    { fontSize: '12px', fill: '#cccccc', wordWrap: { width: buttonWidth - 20 } }
                )
                    .setScrollFactor(0)
                    .setDepth(1001)
                    .setOrigin(0.5, 0);
                
                // 技能消耗
                const costText = this.scene.add.text(
                    this.scene.cameras.main.width - 200,
                    yOffset + 45,
                    `消耗: ${skill.cost} 魂点`,
                    { fontSize: '12px', fill: '#ffff00' }
                )
                    .setScrollFactor(0)
                    .setDepth(1001)
                    .setOrigin(0.5, 0);
                
                // 按钮点击事件 - 解锁技能
                button.on('pointerdown', () => {
                    if (this.scene.soulPoints >= skill.cost) {
                        if (this.passiveSkillSystem.unlockSkill(skill.id)) {
                            // 扣除魂点
                            this.scene.soulPoints -= skill.cost;
                            this.updateSoulPoints(this.scene.soulPoints);
                            
                            // 更新技能显示
                            this.updateSkillButtons();
                        }
                    } else {
                        // 魂点不足提示
                        this.showInsufficientSoulsMessage();
                    }
                });
                
                // 鼠标悬停效果
                button.on('pointerover', () => {
                    button.setFillStyle(0x444444, 0.8);
                });
                
                button.on('pointerout', () => {
                    button.setFillStyle(0x333333, 0.8);
                });
                
                // 添加到组
                this.skillButtonsGroup.add(button);
                this.skillButtonsGroup.add(border);
                this.skillButtonsGroup.add(nameText);
                this.skillButtonsGroup.add(descText);
                this.skillButtonsGroup.add(costText);
                
                // 更新Y坐标
                yOffset += 65;
            });
        }
    }
    
    updateSkillButtons() {
        // 清除旧的按钮
        if (this.skillButtonsGroup) {
            this.skillButtonsGroup.clear(true, true);
        }
        
        // 重新创建按钮
        this.createSkillButtons();
        
        // 更新已解锁技能文本
        this.updateSkillsText();
    }
    
    updateSkillsText() {
        // 如果已经有技能文本，先移除
        if (this.activeSkillsText) {
            this.activeSkillsText.destroy();
        }
        
        // 如果有被动技能系统
        if (this.passiveSkillSystem) {
            const activeSkills = this.passiveSkillSystem.getActiveSkills();
            
            if (activeSkills.length > 0) {
                // 创建已解锁技能文本
                let skillsString = '已解锁技能:\n';
                activeSkills.forEach(skill => {
                    skillsString += `- ${skill.name}\n`;
                });
                
                this.activeSkillsText = this.scene.add.text(
                    20,
                    230,
                    skillsString,
                    { fontSize: '16px', fill: '#00ffff' }
                )
                    .setScrollFactor(0)
                    .setDepth(1000);
            } else {
                this.activeSkillsText = this.scene.add.text(
                    20,
                    230,
                    '未解锁任何技能',
                    { fontSize: '16px', fill: '#888888' }
                )
                    .setScrollFactor(0)
                    .setDepth(1000);
            }
        }
    }
    
    showInsufficientSoulsMessage() {
        const message = this.scene.add.text(
            this.player.sprite.x,
            this.player.sprite.y - 50,
            '魂点不足!',
            {
                fontSize: '20px',
                fill: '#ff6666',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: message,
            y: this.player.sprite.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                message.destroy();
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
    }
}
