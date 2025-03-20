export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.health = 100;
        this.maxHealth = 100;
        this.isInvulnerable = false;
        this.speedMultiplier = 1.0;
        this.baseSpeed = 300;
        
        // 初始化玩家
        this.init();
    }
    
    init() {
        // 设置玩家物理属性
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(1.5);
        this.sprite.body.setSize(this.sprite.width * 0.6, this.sprite.height * 0.6);
    }
    
    update(time, delta) {
        // 玩家逻辑更新，由InputManager处理
    }
    
    damage(amount, source = null) {
        if (this.isInvulnerable) return false;
        
        this.health = Math.max(0, this.health - amount);
        this.isInvulnerable = true;
        
        // 受伤特效
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.isInvulnerable = false;
            }
        });
        
        // 添加血液效果
        this.createBloodEffect();
        
        // 检查是否有伤害反弹技能
        if (this.scene.passiveSkillSystem && this.scene.passiveSkillSystem.hasSkill('damageReflect') && source) {
            // 获取周围的敌人
            const nearbyEnemies = this.scene.enemyManager.getNearbyEnemies(this.sprite.x, this.sprite.y, 150);
            
            // 对周围敌人施加伤害
            if (nearbyEnemies.length > 0) {
                const reflectDamage = Math.floor(amount * 0.2); // 反弹20%伤害
                nearbyEnemies.forEach(enemy => {
                    this.scene.enemyManager.damageEnemy(enemy, reflectDamage);
                    
                    // 显示伤害反弹效果
                    this.createDamageReflectEffect(enemy, reflectDamage);
                });
            }
        }
        
        return this.health <= 0; // 返回是否死亡
    }
    
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // 治愈特效
        const healEffect = this.scene.add.image(this.sprite.x, this.sprite.y, 'soul')
            .setTint(0x00ff00)
            .setAlpha(0.7)
            .setScale(1)
            .setDepth(5);
            
        this.scene.tweens.add({
            targets: healEffect,
            scale: 3,
            alpha: 0,
            duration: 800,
            onComplete: function() {
                healEffect.destroy();
            }
        });
        
        return this.health - oldHealth; // 返回实际恢复量
    }
    
    increaseMaxHealth(amount) {
        this.maxHealth += amount;
        
        // 同时恢复相同数量的生命值
        this.heal(amount);
        
        // 显示效果
        const maxHealthText = this.scene.add.text(
            this.sprite.x, 
            this.sprite.y - 50, 
            `最大生命值 +${amount}!`, 
            {
                fontSize: '20px',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: maxHealthText,
            y: this.sprite.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                maxHealthText.destroy();
            }
        });
    }
    
    increaseSpeedMultiplier(multiplier) {
        this.speedMultiplier *= multiplier;
        
        // 显示效果
        const speedText = this.scene.add.text(
            this.sprite.x, 
            this.sprite.y - 50, 
            `速度提升 ${Math.floor((multiplier - 1) * 100)}%!`, 
            {
                fontSize: '20px',
                fill: '#00ffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: speedText,
            y: this.sprite.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                speedText.destroy();
            }
        });
    }
    
    createBloodEffect() {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            const distance = 30 + Math.random() * 30;
            
            const blood = this.scene.add.image(this.sprite.x, this.sprite.y, 'blood')
                .setScale(0.3 + Math.random() * 0.3)
                .setAlpha(0.7)
                .setTint(0xff0000)
                .setDepth(3);
            
            // 血液飞溅
            this.scene.tweens.add({
                targets: blood,
                x: this.sprite.x + Math.cos(angle) * distance,
                y: this.sprite.y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.1,
                duration: 500 + Math.random() * 500,
                onComplete: function() {
                    blood.destroy();
                }
            });
        }
    }
    
    createDamageReflectEffect(enemy, damage) {
        // 创建从玩家到敌人的反弹特效
        const line = this.scene.add.graphics();
        line.lineStyle(2, 0xff0000, 0.7);
        line.beginPath();
        line.moveTo(this.sprite.x, this.sprite.y);
        line.lineTo(enemy.x, enemy.y);
        line.closePath();
        line.strokePath();
        
        // 创建伤害数字
        const damageText = this.scene.add.text(
            enemy.x, 
            enemy.y - 20, 
            damage.toString(), 
            {
                fontSize: '16px',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // 动画
        this.scene.tweens.add({
            targets: line,
            alpha: 0,
            duration: 300,
            onComplete: function() {
                line.destroy();
            }
        });
        
        this.scene.tweens.add({
            targets: damageText,
            y: enemy.y - 40,
            alpha: 0,
            duration: 800,
            onComplete: function() {
                damageText.destroy();
            }
        });
    }
    
    knockback(sourceX, sourceY, force) {
        const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.sprite.x, this.sprite.y);
        this.sprite.body.setVelocity(
            Math.cos(angle) * force,
            Math.sin(angle) * force
        );
    }
    
    getCurrentSpeed() {
        return this.baseSpeed * this.speedMultiplier;
    }
}
