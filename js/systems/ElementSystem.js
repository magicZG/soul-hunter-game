export class ElementSystem {
    constructor(scene) {
        this.scene = scene;
        this.elements = this.initElements();
        this.activeElement = null;
    }
    
    initElements() {
        return [
            {
                id: 'fire',
                name: '火焰',
                color: 0xff4500,
                particleColor: 0xff7700,
                effect: (enemy, damage) => {
                    // 火焰效果：造成持续伤害
                    if (!enemy.elementalEffects) {
                        enemy.elementalEffects = {};
                    }
                    
                    // 设置燃烧效果
                    if (!enemy.elementalEffects.burning) {
                        enemy.elementalEffects.burning = {
                            damage: Math.max(1, Math.floor(damage * 0.2)),
                            duration: 3000, // 3秒
                            interval: 1000, // 每秒触发一次
                            lastTick: this.scene.time.now,
                            visualEffect: this.createBurningEffect(enemy)
                        };
                    } else {
                        // 刷新持续时间
                        enemy.elementalEffects.burning.duration = 3000;
                    }
                }
            },
            {
                id: 'ice',
                name: '冰霜',
                color: 0x00ffff,
                particleColor: 0xaaffff,
                effect: (enemy, damage) => {
                    // 冰霜效果：减速敌人
                    if (!enemy.elementalEffects) {
                        enemy.elementalEffects = {};
                    }
                    
                    // 设置冰冻效果
                    if (!enemy.elementalEffects.frozen) {
                        // 保存原始速度
                        if (!enemy.originalSpeed) {
                            enemy.originalSpeed = enemy.body.speed || 100;
                        }
                        
                        // 减速50%
                        enemy.body.setVelocity(
                            enemy.body.velocity.x * 0.5,
                            enemy.body.velocity.y * 0.5
                        );
                        
                        // 添加视觉效果
                        enemy.elementalEffects.frozen = {
                            speedReduction: 0.5,
                            duration: 2000, // 2秒
                            visualEffect: this.createFrozenEffect(enemy)
                        };
                    } else {
                        // 刷新持续时间
                        enemy.elementalEffects.frozen.duration = 2000;
                    }
                }
            },
            {
                id: 'lightning',
                name: '雷电',
                color: 0xffff00,
                particleColor: 0xffffaa,
                effect: (enemy, damage) => {
                    // 雷电效果：弹射到附近敌人
                    const chainDistance = 150;
                    const chainTargets = 2; // 弹射到2个敌人
                    
                    // 找到附近的敌人
                    let nearbyEnemies = this.scene.enemyManager.getNearbyEnemies(
                        enemy.x, 
                        enemy.y, 
                        chainDistance, 
                        chainTargets,
                        [enemy] // 排除原始目标
                    );
                    
                    // 对周围敌人造成伤害
                    nearbyEnemies.forEach(nearbyEnemy => {
                        // 造成50%的连锁伤害
                        this.scene.enemyManager.damageEnemy(
                            nearbyEnemy, 
                            Math.floor(damage * 0.5)
                        );
                        
                        // 创建闪电连接效果
                        this.createLightningChainEffect(enemy, nearbyEnemy);
                    });
                    
                    // 给原始目标添加视觉效果
                    this.createLightningEffect(enemy);
                }
            },
            {
                id: 'poison',
                name: '毒素',
                color: 0x00ff00,
                particleColor: 0x88ff88,
                effect: (enemy, damage) => {
                    // 毒素效果：范围伤害
                    const poisonRadius = 100;
                    
                    // 找到范围内的所有敌人
                    let nearbyEnemies = this.scene.enemyManager.getNearbyEnemies(
                        enemy.x, 
                        enemy.y, 
                        poisonRadius
                    );
                    
                    // 创建毒素云效果
                    this.createPoisonCloudEffect(enemy.x, enemy.y, poisonRadius);
                    
                    // 对周围敌人造成伤害
                    nearbyEnemies.forEach(nearbyEnemy => {
                        // 造成30%的范围伤害
                        if (nearbyEnemy !== enemy) {
                            this.scene.enemyManager.damageEnemy(
                                nearbyEnemy, 
                                Math.floor(damage * 0.3)
                            );
                        }
                        
                        // 添加中毒效果，随时间造成伤害
                        if (!nearbyEnemy.elementalEffects) {
                            nearbyEnemy.elementalEffects = {};
                        }
                        
                        if (!nearbyEnemy.elementalEffects.poisoned) {
                            nearbyEnemy.elementalEffects.poisoned = {
                                damage: Math.max(1, Math.floor(damage * 0.1)),
                                duration: 5000, // 5秒
                                interval: 1000, // 每秒触发一次
                                lastTick: this.scene.time.now,
                                visualEffect: this.createPoisonEffect(nearbyEnemy)
                            };
                        } else {
                            // 刷新持续时间
                            nearbyEnemy.elementalEffects.poisoned.duration = 5000;
                        }
                    });
                }
            }
        ];
    }
    
    update(time) {
        // 更新所有敌人的元素效果
        this.scene.enemyManager.enemies.getChildren().forEach(enemy => {
            if (enemy.elementalEffects) {
                // 处理燃烧效果
                if (enemy.elementalEffects.burning) {
                    const burning = enemy.elementalEffects.burning;
                    burning.duration -= 16; // 约等于一帧的时间
                    
                    // 定时造成伤害
                    if (time - burning.lastTick >= burning.interval) {
                        this.scene.enemyManager.damageEnemy(enemy, burning.damage);
                        burning.lastTick = time;
                        
                        // 显示伤害数字
                        this.showDamageNumber(enemy.x, enemy.y, burning.damage, 0xff4500);
                    }
                    
                    // 效果结束时移除
                    if (burning.duration <= 0) {
                        if (burning.visualEffect) {
                            burning.visualEffect.destroy();
                        }
                        delete enemy.elementalEffects.burning;
                    }
                }
                
                // 处理冰冻效果
                if (enemy.elementalEffects.frozen) {
                    const frozen = enemy.elementalEffects.frozen;
                    frozen.duration -= 16;
                    
                    // 效果结束时恢复速度
                    if (frozen.duration <= 0) {
                        if (enemy.originalSpeed) {
                            // 恢复原速度的移动逻辑需要在EnemyManager中处理
                            enemy.body.setVelocity(
                                enemy.body.velocity.x / frozen.speedReduction,
                                enemy.body.velocity.y / frozen.speedReduction
                            );
                        }
                        
                        if (frozen.visualEffect) {
                            frozen.visualEffect.destroy();
                        }
                        delete enemy.elementalEffects.frozen;
                    }
                }
                
                // 处理中毒效果
                if (enemy.elementalEffects.poisoned) {
                    const poisoned = enemy.elementalEffects.poisoned;
                    poisoned.duration -= 16;
                    
                    // 定时造成伤害
                    if (time - poisoned.lastTick >= poisoned.interval) {
                        this.scene.enemyManager.damageEnemy(enemy, poisoned.damage);
                        poisoned.lastTick = time;
                        
                        // 显示伤害数字
                        this.showDamageNumber(enemy.x, enemy.y, poisoned.damage, 0x00ff00);
                    }
                    
                    // 效果结束时移除
                    if (poisoned.duration <= 0) {
                        if (poisoned.visualEffect) {
                            poisoned.visualEffect.destroy();
                        }
                        delete enemy.elementalEffects.poisoned;
                    }
                }
                
                // 如果没有任何元素效果，删除elementalEffects对象
                if (Object.keys(enemy.elementalEffects).length === 0) {
                    delete enemy.elementalEffects;
                }
            }
        });
    }
    
    setActiveElement(elementId) {
        this.activeElement = this.elements.find(e => e.id === elementId) || null;
        return this.activeElement;
    }
    
    getActiveElement() {
        return this.activeElement;
    }
    
    applyElementEffect(bullet, enemy, damage) {
        if (this.activeElement && enemy) {
            this.activeElement.effect(enemy, damage);
            
            // 为子弹添加命中特效
            this.createElementalHitEffect(bullet.x, bullet.y, this.activeElement);
            
            return true;
        }
        return false;
    }
    
    getRandomElement() {
        const index = Math.floor(Math.random() * this.elements.length);
        return this.elements[index];
    }
    
    // 视觉效果方法
    createElementalHitEffect(x, y, element) {
        // 创建元素命中效果
        const particles = this.scene.add.particles(x, y, 'particle', {
            tint: element.particleColor,
            scale: { start: 0.5, end: 0.1 },
            speed: { min: 50, max: 100 },
            lifespan: 500,
            blendMode: 'ADD',
            frequency: -1
        });
        
        particles.explode(20);
        
        // 3秒后自动销毁粒子
        this.scene.time.delayedCall(3000, () => {
            particles.destroy();
        });
    }
    
    createBurningEffect(enemy) {
        // 燃烧视觉效果
        const emitter = this.scene.add.particles(0, 0, 'particle', {
            tint: 0xff4500,
            scale: { start: 0.3, end: 0.1 },
            speed: { min: 20, max: 50 },
            lifespan: 400,
            blendMode: 'ADD',
            frequency: 50,
            follow: enemy
        });
        
        return emitter;
    }
    
    createFrozenEffect(enemy) {
        // 冰冻视觉效果 - 添加蓝色光晕
        const glow = this.scene.add.image(enemy.x, enemy.y, 'particle')
            .setTint(0x00ffff)
            .setAlpha(0.5)
            .setBlendMode('ADD')
            .setScale(1.5);

        // 让光晕跟随敌人
        this.scene.tweens.add({
            targets: glow,
            alpha: 0.3,
            scale: 1.8,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // 更新位置
        const updatePos = () => {
            if (enemy.active) {
                glow.setPosition(enemy.x, enemy.y);
            } else {
                glow.destroy();
            }
        };
        
        // 添加到更新循环
        const event = this.scene.events.addListener('update', updatePos);
        
        // 创建一个对象来包含发射器和事件，便于后续清理
        return {
            glow: glow,
            destroy: () => {
                this.scene.events.removeListener('update', updatePos);
                glow.destroy();
            }
        };
    }
    
    createLightningEffect(enemy) {
        // 闪电视觉效果 - 电击动画
        const flash = this.scene.add.image(enemy.x, enemy.y, 'particle')
            .setTint(0xffff00)
            .setAlpha(0.8)
            .setBlendMode('ADD')
            .setScale(2);
            
        // 闪烁动画
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
    }
    
    createLightningChainEffect(sourceEnemy, targetEnemy) {
        // 创建闪电链接线
        const lightning = this.scene.add.graphics();
        lightning.lineStyle(3, 0xffff00, 0.8);
        lightning.beginPath();
        lightning.moveTo(sourceEnemy.x, sourceEnemy.y);
        lightning.lineTo(targetEnemy.x, targetEnemy.y);
        lightning.closePath();
        lightning.strokePath();
        
        // 闪电消失动画
        this.scene.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                lightning.destroy();
            }
        });
    }
    
    createPoisonEffect(enemy) {
        // 中毒视觉效果
        const emitter = this.scene.add.particles(0, 0, 'particle', {
            tint: 0x00ff00,
            scale: { start: 0.2, end: 0.1 },
            alpha: { start: 0.5, end: 0 },
            speed: { min: 5, max: 20 },
            lifespan: 800,
            frequency: 100,
            follow: enemy
        });
        
        return emitter;
    }
    
    createPoisonCloudEffect(x, y, radius) {
        // 毒云视觉效果
        const cloud = this.scene.add.image(x, y, 'particle')
            .setTint(0x00ff00)
            .setAlpha(0.4)
            .setBlendMode('ADD')
            .setScale(radius / 50); // 假设粒子基础大小是50像素
        
        // 毒云扩散动画
        this.scene.tweens.add({
            targets: cloud,
            alpha: 0,
            scale: cloud.scale * 1.5,
            duration: 1000,
            onComplete: () => {
                cloud.destroy();
            }
        });
    }
    
    showDamageNumber(x, y, amount, color) {
        // 显示伤害数字
        const damageText = this.scene.add.text(
            x, 
            y - 20, 
            amount.toString(),
            {
                fontSize: '16px',
                fill: '#' + color.toString(16),
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // 向上飘动并消失
        this.scene.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
}
