export class PassiveSkillSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.skills = [];
        this.activeSkills = [];
        
        // 初始化可用技能
        this.initSkills();
    }
    
    initSkills() {
        this.skills = [
            {
                id: 'lifeRegen',
                name: '生命回复',
                description: '每30秒恢复5%生命值',
                cost: 25,
                unlocked: false,
                effect: (time) => {
                    // 每30秒触发一次
                    if (time % 30000 < 100 && time > 100) {
                        const healAmount = 5; // 回复5点生命值
                        this.player.heal(healAmount);
                        
                        // 显示回复效果
                        this.showSkillEffect('lifeRegen', '+' + healAmount + ' HP');
                    }
                }
            },
            {
                id: 'soulMagnet',
                name: '魂点磁铁',
                description: '增加50%魂点吸取范围',
                cost: 30,
                unlocked: false,
                onUnlock: () => {
                    // 在ItemSystem中实现效果
                    this.scene.itemSystem.increaseSoulCollectRadius(1.5);
                }
            },
            {
                id: 'criticalHit',
                name: '暴击强化',
                description: '10%几率造成双倍伤害',
                cost: 50,
                unlocked: false,
                // 效果在WeaponSystem的bullet创建中实现
            },
            {
                id: 'damageReflect',
                name: '伤害反弹',
                description: '受到伤害时反弹20%给附近敌人',
                cost: 35,
                unlocked: false,
                // 效果在Player damage方法中实现
            },
            {
                id: 'luckyFinder',
                name: '幸运值',
                description: '提高15%稀有魂点和宝箱出现几率',
                cost: 40,
                unlocked: false,
                // 效果在ItemSystem和EnemyManager中实现
            }
        ];
    }
    
    update(time) {
        // 对所有已解锁的技能执行效果
        this.activeSkills.forEach(skill => {
            if (skill.effect) {
                skill.effect(time);
            }
        });
    }
    
    unlockSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (skill && !skill.unlocked) {
            skill.unlocked = true;
            this.activeSkills.push(skill);
            
            // 如果有解锁时的特殊效果
            if (skill.onUnlock) {
                skill.onUnlock();
            }
            
            // 显示解锁效果
            this.showSkillUnlockEffect(skill);
            
            // 触发成就检查
            if (this.scene.achievementSystem) {
                this.scene.achievementSystem.checkAchievement('unlockSkills', this.activeSkills.length);
            }
            
            return true;
        }
        return false;
    }
    
    showSkillUnlockEffect(skill) {
        const text = this.scene.add.text(
            this.player.sprite.x,
            this.player.sprite.y - 50,
            '技能解锁: ' + skill.name,
            {
                fontSize: '20px',
                fill: '#00ffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: this.player.sprite.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                text.destroy();
            }
        });
    }
    
    showSkillEffect(skillId, message) {
        const text = this.scene.add.text(
            this.player.sprite.x,
            this.player.sprite.y - 40,
            message,
            {
                fontSize: '16px',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: this.player.sprite.y - 70,
            alpha: 0,
            duration: 1000,
            onComplete: function() {
                text.destroy();
            }
        });
    }
    
    getAvailableSkills() {
        return this.skills.filter(skill => !skill.unlocked);
    }
    
    getActiveSkills() {
        return this.activeSkills;
    }
    
    hasSkill(skillId) {
        return this.activeSkills.some(skill => skill.id === skillId);
    }
}
