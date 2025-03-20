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
        this.killedEnemiesCount = 0;
        this.totalKilledEnemies = 0;
        this.waveActive = false;
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        
        // 特殊敌人类型配置
        this.enemyTypes = [
            // 普通敌人
            {
                type: 'normal',
                health: 3,
                scale: 1.0,
                speed: 100,
                damage: 15,
                color: 0xffffff,
                spawnWeight: 70
            },
            // 爆炸型敌人
            {
                type: 'explosive',
                health: 2,
                scale: 0.9,
                speed: 120,
                damage: 15,
                color: 0xff5500,
                spawnWeight: 5,
                onDeath: (enemy) => {
                    // 死亡时爆炸，对周围造成伤害
                    this.createExplosion(enemy.x, enemy.y, 150, 20);
                }
            },
            // 分裂型敌人
            {
                type: 'splitter',
                health: 5,
                scale: 1.2,
                speed: 80,
                damage: 20,
                color: 0x00ff00,
                spawnWeight: 5,
                onDeath: (enemy) => {
                    // 死亡时分裂为2个小型敌人
                    for (let i = 0; i < 2; i++) {
                        const offset = (i === 0 ? -1 : 1) * 20;
                        const smallEnemy = this.spawnEnemyAt(enemy.x + offset, enemy.y + offset, 'normal', 0.7);
                        if (smallEnemy) {
                            smallEnemy.health = 1;
                            smallEnemy.scale = 0.7;
                            smallEnemy.setTint(0x00ff00); // 保持与父敌人相同的颜色
                        }
                    }
                }
            },
            // 精英型敌人
            {
                type: 'elite',
                health: 10,
                scale: 1.3,
                speed: 90,
                damage: 25,
                color: 0xff8800,
                spawnWeight: 10,
                attackType: 'range', // 远程攻击
                attackInterval: 2000 // 攻击间隔
            },
            // 隐形型敌人
            {
                type: 'invisible',
                health: 3,
                scale: 1.0,
                speed: 110,
                damage: 15,
                color: 0xffffff,
                spawnWeight: 5,
                behavior: (enemy, time) => {
                    // 周期性隐形
                    if ((time % 5000) < 2000) {
                        enemy.alpha = 0.2;
                    } else {
                        enemy.alpha = 1;
                    }
                }
            },
            // 治疗型敌人
            {
                type: 'healer',
                health: 5,
                scale: 1.1,
                speed: 70,
                damage: 10,
                color: 0xff00ff,
                spawnWeight: 5,
                behavior: (enemy, time) => {
                    // 周期性治疗附近敌人
                    if (time % 3000 < 50) {
                        const nearbyEnemies = this.getNearbyEnemies(enemy.x, enemy.y, 100, 3, [enemy]);
                        nearbyEnemies.forEach(nearbyEnemy => {
                            if (nearbyEnemy.health < nearbyEnemy.maxHealth) {
                                nearbyEnemy.health = Math.min(nearbyEnemy.maxHealth, nearbyEnemy.health + 1);
                                this.createHealEffect(enemy.x, enemy.y, nearbyEnemy.x, nearbyEnemy.y);
                            }
                        });
                    }
                }
            },
            // Boss敌人
            {
                type: 'boss',
                health: 50,
                scale: 2.0,
                speed: 70,
                damage: 40,
                color: 0xff0000,
                spawnWeight: 0, // 不随机生成，仅在特定场景生成
                attackType: 'teleport', // 瞬移攻击
                attackInterval: 4000, // 攻击间隔
                onDeath: (enemy) => {
                    // Boss死亡奖励
                    this.createBossReward(enemy.x, enemy.y);
                }
            }
        ];

        // 初始化时检查并创建必要的动画
        this.createEnemyAnimations();
    }
    
    // 创建敌人所需的动画 - 新增方法
    createEnemyAnimations() {
        // 检查动画是否已存在
        if (!this.scene.anims.exists('enemyWalk')) {
            // 尝试创建基本动画
            try {
                this.scene.anims.create({
                    key: 'enemyWalk',
                    frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                    frameRate: 10,
                    repeat: -1
                });
                
                console.log("成功创建enemyWalk动画");
            } catch (e) {
                console.warn("创建enemyWalk动画失败:", e.message);
                // 如果精灵表有问题，创建一个单帧动画作为备用
                try {
                    this.scene.anims.create({
                        key: 'enemyWalk',
                        frames: [ { key: 'enemy', frame: 0 } ],
                        frameRate: 1,
                        repeat: 0
                    });
                } catch (e) {
                    console.error("创建备用enemyWalk动画也失败:", e.message);
                }
            }
        }

        // 方向性动画
        if (!this.scene.anims.exists('enemyWalkLeft')) {
            try {
                this.scene.anims.create({
                    key: 'enemyWalkLeft',
                    frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                    frameRate: 10,
                    repeat: -1
                });
            } catch (e) {
                console.warn("创建enemyWalkLeft动画失败:", e.message);
            }
        }

        if (!this.scene.anims.exists('enemyWalkRight')) {
            try {
                this.scene.anims.create({
                    key: 'enemyWalkRight',
                    frames: this.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                    frameRate: 10,
                    repeat: -1
                });
            } catch (e) {
                console.warn("创建enemyWalkRight动画失败:", e.message);
            }
        }
    }
    
    setWaveParameters(waveNumber, enemyCount) {
        this.waveActive = true;
        this.currentWave = waveNumber;
        this.enemiesRemaining = enemyCount;
        this.killedEnemiesCount = 0;
        
        // 调整敌人生成参数
        this.spawnTime = this.scene.time.now + 1000; // 第一个敌人1秒后生成
    }
    
    getEnemyTypeByWave(wave) {
        // 根据波次调整敌人类型的权重
        let weights = [...this.enemyTypes.map(t => t.spawnWeight)];
        
        // 随着波次增加，特殊敌人的比例增加
        if (wave >= 3) { // 从第3波开始
            weights[1] += 5; // 爆炸型
            weights[2] += 5; // 分裂型
        }
        
        if (wave >= 5) { // 从第5波开始
            weights[3] += 10; // 精英型
            weights[4] += 5; // 隐形型
        }
        
        if (wave >= 7) { // 从第7波开始
            weights[5] += 5; // 治疗型
        }
        
        // 计算总权重
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        // 随机选择一种敌人类型
        let random = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < weights.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                return this.enemyTypes[i];
            }
        }
        
        // 默认返回普通敌人
        return this.enemyTypes[0];
    }
    
    spawnEnemy() {
        // 如果波次系统激活，且没有剩余敌人，则不生成新敌人
        if (this.waveActive && this.enemiesRemaining <= 0) {
            return null;
        }
        
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

        // 确定敌人类型
        const enemyTypeConfig = this.getEnemyTypeByWave(this.currentWave);
        return this.spawnEnemyAt(x, y, enemyTypeConfig.type);
    }
    
    spawnEnemyAt(x, y, enemyType, scaleMultiplier = 1.0) {
        const enemyTypeConfig = this.enemyTypes.find(t => t.type === enemyType) || this.enemyTypes[0];
        
        // 创建敌人
        const enemy = this.enemies.create(x, y, 'enemy');
        enemy.enemyType = enemyType;
        enemy.typeConfig = enemyTypeConfig;
        
        // 设置敌人属性
        enemy.health = enemyTypeConfig.health;
        enemy.maxHealth = enemyTypeConfig.health;
        enemy.setScale(enemyTypeConfig.scale * scaleMultiplier);
        enemy.setTint(enemyTypeConfig.color);
        enemy.body.setSize(enemy.width * 0.7, enemy.height * 0.7);
        
        // 设置攻击类型
        enemy.attackType = enemyTypeConfig.attackType || 'melee';
        enemy.lastAttack = 0;
        enemy.lastTeleport = 0;
        enemy.attackInterval = enemyTypeConfig.attackInterval || 2000;
        
        // 修改: 安全地播放动画
        this.playEnemyAnimation(enemy, 'enemyWalk');

        // 设置敌人运动属性
        enemy.wanderTime = 0;
        enemy.wanderVelocityX = 0;
        enemy.wanderVelocityY = 0;
        
        // 附加特殊行为
        enemy.behavior = enemyTypeConfig.behavior;
        enemy.onDeath = enemyTypeConfig.onDeath;
        
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
        
        // 更新剩余敌人数量
        if (this.waveActive) {
            this.enemiesRemaining--;
        }
        
        return enemy;
    }
    
    // 新增: 安全播放敌人动画的方法
    playEnemyAnimation(enemy, animationKey) {
        // 检查动画是否存在
        if (this.scene.anims.exists(animationKey)) {
            try {
                enemy.play(animationKey);
            } catch (e) {
                console.warn(`播放动画 ${animationKey} 失败:`, e.message);
                // 发生错误时设置为默认帧
                try {
                    enemy.setTexture('enemy', 0);
                } catch (err) {
                    console.error("无法设置默认帧:", err.message);
                }
            }
        } else {
            console.warn(`动画 ${animationKey} 不存在，使用静态图像`);
            try {
                // 设置为默认帧
                enemy.setTexture('enemy', 0);
            } catch (err) {
                console.error("无法设置默认帧:", err.message);
            }
        }
    }
    
    spawnBossEnemy() {
        // 在玩家前方生成Boss敌人
        const bossDistance = 300;
        const angle = Math.random() * Math.PI * 2; // 随机角度
        
        const x = this.player.sprite.x + Math.cos(angle) * bossDistance;
        const y = this.player.sprite.y + Math.sin(angle) * bossDistance;
        
        // 生成Boss
        const bossConfig = this.enemyTypes.find(t => t.type === 'boss');
        const boss = this.spawnEnemyAt(x, y, 'boss');
        
        // 添加Boss警示和特效
        this.createBossWarning(x, y);
        
        return boss;
    }
    
    update(time) {
        // 处理敌人生成
        if (time > this.spawnTime && (!this.waveActive || this.enemiesRemaining > 0)) {
            this.spawnEnemy();
            this.spawnTime = time + Phaser.Math.Between(1000, 3000);
        }
        
        // 更新所有敌人的行为
        this.enemies.getChildren().forEach(enemy => {
            this.updateEnemyBehavior(enemy, time);
            
            // 执行特殊行为
            if (enemy.behavior) {
                enemy.behavior(enemy, time);
            }
        });
    }
    
    updateEnemyBehavior(enemy, time) {
        // 修改: 安全地检查动画状态
        if (enemy.anims && !enemy.anims.isPlaying) {
            this.playEnemyAnimation(enemy, 'enemyWalk');
        }

        // 简单的追踪AI
        const distance = Phaser.Math.Distance.Between(
            this.player.sprite.x, this.player.sprite.y,
            enemy.x, enemy.y
        );

        if (distance < 500) {
            let speed = enemy.typeConfig.speed || 100;

            // 计算方向向量
            const dx = this.player.sprite.x - enemy.x;
            const dy = this.player.sprite.y - enemy.y;
            const magnitude = Math.sqrt(dx * dx + dy * dy);

            // 移动敌人朝向玩家
            enemy.body.setVelocity(
                dx / magnitude * speed,
                dy / magnitude * speed
            );

            // 修改: 安全地设置敌人朝向和动画
            if (dx < 0) {
                this.playEnemyAnimation(enemy, 'enemyWalkLeft');
                enemy.flipX = true;
            } else {
                this.playEnemyAnimation(enemy, 'enemyWalkRight');
                enemy.flipX = false;
            }

            // 精英敌人的特殊行为
            if (enemy.enemyType === 'elite' && Phaser.Math.Between(0, 100) < 1) {
                // 随机冲刺
                enemy.body.setVelocity(
                    dx / magnitude * speed * 3,
                    dy / magnitude * speed * 3
                );
            }

            // 远程攻击
            if (enemy.attackType === 'range' && time > enemy.lastAttack) {
                this.fireEnemyBullet(enemy);
                enemy.lastAttack = time + enemy.attackInterval; // 攻击间隔
            }

            // 自爆攻击
            if (enemy.attackType === 'suicide' && distance < 100) {
                // 自爆逻辑在碰撞中处理
            }

            // 瞬移攻击
            if (enemy.attackType === 'teleport' && time > enemy.lastTeleport) {
                this.teleportEnemy(enemy);
                enemy.lastTeleport = time + enemy.attackInterval; // 瞬移间隔
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
            
            // 修改: 安全地设置敌人漫游动画
            if (enemy.wanderVelocityX < 0) {
                this.playEnemyAnimation(enemy, 'enemyWalkLeft');
                enemy.flipX = true;
            } else {
                this.playEnemyAnimation(enemy, 'enemyWalkRight');
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
        // 检查是否有暴击技能
        let finalDamage = damage;
        let isCritical = false;
        
        if (this.scene.passiveSkillSystem && this.scene.passiveSkillSystem.hasSkill('criticalHit')) {
            if (Math.random() < 0.1) { // 10% 暴击几率
                finalDamage *= 2;
                isCritical = true;
            }
        }
        
        enemy.health -= finalDamage;
        
        // 显示伤害数字
        this.showDamageNumber(enemy, finalDamage, isCritical);
        
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
        
        // 如果敌人死亡
        if (enemy.health <= 0) {
            // 执行死亡回调
            if (enemy.onDeath) {
                enemy.onDeath(enemy);
            }
            
            // 敌人死亡计数
            this.killedEnemiesCount++;
            this.totalKilledEnemies++;
            
            // 通知游戏场景更新击杀统计
            this.scene.enemyKilled();
            
            // 检查是否有特殊成就
            if (this.scene.waveSystem && this.scene.waveSystem.isWaveActive()) {
                // 检查是否是完美波次（没有受伤）
                if (!this.scene.player.hasBeenDamaged && this.killedEnemiesCount >= this.scene.waveSystem.getEnemiesForCurrentWave()) {
                    this.scene.achievementSystem.checkAchievement('perfectWave', true);
                }
            }
            
            // 返回敌人已死亡
            return true;
        }
        
        return false;
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
    
    createExplosion(x, y, radius, damage) {
        // 视觉效果 - 爆炸圆环
        const explosionCircle = this.scene.add.circle(x, y, radius, 0xff5500, 0.3);
        
        // 找到范围内的玩家和敌人
        const playerDistance = Phaser.Math.Distance.Between(x, y, this.player.sprite.x, this.player.sprite.y);
        
        // 如果玩家在爆炸范围内，造成伤害
        if (playerDistance < radius) {
            this.player.damage(damage, {x, y});
            
            // 击退玩家
            this.player.knockback(x, y, 300);
        }
        
        // 对范围内的其他敌人也造成伤害
        const nearbyEnemies = this.getNearbyEnemies(x, y, radius);
        nearbyEnemies.forEach(nearbyEnemy => {
            this.damageEnemy(nearbyEnemy, damage / 2); // 对其他敌人造成一半伤害
        });
        
        // 爆炸动画
        this.scene.tweens.add({
            targets: explosionCircle,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: function() {
                explosionCircle.destroy();
            }
        });
        
        // 爆炸粒子效果
        const particles = this.scene.add.particles(x, y, 'particle', {
            tint: 0xff5500,
            scale: { start: 0.5, end: 0.1 },
            speed: { min: 50, max: 150 },
            lifespan: 800,
            blendMode: 'ADD',
            frequency: -1
        });
        
        particles.explode(30);
        
        // 3秒后自动销毁粒子
        this.scene.time.delayedCall(3000, () => {
            particles.destroy();
        });
    }
    
    createHealEffect(sourceX, sourceY, targetX, targetY) {
        // 创建从治疗者到目标的连线
        const healLine = this.scene.add.graphics();
        healLine.lineStyle(2, 0x00ff00, 0.7);
        healLine.beginPath();
        healLine.moveTo(sourceX, sourceY);
        healLine.lineTo(targetX, targetY);
        healLine.closePath();
        healLine.strokePath();
        
        // 在目标处创建治疗特效
        const healEffect = this.scene.add.image(targetX, targetY, 'particle')
            .setScale(0.5)
            .setAlpha(0.7)
            .setTint(0x00ff00);
            
        // 特效动画
        this.scene.tweens.add({
            targets: [healLine],
            alpha: 0,
            duration: 500,
            onComplete: function() {
                healLine.destroy();
            }
        });
        
        this.scene.tweens.add({
            targets: healEffect,
            scale: 1,
            alpha: 0,
            duration: 500,
            onComplete: function() {
                healEffect.destroy();
            }
        });
    }
    
    createBossWarning(x, y) {
        // 创建Boss警告标记
        const warningText = this.scene.add.text(
            x, 
            y - 50, 
            'BOSS!', 
            {
                fontSize: '32px',
                fontStyle: 'bold',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // 警告标记动画
        this.scene.tweens.add({
            targets: warningText,
            y: y - 80,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                warningText.destroy();
            }
        });
        
        // 地面波纹效果
        const circle = this.scene.add.circle(x, y, 100, 0xff0000, 0.3);
        
        this.scene.tweens.add({
            targets: circle,
            scale: 2,
            alpha: 0,
            duration: 1000,
            onComplete: function() {
                circle.destroy();
            }
        });
    }
    
    createBossReward(x, y) {
        // Boss死亡奖励
        // 1. 大量魂点
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            // 生成高品质魂点
            const soulType = Math.random() < 0.5 ? 2 : 3; // 50%史诗, 50%传说
            this.scene.itemSystem.spawnSoul(x + offsetX, y + offsetY, soulType);
        }
        
        // 2. 随机元素效果
        if (this.scene.elementSystem) {
            const randomElement = this.scene.elementSystem.getRandomElement();
            this.scene.elementSystem.setActiveElement(randomElement.id);
            
            // 显示元素获取消息
            const elementText = this.scene.add.text(
                x, 
                y - 50, 
                `获得 ${randomElement.name} 元素!`, 
                {
                    fontSize: '24px',
                    fill: '#' + randomElement.color.toString(16).padStart(6, '0'),
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: elementText,
                y: y - 100,
                alpha: 0,
                duration: 2000,
                onComplete: function() {
                    elementText.destroy();
                }
            });
            
            // 检查元素成就
            const usedElements = this.scene.registry.get('usedElements') || [];
            if (!usedElements.includes(randomElement.id)) {
                usedElements.push(randomElement.id);
                this.scene.registry.set('usedElements', usedElements);
                this.scene.achievementSystem.checkAchievement('useElements', usedElements.length);
            }
        }
    }
    
    showDamageNumber(enemy, damage, isCritical = false) {
        const color = isCritical ? '#ff0000' : '#ffffff';
        const fontSize = isCritical ? '22px' : '16px';
        const text = isCritical ? damage + '!' : damage.toString();
        
        const damageText = this.scene.add.text(
            enemy.x, 
            enemy.y - 20, 
            text, 
            {
                fontSize: fontSize,
                fill: color,
                stroke: '#000000',
                strokeThickness: 2,
                fontStyle: isCritical ? 'bold' : 'normal'
            }
        ).setOrigin(0.5);
        
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
    
    getNearbyEnemies(x, y, radius, maxCount = Infinity, excludeList = []) {
        const nearbyEnemies = [];
        
        this.enemies.getChildren().forEach(enemy => {
            if (excludeList.includes(enemy)) return;
            
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (distance < radius) {
                nearbyEnemies.push({
                    enemy,
                    distance
                });
            }
        });
        
        // 按距离排序
        nearbyEnemies.sort((a, b) => a.distance - b.distance);
        
        // 只返回最近的maxCount个敌人
        return nearbyEnemies.slice(0, maxCount).map(item => item.enemy);
    }
    
    getKilledEnemiesCount() {
        return this.killedEnemiesCount;
    }
    
    resetKilledEnemiesCount() {
        this.killedEnemiesCount = 0;
    }
    
    getEnemiesForCurrentWave() {
        // 返回当前波次应该生成的敌人数量
        if (this.scene.waveSystem) {
            return this.scene.waveSystem.getEnemiesRemaining() + this.killedEnemiesCount;
        }
        return 0;
    }
}
