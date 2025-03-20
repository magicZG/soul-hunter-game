export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.health = 100;
        this.isInvulnerable = false;
        
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
    
    damage(amount) {
        if (this.isInvulnerable) return false;
        
        this.health -= amount;
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
        
        return this.health <= 0; // 返回是否死亡
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
    
    heal(amount) {
        this.health = Math.min(100, this.health + amount);
        
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
        
        return this.health;
    }
    
    knockback(sourceX, sourceY, force) {
        const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.sprite.x, this.sprite.y);
        this.sprite.body.setVelocity(
            Math.cos(angle) * force,
            Math.sin(angle) * force
        );
    }
}
