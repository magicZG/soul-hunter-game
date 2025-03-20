export class EnemyManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = scene.physics.add.group();
        this.enemyBullets = scene.physics.add.group({
            defaultKey: 'enemyBullet',
            maxSize: 100
        });
        
        this.spawnTime = 0;
    }
    
    spawnEnemy() {
        // 确定生成位置 - 在玩家周围随机位置，但不要太近
        let x, y, distance;
        do {
            // 随机角度
            const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
            // 随机距离 (在600-900范围内)
            const spawnDistance = Phaser.Math.Between(600, 900);

            // 计算坐标
            x = this.player.sprite.x + Math.cos(angle) * spawnDistance;
            y = this.player.sprite.y + Math.sin(angle) * spawnDistance;

            // 确保在地图边界内
            x = Phaser.Math.Clamp(x, 50, this.scene.physics.world.bounds.width - 50);
            y = Phaser.Math.Clamp(y, 50, this.scene.physics.world.bounds.height - 50);

            // 检查与玩家的距离
            distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, x, y);
        } while (distance < 500);

        // 确定敌人类型 (0=普通, 1=精英, 2=Boss)
        let enemyType;
        const typeRoll = Phaser.Math.Between(0, 100);
        if (typeRoll < 75) enemyType = 0;      // 75% 普通敌人
        else if (typeRoll < 95) enemyType = 1; // 20% 精英敌人
        else enemyType = 2;                   // 5% Boss敌人

        // 确定攻击类型
        const attackTypes = ['melee', 'range', 'suicide', 'teleport'];
        const attackType = attackTypes[Phaser.Math.Between(0, attackTypes.length - 1)];

        // 创建敌人
        const enemy = this.enemies.create(x, y, 'enemy');
        enemy.type = enemyType;
        
        // 设置敌人生命值
        if (enemyType === 0) enemy.health = 3;       // 普通敌人
        else if (enemyType === 1) enemy.health = 8;  // 精英敌人
        else enemy.health = 15;                     // Boss敌人
        
        // 设置敌人大小和颜色
        enemy.setScale(enemyType === 0 ? 1.0 : (enemyType === 1 ? 1.3 : 1.8));
        
        if (enemyType === 0) enemy.setTint(0xffffff);        // 普通敌人：白色
        else if (enemyType === 1) enemy.setTint(0xff8800);   // 精英敌人：橙色
        else enemy.setTint(0xff0000);                       // Boss敌人：红色
        
        enemy.body.setSize(enemy.width * 0.7, enemy.height * 0.7);

        // 设置攻击类型
        enemy.attackType = attackType;
        enemy.lastAttack = 0;
        enemy.lastTeleport = 0;

        // 播放动画
        enemy.play('enemyWalk');

        // 设置敌人运动属性
        enemy.wanderTime = 0;
        enemy.wanderVelocityX = 0;
        enemy.wanderVelocityY = 0;
        
        // 敌人出现特效
        const spawnEffect = this.scene.add.image(x, y, 'soul')
            .setTint(0x333333)
            .setAlpha(0.5)
            .setScale(2);
            
        this.scene.tweens.add({
            targets: spawnEffect,
            scale: 0,
            alpha: 0,
            duration: 500,
            onComplete: function() {
                spawnEffect.destroy();
            }
        });
        
        return enemy;
    }
    
    update(time) {
        // 处理敌人生成
        if (time > this.spawnTime) {
            this.spawnEnemy();
            this.spawnTime = time + Phaser.Math.Between(1000, 3000);
        }
        
        // 更新所有敌人的行为
        this.enemies.getChildren().forEach(enemy => {
            this.updateEnemyBehavior(enemy, time);
        });
    }
    
    updateEnemyBehavior(enemy, time) {
        // 确保动画播放
        if (!enemy.anims.isPlaying) {
            enemy.play('enemyWalk');
        }

        // 简单的追踪AI
        const distance = Phaser.Math.Distance.Between(
            this.player.sprite.x, this.player.sprite.y,
            enemy.x, enemy.y
        );

        if (distance < 500) {
            let speed = 100 + (enemy.type * 30);

            // 计算方向向量
            const dx = this.player.sprite.x - enemy.x;
            const dy = this.player.sprite.y - enemy.y;
            const magnitude = Math.sqrt(dx * dx + dy * dy);

            // 移动敌人朝向玩家
            enemy.body.setVelocity(
                dx / magnitude * speed,
                dy / magnitude * speed
            );

            // 设置敌人朝向
            if (dx < 0) {
                enemy.anims.play('enemyWalkLeft', true);
                enemy.flipX = true;
            } else {
                enemy.anims.play('enemyWalkRight', true);
                enemy.flipX = false;
            }

            // 精英敌人的特殊行为
            if (enemy.type === 1 && Phaser.Math.Between(0, 100) < 1) {
                // 随机冲刺
                enemy.body.setVelocity(
                    dx / magnitude * speed * 3,
                    dy / magnitude * speed * 3
                );
            }

            // 远程攻击
            if (enemy.attackType === 'range' && time > enemy.lastAttack) {
                this.fireEnemyBullet(enemy);
                enemy.lastAttack = time + 2000; // 攻击间隔
            }

            // 自爆攻击
            if (enemy.attackType === 'suicide' && distance < 100) {
                // 自爆逻辑由碰撞系统处理
                // 这里可以添加自爆前的动画或特效
            }

            // 瞬移攻击
            if (enemy.attackType === 'teleport' && time > enemy.lastTeleport) {
                this.teleportEnemy(enemy);
                enemy.lastTeleport = time + 3000; // 瞬移间隔
            }

        } else {
            // 敌人漫游
            if (!enemy.wanderTime || time > enemy.wanderTime) {
                enemy.wanderTime = time + Phaser.Math.Between(2000, 5000);
                const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
                enemy.wanderVelocityX = Math.cos(angle) * 50;
                enemy.wanderVelocityY = Math.sin(angle) * 50;
            }

            enemy.body.setVelocity(enemy.wanderVelocityX, enemy.wanderVelocityY);
            
            // 设置敌人朝向
            if (enemy.wanderVelocityX < 0) {
                enemy.anims.play('enemyWalkLeft', true);
                enemy.flipX = true;
            } else {
                enemy.anims.play('enemyWalkRight', true);
                enemy.flipX = false;
            }
        }
    }
    
    fireEnemyBullet(enemy) {
        const bullet = this.enemyBullets.get(enemy.x, enemy.y);

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setScale(0.4);
            bullet.setTint(0xff0000);

            const angle = Phaser.Math.Angle.Between(
                enemy.x, enemy.y, 
                this.player.sprite.x, this.player.sprite.y
            );
            
            bullet.rotation = angle;

            const speed = 300;
            this.scene.physics.velocityFromRotation(angle, speed, bullet.body.velocity);

            this.scene.time.delayedCall(2000, function () {
                bullet.setActive(false);
                bullet.setVisible(false);
            });
            
            return bullet;
        }
        
        return null;
    }
    
    teleportEnemy(enemy) {
        let x, y, distance;
        do {
            x = this.player.sprite.x + Phaser.Math.Between(-200, 200);
            y = this.player.sprite.y + Phaser.Math.Between(-200, 200);

            x = Phaser.Math.Clamp(x, 50, this.scene.physics.world.bounds.width - 50);
            y = Phaser.Math.Clamp(y, 50, this.scene.physics.world.bounds.height - 50);

            distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, x, y);
        } while (distance > 300);
        
        // 添加瞬移特效
        const teleportEffect = this.scene.add.image(enemy.x, enemy.y, 'soul')
            .setTint(0x00ffff)
            .setAlpha(0.7)
            .setScale(1);
            
        this.scene.tweens.add({
            targets: teleportEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: function() {
                teleportEffect.destroy();
            }
        });

        enemy.setPosition(x, y);
        
        // 出现特效
        const appearEffect = this.scene.add.image(x, y, 'soul')
            .setTint(0x00ffff)
            .setAlpha(0)
            .setScale(2);
            
        this.scene.tweens.add({
            targets: appearEffect,
            scale: 0.5,
            alpha: 0.7,
            duration: 300,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: appearEffect,
                    scale: 0,
                    alpha: 0,
                    duration: 200,
                    onComplete: function() {
                        appearEffect.destroy();
                    }
                });
            }
        });
    }
    
    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        
        // 敌人受伤闪烁效果
        this.scene.tweens.add({
            targets: enemy,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            onComplete: function() {
                if (enemy.active) enemy.alpha = 1;
            }
        });
        
        // 返回敌人是否死亡
        return enemy.health <= 0;
    }
    
    destroyEnemy(enemy) {
        // 消灭敌人特效
        const explosion = this.scene.add.image(enemy.x, enemy.y, 'soul')
            .setScale(1)
            .setTint(0xff0000)
            .setDepth(5);

        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: function () {
                explosion.destroy();
            }
        });
        
        // 添加血液效果
        this.createBloodEffect(enemy.x, enemy.y);
        
        // 移除敌人
        enemy.destroy();
    }
    
    createBloodEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 30;
            
            const blood = this.scene.add.image(x, y, 'blood')
                .setScale(0.3 + Math.random() * 0.3)
                .setAlpha(0.7)
                .setTint(0xff0000)
                .setDepth(3);
            
            // 血液飞溅
            this.scene.tweens.add({
                targets: blood,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.1,
                duration: 500 + Math.random() * 500,
                onComplete: function() {
                    blood.destroy();
                }
            });
        }
    }
    
    getEnemySoulValue(enemy) {
        // 根据敌人类型返回魂点值
        if (enemy.type === 0) {
            // 普通敌人: 1-3点
            return Phaser.Math.Between(1, 3); 
        } else if (enemy.type === 1) {
            // 精英敌人: 3-7点
            return Phaser.Math.Between(3, 7);
        } else {
            // Boss敌人: 7-12点
            return Phaser.Math.Between(7, 12);
        }
    }
    
    getEnemySoulType(enemy) {
        // 根据敌人类型确定魂点类型
        if (enemy.type === 0) {
            // 普通敌人: 90%普通魂点, 10%稀有魂点
            return (Phaser.Math.Between(0, 10) < 9) ? 0 : 1;
        } else if (enemy.type === 1) {
            // 精英敌人: 60%稀有魂点, 40%史诗魂点
            return (Phaser.Math.Between(0, 10) < 6) ? 1 : 2;
        } else {
            // Boss敌人: 40%稀有魂点, 40%史诗魂点, 20%传说魂点
            const roll = Phaser.Math.Between(0, 10);
            if (roll < 4) return 1;
            else if (roll < 8) return 2;
            else return 3;
        }
    }
}
