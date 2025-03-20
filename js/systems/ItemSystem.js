export class ItemSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        this.souls = scene.physics.add.group();
        this.traps = scene.physics.add.staticGroup();
        this.chests = scene.physics.add.staticGroup();
        
        this.nextChestThreshold = 50; // 初始宝箱出现阈值
        this.chestSpawnTimer = 0;

        // 初始化陷阱
        this.initTraps();
    }
    
    initTraps() {
        // 生成陷阱
        const mapSize = this.scene.physics.world.bounds.width;
        
        for (let i = 0; i < 30; i++) {
            const trap = this.traps.create(
                Phaser.Math.Between(100, mapSize - 100),
                Phaser.Math.Between(100, mapSize - 100),
                'trap'
            );

            trap.setScale(0.6);
            trap.setTint(0xff3333); // 红色尖刺，更明显
            trap.triggered = false;
            trap.effectObject = null;
        }
    }
    
    spawnSoul(x, y, type) {
        const offsetX = Phaser.Math.Between(-30, 30);
        const offsetY = Phaser.Math.Between(-30, 30);

        const soul = this.souls.create(x + offsetX, y + offsetY, 'soul');
        soul.type = type;

        // 根据类型设置颜色和大小
        switch (type) {
            case 0: // 普通魂点
                soul.setTint(0x00ff00);
                soul.value = 1;
                soul.setScale(0.7);
                break;
            case 1: // 稀有魂点
                soul.setTint(0x0000ff);
                soul.value = 2;
                soul.setScale(0.9);
                break;
            case 2: // 史诗魂点
                soul.setTint(0xff00ff);
                soul.value = 5;
                soul.setScale(1.1);
                break;
            case 3: // 传说魂点
                soul.setTint(0xffa500);
                soul.value = 10;
                soul.setScale(1.3);
                break;
        }

        // 魂点漂浮动画
        this.scene.tweens.add({
            targets: soul,
            y: soul.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // 魂点旋转
        soul.body.setAngularVelocity(50);

        // 设置魂点自动消失
        this.scene.time.delayedCall(30000, function () {
            if (soul.active) soul.destroy();
        });
        
        return soul;
    }
    
    spawnChest() {
        // 找一个离玩家稍远的位置生成宝箱
        let x, y, distance;
        const mapSize = this.scene.physics.world.bounds.width;
        
        do {
            x = Phaser.Math.Between(100, mapSize - 100);
            y = Phaser.Math.Between(100, mapSize - 100);
            distance = Phaser.Math.Distance.Between(
                this.player.sprite.x, this.player.sprite.y, x, y
            );
        } while (distance < 300); // 至少300个单位远
        
        const chest = this.chests.create(x, y, 'chest');
        chest.setScale(1.2);
        chest.collected = false;
        
        // 添加视觉效果让宝箱更明显
        const glow = this.scene.add.image(x, y, 'soul')
            .setTint(0xffd700)
            .setAlpha(0.5)
            .setScale(2);
                
        // 创建宝箱光环动画
        this.scene.tweens.add({
            targets: glow,
            scale: 2.5,
            alpha: 0.3,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        chest.effectObject = glow;
        
        // 设置下一个宝箱阈值
        this.nextChestThreshold += 75; // 每次增加75点
        
        return chest;
    }
    
    update(time, soulPoints) {
        // 自动收集魂点
        this.souls.getChildren().forEach(soul => {
            const distance = Phaser.Math.Distance.Between(
                this.player.sprite.x, this.player.sprite.y,
                soul.x, soul.y
            );

            const collectRadius = 150; // 收集范围

            if (distance < collectRadius) {
                // 计算方向向量
                const dx = this.player.sprite.x - soul.x;
                const dy = this.player.sprite.y - soul.y;
                const magnitude = Math.sqrt(dx * dx + dy * dy);

                // 根据距离设置魂点移动速度
                const speed = Phaser.Math.Linear(100, 500, 1 - (distance / collectRadius));

                // 移动魂点朝向玩家
                soul.body.setVelocity(
                    dx / magnitude * speed,
                    dy / magnitude * speed
                );
            }
        });
        
        // 检查是否达到魂点阈值生成宝箱
        if (soulPoints >= this.nextChestThreshold && time > this.chestSpawnTimer) {
            this.spawnChest();
            this.chestSpawnTimer = time + 60000; // 至少1分钟后才能再次生成宝箱
        }
    }
    
    getCollectedSoulValue(soul) {
        return soul.value || 1;
    }
    
    createSoulCollectEffect(soul) {
        // 收集闪光动画
        const collectEffect = this.scene.add.image(soul.x, soul.y, 'soul')
            .setTint(0xffffff)
            .setAlpha(0.7)
            .setScale(2)
            .setDepth(5);

        this.scene.tweens.add({
            targets: collectEffect,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: function () {
                collectEffect.destroy();
            }
        });
    }
    
    processTrapHit(trap) {
        // 如果陷阱尚未触发
        if (!trap.triggered) {
            trap.triggered = true;

            // 显示触发效果 - 更震撼的尖刺陷阱效果
            const trapEffect = this.scene.add.image(trap.x, trap.y, 'trap')
                .setScale(2)
                .setAlpha(0.7)
                .setTint(0xff0000);

            // 保存效果对象引用以便之后清除
            trap.effectObject = trapEffect;

            // 添加震动效果
            this.scene.cameras.main.shake(300, 0.01);

            this.scene.tweens.add({
                targets: trapEffect,
                scale: 3,
                alpha: 0,
                duration: 600,
                onComplete: function () {
                    trapEffect.destroy();
                }
            });

            // 缩小并淡化原陷阱
            this.scene.tweens.add({
                targets: trap,
                alpha: 0.3,
                scale: 0.3,
                duration: 300
            });
            
            return 25; // 返回陷阱造成的伤害
        }
        
        return 0; // 已触发的陷阱不再造成伤害
    }
    
    processChestCollection(chest) {
        // 如果宝箱尚未被收集
        if (!chest.collected) {
            chest.collected = true;

            // 清除宝箱的发光特效
            if (chest.effectObject) {
                chest.effectObject.destroy();
            }

            // 宝箱消失效果
            this.scene.tweens.add({
                targets: chest,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: function () {
                    chest.destroy();
                }
            });
            
            // 宝箱开启效果 - 更强烈的视觉效果
            const chestEffect = this.scene.add.image(chest.x, chest.y, 'soul')
                .setTint(0xffd700)
                .setAlpha(0.8)
                .setScale(1)
                .setDepth(5);

            this.scene.tweens.add({
                targets: chestEffect,
                scale: 3,
                alpha: 0,
                duration: 500,
                onComplete: function () {
                    chestEffect.destroy();
                }
            });
            
            // 粒子爆炸效果
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                const distance = 50 + Math.random() * 50;
                
                const particle = this.scene.add.image(chest.x, chest.y, 'particle')
                    .setTint(0xffd700)
                    .setAlpha(0.8)
                    .setScale(0.5 + Math.random() * 0.5)
                    .setDepth(4);
                    
                    this.scene.tweens.add({
                        targets: particle,
                        x: chest.x + Math.cos(angle) * distance,
                        y: chest.y + Math.sin(angle) * distance,
                        alpha: 0,
                        scale: 0.1,
                        duration: 1000 + Math.random() * 500,
                        onComplete: function() {
                            particle.destroy();
                        }
                    });
                }
                
                // 随机奖励类型
                const rewardType = Phaser.Math.Between(0, 3);
                return rewardType; // 返回奖励类型以便处理
            }
            
            return -1; // 已收集的宝箱
        }
        
        processChestReward(chest, rewardType) {
            switch (rewardType) {
                case 0: // 魂点奖励
                    const soulReward = Phaser.Math.Between(20, 50);
                    
                    // 显示奖励文本
                    const rewardText = this.scene.add.text(chest.x, chest.y - 30, '+' + soulReward + ' 魂点!', {
                        fontSize: '20px',
                        fill: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5);
    
                    this.scene.tweens.add({
                        targets: rewardText,
                        y: chest.y - 80,
                        alpha: 0,
                        duration: 1500,
                        onComplete: function () {
                            rewardText.destroy();
                        }
                    });
                    
                    // 魂点飞向玩家的动画效果
                    for (let i = 0; i < 10; i++) {
                        const delay = i * 70;
                        const soulParticle = this.scene.add.image(
                            chest.x + Phaser.Math.Between(-20, 20),
                            chest.y + Phaser.Math.Between(-20, 20),
                            'soul'
                        )
                        .setTint(0x00ff00)
                        .setScale(0.4)
                        .setDepth(5);
                        
                        this.scene.tweens.add({
                            targets: soulParticle,
                            x: this.player.sprite.x,
                            y: this.player.sprite.y,
                            scale: 0.1,
                            delay: delay,
                            duration: 500,
                            onComplete: function() {
                                soulParticle.destroy();
                            }
                        });
                    }
                    return { type: 'souls', value: soulReward };
                    
                case 1: // 生命恢复
                    const healthReward = Phaser.Math.Between(30, 60);
                    
                    // 显示奖励文本
                    const healthText = this.scene.add.text(chest.x, chest.y - 30, '+' + healthReward + ' 生命!', {
                        fontSize: '20px',
                        fill: '#00ff00',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5);
    
                    this.scene.tweens.add({
                        targets: healthText,
                        y: chest.y - 80,
                        alpha: 0,
                        duration: 1500,
                        onComplete: function () {
                            healthText.destroy();
                        }
                    });
                    
                    return { type: 'health', value: healthReward };
                    
                case 2: // 传说魂点
                    // 生成5个传说魂点
                    for (let i = 0; i < 5; i++) {
                        this.spawnSoul(chest.x, chest.y, 3);
                    }
                    
                    // 显示奖励文本
                    const legendText = this.scene.add.text(chest.x, chest.y - 30, '传说魂点!', {
                        fontSize: '24px',
                        fill: '#ffa500',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5);
    
                    this.scene.tweens.add({
                        targets: legendText,
                        y: chest.y - 80,
                        alpha: 0,
                        duration: 1500,
                        onComplete: function () {
                            legendText.destroy();
                        }
                    });
                    
                    return { type: 'legendSouls' };
                    
                case 3: // 临时武器升级
                    let newWeapon = Phaser.Math.Between(0, 3);
                    
                    // 显示临时升级提示
                    const upgradeText = this.scene.add.text(chest.x, chest.y - 30, '临时武器升级!', {
                        fontSize: '20px',
                        fill: '#ffff00',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5);
    
                    this.scene.tweens.add({
                        targets: upgradeText,
                        y: chest.y - 80,
                        alpha: 0,
                        duration: 1500,
                        onComplete: function () {
                            upgradeText.destroy();
                        }
                    });
                    
                    return { type: 'weaponUpgrade', value: newWeapon, duration: 45000 };
            }
        }
    }
    