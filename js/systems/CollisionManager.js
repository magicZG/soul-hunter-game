export class CollisionManager {
    constructor(scene) {
        this.scene = scene;
    }
    
    setupCollisions(player, bullets, enemies, enemyBullets, souls, traps, chests) {
        try {
            // 设置碰撞
            this.scene.physics.add.collider(bullets, enemies, this.bulletHitEnemy, null, this);
            this.scene.physics.add.overlap(player.sprite, souls, this.collectSoul, null, this);
            this.scene.physics.add.collider(player.sprite, enemies, this.playerHitEnemy, null, this);
            this.scene.physics.add.overlap(player.sprite, traps, this.playerHitTrap, null, this);
            this.scene.physics.add.overlap(player.sprite, chests, this.collectChest, null, this);
            this.scene.physics.add.overlap(player.sprite, enemyBullets, this.playerHitByEnemyBullet, null, this);
            
            // 保存引用
            this.player = player;
            this.bullets = bullets;
            this.enemies = enemies;
            this.enemyBullets = enemyBullets;
            this.souls = souls;
            this.traps = traps;
            this.chests = chests;
        } catch (error) {
            console.error("Error in setupCollisions:", error);
        }
    }
    
    bulletHitEnemy(bullet, enemy) {
        try {
            // 减少敌人生命值，考虑武器伤害
            const isDead = this.scene.enemyManager.damageEnemy(enemy, bullet.damage || 1);

            // 应用元素效果（如果有）
            if (bullet.element && this.scene.elementSystem) {
                this.scene.elementSystem.applyElementEffect(bullet, enemy, bullet.damage || 1);
            }

            // 禁用子弹
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.destroy();
            
            // 添加击中特效
            this.scene.add.image(bullet.x, bullet.y, 'particle')
                .setScale(0.5)
                .setTint(0xffaa00)
                .setAlpha(0.8)
                .setDepth(4)
                .destroy(200);

            // 如果敌人死亡
            if (isDead) {
                // 生成魂点
                const soulCount = enemy.type === 0 || !enemy.type ? 
                    Phaser.Math.Between(1, 3) :
                    (enemy.type === 1 ? 
                        Phaser.Math.Between(3, 7) : 
                        Phaser.Math.Between(7, 12)); // Boss敌人掉落更多魂点

                for (let i = 0; i < soulCount; i++) {
                    // 内联实现魂点类型选择
                    let soulType = 0;
                    if (enemy.type === 0 || !enemy.type) { // 普通敌人
                        soulType = (Phaser.Math.Between(0, 10) < 9) ? 0 : 1;
                    } else if (enemy.type === 1) { // 精英敌人
                        soulType = (Phaser.Math.Between(0, 10) < 6) ? 1 : 2;
                    } else { // Boss敌人
                        const roll = Phaser.Math.Between(0, 10);
                        soulType = (roll < 4) ? 1 : ((roll < 8) ? 2 : 3);
                    }
                    
                    this.scene.itemSystem.spawnSoul(enemy.x, enemy.y, soulType);
                }

                // 消灭敌人
                this.scene.enemyManager.destroyEnemy(enemy);
            } else {
                // 击中效果
                const hitX = bullet.x;
                const hitY = bullet.y;
                
                // 添加少量血液
                for (let i = 0; i < 3; i++) {
                    const bloodSplat = this.scene.add.image(hitX, hitY, 'blood')
                        .setScale(0.2 + Math.random() * 0.2)
                        .setAlpha(0.5 + Math.random() * 0.3)
                        .setTint(0xff0000)
                        .setDepth(3);
                        
                    // 随机方向的血液飞溅
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 10 + Math.random() * 15;
                    
                    this.scene.tweens.add({
                        targets: bloodSplat,
                        x: hitX + Math.cos(angle) * distance,
                        y: hitY + Math.sin(angle) * distance,
                        alpha: 0,
                        scale: 0.1,
                        duration: 300 + Math.random() * 200,
                        onComplete: function() {
                            bloodSplat.destroy();
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error in bulletHitEnemy:", error);
        }
    }
    
    collectSoul(playerSprite, soul) {
        try {
            // 获取魂点值
            const value = this.scene.itemSystem.getCollectedSoulValue(soul);
            
            // 更新魂点计数
            this.scene.addSoulPoints(value);
            
            // 创建收集特效
            this.scene.itemSystem.createSoulCollectEffect(soul);
            
            // 移除魂点
            soul.destroy();
        } catch (error) {
            console.error("Error in collectSoul:", error);
        }
    }
    
    playerHitEnemy(playerSprite, enemy) {
        try {
            // 如果最近没有受到伤害，则扣血
            if (!this.player.isInvulnerable) {
                // 提高敌人伤害
                let damage = enemy.typeConfig?.damage || 15; // 使用敌人配置的伤害，如果没有则默认15
                
                // 标记玩家受到伤害，用于完美波次成就
                this.player.hasBeenDamaged = true;
                
                // 对玩家造成伤害
                this.player.damage(damage, enemy);
                
                // 击退效果
                this.player.knockback(enemy.x, enemy.y, 300);
                
                // 如果敌人是自爆型
                if (enemy.attackType === 'suicide') {
                    // 自爆伤害
                    this.player.damage(damage * 2, enemy);
                    
                    // 产生爆炸效果
                    const explosion = this.scene.add.circle(enemy.x, enemy.y, 100, 0xff0000, 0.4);
                    
                    this.scene.tweens.add({
                        targets: explosion,
                        alpha: 0,
                        scale: 1.5,
                        duration: 500,
                        onComplete: function() {
                            explosion.destroy();
                        }
                    });
                    
                    // 销毁敌人
                    enemy.destroy();
                }
            }
        } catch (error) {
            console.error("Error in playerHitEnemy:", error);
        }
    }
    
    playerHitTrap(playerSprite, trap) {
        try {
            // 处理陷阱触发
            const damage = this.scene.itemSystem.processTrapHit(trap);
            
            if (damage > 0) {
                // 标记玩家受到伤害，用于完美波次成就
                this.player.hasBeenDamaged = true;
                
                // 玩家反馈 - 增强受伤效果
                this.player.damage(damage);
                
                // 添加强烈的视觉反馈
                this.scene.add.rectangle(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height, 0xff0000, 0.3)
                    .setScrollFactor(0)
                    .setDepth(1000)
                    .setOrigin(0)
                    .destroy(100);
                    
                // 强烈的击退效果
                this.player.knockback(trap.x, trap.y, 400);
            }
        } catch (error) {
            console.error("Error in playerHitTrap:", error);
        }
    }
    
    collectChest(playerSprite, chest) {
        try {
            // 处理宝箱收集
            const rewardType = this.scene.itemSystem.processChestCollection(chest);
            
            if (rewardType >= 0) {
                const reward = this.scene.itemSystem.processChestReward(chest, rewardType);
                
                // 处理奖励
                if (reward) {
                    switch (reward.type) {
                        case 'souls':
                            this.scene.addSoulPoints(reward.value);
                            break;
                        case 'health':
                            this.player.heal(reward.value);
                            break;
                        case 'weaponUpgrade':
                            this.scene.weaponSystem.setTemporaryWeapon(reward.value, reward.duration);
                            break;
                        case 'element':
                            if (this.scene.elementSystem) {
                                this.scene.elementSystem.setActiveElement(reward.value);
                                
                                // 记录已使用元素，用于成就
                                const usedElements = this.scene.registry.get('usedElements') || [];
                                if (!usedElements.includes(reward.value)) {
                                    usedElements.push(reward.value);
                                    this.scene.registry.set('usedElements', usedElements);
                                    if (this.scene.achievementSystem) {
                                        this.scene.achievementSystem.checkAchievement('useElements', usedElements.length);
                                    }
                                }
                            }
                            break;
                        // legendSouls由ItemSystem直接处理
                    }
                }
            }
        } catch (error) {
            console.error("Error in collectChest:", error);
        }
    }
    
    playerHitByEnemyBullet(playerSprite, bullet) {
        try {
            if (!this.player.isInvulnerable) {
                // 标记玩家受到伤害，用于完美波次成就
                this.player.hasBeenDamaged = true;
                
                // 造成伤害
                this.player.damage(8); // 提高子弹伤害

                bullet.setActive(false);
                bullet.setVisible(false);
            }
        } catch (error) {
            console.error("Error in playerHitByEnemyBullet:", error);
        }
    }
}
