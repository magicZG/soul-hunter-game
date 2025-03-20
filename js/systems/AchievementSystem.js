export class AchievementSystem {
    constructor(scene) {
        this.scene = scene;
        this.achievements = this.initAchievements();
        this.unlockedAchievements = [];
        
        // 加载之前保存的成就解锁状态
        this.loadAchievements();
    }
    
    initAchievements() {
        return [
            {
                id: 'firstKill',
                name: '初出茅庐',
                description: '消灭第一个敌人',
                unlockedDescription: '已消灭第一个敌人',
                unlocked: false,
                icon: '🗡️',
                reward: {
                    type: 'souls',
                    value: 10
                }
            },
            {
                id: 'kill10',
                name: '小试身手',
                description: '消灭10个敌人',
                unlockedDescription: '已消灭10个敌人',
                unlocked: false,
                icon: '⚔️',
                reward: {
                    type: 'souls',
                    value: 20
                }
            },
            {
                id: 'kill50',
                name: '杀戮成性',
                description: '消灭50个敌人',
                unlockedDescription: '已消灭50个敌人',
                unlocked: false,
                icon: '👹',
                reward: {
                    type: 'souls',
                    value: 50
                }
            },
            {
                id: 'kill100',
                name: '屠魔者',
                description: '消灭100个敌人',
                unlockedDescription: '已消灭100个敌人',
                unlocked: false,
                icon: '☠️',
                reward: {
                    type: 'souls',
                    value: 100
                }
            },
            {
                id: 'collect100Souls',
                name: '收集者',
                description: '收集100个魂点',
                unlockedDescription: '已收集100个魂点',
                unlocked: false,
                icon: '💎',
                reward: {
                    type: 'boost',
                    value: 'collectRate'
                }
            },
            {
                id: 'collect500Souls',
                name: '灵魂商人',
                description: '收集500个魂点',
                unlockedDescription: '已收集500个魂点',
                unlocked: false,
                icon: '💰',
                reward: {
                    type: 'souls',
                    value: 50
                }
            },
            {
                id: 'survive5min',
                name: '生存专家',
                description: '存活超过5分钟',
                unlockedDescription: '已存活超过5分钟',
                unlocked: false,
                icon: '⏱️',
                reward: {
                    type: 'health',
                    value: 20
                }
            },
            {
                id: 'maxWeapon',
                name: '武器大师',
                description: '解锁最高级武器',
                unlockedDescription: '已解锁最高级武器',
                unlocked: false,
                icon: '🔫',
                reward: {
                    type: 'damage',
                    value: 1.1 // 10% 伤害提升
                }
            },
            {
                id: 'perfectWave',
                name: '完美躲避',
                description: '不受伤完成一波敌人',
                unlockedDescription: '已完成一波无伤通关',
                unlocked: false,
                icon: '🛡️',
                reward: {
                    type: 'speed',
                    value: 1.1 // 10% 速度提升
                }
            },
            {
                id: 'reachWave5',
                name: '中途英雄',
                description: '到达第5波敌人',
                unlockedDescription: '已到达第5波敌人',
                unlocked: false,
                icon: '🌊',
                reward: {
                    type: 'souls',
                    value: 30
                }
            },
            {
                id: 'completeAllWaves',
                name: '冠军猎魔者',
                description: '完成所有10波敌人',
                unlockedDescription: '已完成所有10波敌人',
                unlocked: false,
                icon: '👑',
                reward: {
                    type: 'achievement',
                    value: 'champion'
                }
            },
            {
                id: 'unlockSkills',
                name: '技能大师',
                description: '解锁3种被动技能',
                unlockedDescription: '已解锁3种被动技能',
                unlocked: false,
                icon: '✨',
                reward: {
                    type: 'cooldown',
                    value: 0.9 // 10% 冷却时间减少
                }
            },
            {
                id: 'allElements',
                name: '元素掌控者',
                description: '使用所有元素类型',
                unlockedDescription: '已使用所有元素类型',
                unlocked: false,
                icon: '🔮',
                reward: {
                    type: 'elementDuration',
                    value: 1.2 // 20% 元素效果持续时间延长
                }
            }
        ];
    }
    
    checkAchievement(type, value) {
        switch (type) {
            case 'kill':
                if (value === 1) this.unlockAchievement('firstKill');
                if (value >= 10) this.unlockAchievement('kill10');
                if (value >= 50) this.unlockAchievement('kill50');
                if (value >= 100) this.unlockAchievement('kill100');
                break;
                
            case 'collectSouls':
                if (value >= 100) this.unlockAchievement('collect100Souls');
                if (value >= 500) this.unlockAchievement('collect500Souls');
                break;
                
            case 'survived':
                if (value >= 5 * 60 * 1000) this.unlockAchievement('survive5min'); // 5分钟
                break;
                
            case 'weaponLevel':
                if (value >= 3) this.unlockAchievement('maxWeapon'); // 假设最高级武器是3
                break;
                
            case 'perfectWave':
                if (value) this.unlockAchievement('perfectWave');
                break;
                
            case 'reachWave':
                if (value >= 5) this.unlockAchievement('reachWave5');
                break;
                
            case 'unlockSkills':
                if (value >= 3) this.unlockAchievement('unlockSkills');
                break;
                
            case 'useElements':
                if (value >= 4) this.unlockAchievement('allElements'); // 假设有4种元素
                break;
        }
    }
    
    unlockAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.unlockedAchievements.push(achievement);
            
            // 保存成就状态
            this.saveAchievements();
            
            // 显示成就解锁通知
            this.showAchievementNotification(achievement);
            
            // 应用成就奖励
            this.applyAchievementReward(achievement);
            
            return true;
        }
        return false;
    }
    
    showAchievementNotification(achievement) {
        // 创建成就解锁通知面板
        const panel = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            100,
            400,
            80,
            0x000000,
            0.8
        )
        .setScrollFactor(0)
        .setDepth(2000)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xffff00);
        
        // 成就图标
        const icon = this.scene.add.text(
            this.scene.cameras.main.width / 2 - 170,
            100,
            achievement.icon,
            { fontSize: '32px' }
        )
        .setScrollFactor(0)
        .setDepth(2001)
        .setOrigin(0.5);
        
        // 成就标题
        const title = this.scene.add.text(
            this.scene.cameras.main.width / 2 - 80,
            85,
            '成就解锁!',
            {
                fontSize: '18px',
                fill: '#ffff00',
                fontStyle: 'bold'
            }
        )
        .setScrollFactor(0)
        .setDepth(2001);
        
        // 成就名称
        const name = this.scene.add.text(
            this.scene.cameras.main.width / 2 - 80,
            110,
            achievement.name,
            {
                fontSize: '22px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }
        )
        .setScrollFactor(0)
        .setDepth(2001);
        
        // 奖励文本
        let rewardText = '';
        if (achievement.reward) {
            switch(achievement.reward.type) {
                case 'souls':
                    rewardText = `奖励: ${achievement.reward.value} 魂点`;
                    break;
                case 'health':
                    rewardText = `奖励: 最大生命值+${achievement.reward.value}`;
                    break;
                case 'damage':
                    rewardText = `奖励: 伤害+${Math.round((achievement.reward.value - 1) * 100)}%`;
                    break;
                case 'speed':
                    rewardText = `奖励: 速度+${Math.round((achievement.reward.value - 1) * 100)}%`;
                    break;
                case 'cooldown':
                    rewardText = `奖励: 冷却时间-${Math.round((1 - achievement.reward.value) * 100)}%`;
                    break;
                case 'boost':
                case 'elementDuration':
                case 'achievement':
                    rewardText = '奖励: 特殊能力解锁';
                    break;
            }
        }
        
        const reward = this.scene.add.text(
            this.scene.cameras.main.width / 2 + 100,
            100,
            rewardText,
            {
                fontSize: '16px',
                fill: '#00ffff',
            }
        )
        .setScrollFactor(0)
        .setDepth(2001)
        .setOrigin(0.5);
        
        // 动画效果
        // 从屏幕上方滑入
        const elements = [panel, icon, title, name, reward];
        
        for (let element of elements) {
            element.y -= 100;
            element.alpha = 0;
        }
        
        this.scene.tweens.add({
            targets: elements,
            y: '+=100',
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
        
        // 显示几秒后消失
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: elements,
                y: '-=100',
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    elements.forEach(e => e.destroy());
                }
            });
        });
    }
    
    applyAchievementReward(achievement) {
        if (!achievement.reward) return;
        
        switch (achievement.reward.type) {
            case 'souls':
                // 增加魂点
                this.scene.addSoulPoints(achievement.reward.value);
                break;
                
            case 'health':
                // 增加最大生命值
                if (this.scene.player) {
                    this.scene.player.increaseMaxHealth(achievement.reward.value);
                }
                break;
                
            case 'damage':
                // 增加伤害
                if (this.scene.weaponSystem) {
                    this.scene.weaponSystem.increaseDamageMultiplier(achievement.reward.value);
                }
                break;
                
            case 'speed':
                // 增加移动速度
                if (this.scene.player) {
                    this.scene.player.increaseSpeedMultiplier(achievement.reward.value);
                }
                break;
                
            case 'cooldown':
                // 减少冷却时间
                if (this.scene.weaponSystem) {
                    this.scene.weaponSystem.decreaseCooldownMultiplier(achievement.reward.value);
                }
                break;
                
            case 'boost':
                // 特殊增益，根据值确定具体效果
                if (achievement.reward.value === 'collectRate') {
                    this.scene.itemSystem.increaseSoulCollectRadius(1.3);
                }
                break;
                
            case 'elementDuration':
                // 增加元素效果持续时间
                if (this.scene.elementSystem) {
                    this.scene.elementSystem.increaseEffectDuration(achievement.reward.value);
                }
                break;
                
            case 'achievement':
                // 特殊成就解锁，显示特殊效果
                this.showSpecialAchievementEffect(achievement.reward.value);
                break;
        }
    }
    
    showSpecialAchievementEffect(achievementType) {
        if (achievementType === 'champion') {
            // 冠军特效 - 持久的金色光晕
            const championEffect = this.scene.add.image(
                this.scene.player.sprite.x,
                this.scene.player.sprite.y,
                'particle'
            )
            .setTint(0xffdd00)
            .setAlpha(0.3)
            .setBlendMode('ADD')
            .setScale(2);
            
            // 跟随玩家
            this.scene.events.on('update', () => {
                if (this.scene.player && this.scene.player.sprite && this.scene.player.sprite.active) {
                    championEffect.setPosition(
                        this.scene.player.sprite.x,
                        this.scene.player.sprite.y
                    );
                }
            });
            
            // 添加脉动动画
            this.scene.tweens.add({
                targets: championEffect,
                scale: 2.5,
                alpha: 0.2,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    saveAchievements() {
        // 保存解锁的成就到本地存储
        const saveData = this.achievements.map(a => ({
            id: a.id,
            unlocked: a.unlocked
        }));
        
        try {
            localStorage.setItem('soulHunterAchievements', JSON.stringify(saveData));
        } catch (e) {
            console.error('无法保存成就:', e);
        }
    }
    
    loadAchievements() {
        try {
            const saveData = localStorage.getItem('soulHunterAchievements');
            if (saveData) {
                const savedAchievements = JSON.parse(saveData);
                
                // 更新成就解锁状态
                savedAchievements.forEach(saved => {
                    const achievement = this.achievements.find(a => a.id === saved.id);
                    if (achievement) {
                        achievement.unlocked = saved.unlocked;
                        
                        // 如果已解锁，加入解锁列表
                        if (achievement.unlocked) {
                            this.unlockedAchievements.push(achievement);
                        }
                    }
                });
            }
        } catch (e) {
            console.error('无法加载成就:', e);
        }
    }
    
    getAchievements() {
        return this.achievements;
    }
    
    getUnlockedAchievements() {
        return this.unlockedAchievements;
    }
    
    getAchievementById(id) {
        return this.achievements.find(a => a.id === id);
    }
    
    resetAchievements() {
        // 重置所有成就（调试用）
        this.achievements.forEach(a => {
            a.unlocked = false;
        });
        this.unlockedAchievements = [];
        this.saveAchievements();
    }
}
