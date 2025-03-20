import { weaponsConfig } from '../config/gameConfig.js';

export class WeaponSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.currentWeapon = 0;
        this.weapons = weaponsConfig;
        this.bullets = scene.physics.add.group();
        this.lastFired = 0;
        this.autoFire = true; // 默认开启自动射击
        this.targetEnemy = null;
        this.targetLine = null;
        
        // 伤害和冷却修饰符
        this.damageMultiplier = 1.0;
        this.cooldownMultiplier = 1.0;
        
        this.init();
    }
    
    init() {
        // 创建目标线
        this.targetLine = this.scene.add.line(0, 0, 0, 0, 0, 0, 0xff0000)
            .setLineWidth(1)
            .setVisible(false);
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    upgrade(soulPoints) {
        const nextWeaponIndex = this.currentWeapon + 1;
        if (nextWeaponIndex < this.weapons.length && 
            soulPoints >= this.weapons[nextWeaponIndex].unlockCost) {
            
            // 扣除魂点
            const cost = this.weapons[nextWeaponIndex].unlockCost;
            this.currentWeapon = nextWeaponIndex;
            
            // 创建升级特效
            const upgradeEffect = this.scene.add.image(this.player.sprite.x, this.player.sprite.y, 'soul')
                .setTint(this.weapons[this.currentWeapon].color)
                .setScale(2)
                .setAlpha(0.7);
            
            this.scene.tweens.add({
                targets: upgradeEffect,
                scale: 5,
                alpha: 0,
                duration: 800,
                onComplete: function() {
                    upgradeEffect.destroy();
                }
            });
            
            return cost; // 返回消耗的魂点
        }
        return 0; // 未升级
    }
    
    // 添加自动升级检查函数
    checkAutoUpgrade(soulPoints) {
        const nextWeaponIndex = this.currentWeapon + 1;
        
        if (nextWeaponIndex < this.weapons.length && 
            soulPoints >= this.weapons[nextWeaponIndex].unlockCost) {
            
            // 获取消耗的魂点
            const cost = this.weapons[nextWeaponIndex].unlockCost;
            const weaponName = this.weapons[nextWeaponIndex].name;
            
            // 升级到下一级武器
            this.currentWeapon = nextWeaponIndex;
            
            // 升级特效
            const upgradeEffect = this.scene.add.image(this.player.sprite.x, this.player.sprite.y, 'soul')
                .setTint(this.weapons[this.currentWeapon].color)
                .setScale(2)
                .setAlpha(0.7);
            
            this.scene.tweens.add({
                targets: upgradeEffect,
                scale: 5,
                alpha: 0,
                duration: 800,
                onComplete: function() {
                    upgradeEffect.destroy();
                }
            });
            
            return {
                success: true,
                cost: cost,
                weaponName: weaponName
            };
        }
        
        return { success: false };
    }
    
    fireBullet() {
        const now = this.scene.time.now;
        // 应用冷却时间修饰符
        const adjustedFireRate = this.getCurrentWeapon().fireRate * this.cooldownMultiplier;
        
        if (now > this.lastFired) {
            const weapon = this.getCurrentWeapon();
            
            // 根据武器类型发射子弹
            if (weapon.bulletType === 'shotgun') {
                for (let i = -2; i <= 2; i++) {
                    const spreadAngle = i * 0.15; // 散射角度
                    this.createBullet(spreadAngle);
                }
            } else {
                this.createBullet(0);
            }
            
            this.lastFired = now + adjustedFireRate;
            return true;
        }
        return false;
    }
    
    createBullet(angleOffset) {
        const weapon = this.getCurrentWeapon();
        
        // 根据武器类型获取相应的子弹贴图
        let bulletTexture;
        switch (weapon.bulletType) {
            case 'pistol': bulletTexture = 'pistolBullet'; break;
            case 'shotgun': bulletTexture = 'shotgunBullet'; break;
            case 'rifle': bulletTexture = 'rifleBullet'; break;
            case 'sniper': bulletTexture = 'sniperBullet'; break;
            default: bulletTexture = 'pistolBullet';
        }
        
        const bullet = this.bullets.create(this.player.sprite.x, this.player.sprite.y, bulletTexture);
        
        // 设置子弹属性
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.damage = Math.round(weapon.damage * this.damageMultiplier); // 应用伤害修饰符
        bullet.setTint(weapon.color);
        
        // 如果有元素效果，添加到子弹上
        if (this.scene.elementSystem && this.scene.elementSystem.getActiveElement()) {
            bullet.element = this.scene.elementSystem.getActiveElement();
            bullet.setTint(bullet.element.color);
            
            // 添加粒子尾迹效果
            this.addElementalTrailEffect(bullet);
        }
        
        // 根据武器类型设置子弹大小和速度
        switch (weapon.bulletType) {
            case 'pistol':
                bullet.setScale(0.5);
                bullet.speed = 600;
                break;
            case 'shotgun':
                bullet.setScale(0.4);
                bullet.speed = 550;
                break;
            case 'rifle':
                bullet.setScale(0.5);
                bullet.speed = 700;
                break;
            case 'sniper':
                bullet.setScale(0.7);
                bullet.speed = 800;
                break;
            default:
                bullet.setScale(0.5);
                bullet.speed = 600;
        }
        
        // 计算发射方向
        let angle;
        if (this.player.sprite.flipX) {
            angle = Math.PI + angleOffset; // 左边
        } else {
            angle = 0 + angleOffset; // 右边
        }
        bullet.rotation = angle;
        
        // 设置子弹速度
        this.scene.physics.velocityFromRotation(angle, bullet.speed, bullet.body.velocity);
        
        // 设置子弹存活时间
        this.scene.time.delayedCall(1500, function () {
            if (bullet.active) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.destroy();
            }
        });
        
        // 射击特效
        const offsetX = this.player.sprite.flipX ? -20 : 20;
        const muzzleFlash = this.scene.add.image(this.player.sprite.x + offsetX, this.player.sprite.y - 5, 'soul')
            .setScale(0.5)
            .setTint(0xffff00)
            .setDepth(5);
        
        this.scene.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scale: 0.2,
            duration: 100,
            onComplete: function () {
                muzzleFlash.destroy();
            }
        });
        
        return bullet;
    }
    
    addElementalTrailEffect(bullet) {
        if (!bullet.element) return;
        
        const emitter = this.scene.add.particles(0, 0, 'particle', {
            tint: bullet.element.particleColor,
            scale: { start: 0.2, end: 0.05 },
            alpha: { start: 0.5, end: 0 },
            speed: 5,
            lifespan: 300,
            frequency: 15,
            follow: bullet
        });
        
        // 存储在子弹上，以便后续销毁
        bullet.trailEmitter = emitter;
        
        // 当子弹被销毁时，清理粒子发射器
        bullet.on('destroy', () => {
            if (bullet.trailEmitter) {
                bullet.trailEmitter.destroy();
            }
        });
    }
    
    fireAutoTargetBullet(target, angleOffset) {
        const weapon = this.getCurrentWeapon();
        
        // 根据武器类型获取相应的子弹贴图
        let bulletTexture;
        switch (weapon.bulletType) {
            case 'pistol': bulletTexture = 'pistolBullet'; break;
            case 'shotgun': bulletTexture = 'shotgunBullet'; break;
            case 'rifle': bulletTexture = 'rifleBullet'; break;
            case 'sniper': bulletTexture = 'sniperBullet'; break;
            default: bulletTexture = 'pistolBullet';
        }
        
        const bullet = this.bullets.create(this.player.sprite.x, this.player.sprite.y, bulletTexture);
        
        // 设置子弹属性
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.damage = Math.round(weapon.damage * this.damageMultiplier); // 应用伤害修饰符
        bullet.setTint(weapon.color);
        
        // 如果有元素效果，添加到子弹上
        if (this.scene.elementSystem && this.scene.elementSystem.getActiveElement()) {
            bullet.element = this.scene.elementSystem.getActiveElement();
            bullet.setTint(bullet.element.color);
            
            // 添加粒子尾迹效果
            this.addElementalTrailEffect(bullet);
        }
        
        // 根据武器类型设置子弹大小和速度
        switch (weapon.bulletType) {
            case 'pistol':
                bullet.setScale(0.5);
                bullet.speed = 600;
                break;
            case 'shotgun':
                bullet.setScale(0.4);
                bullet.speed = 550;
                break;
            case 'rifle':
                bullet.setScale(0.5);
                bullet.speed = 700;
                break;
            case 'sniper':
                bullet.setScale(0.7);
                bullet.speed = 800;
                break;
            default:
                bullet.setScale(0.5);
                bullet.speed = 600;
        }
        
        // 计算朝向目标的角度
        const angle = Phaser.Math.Angle.Between(
            this.player.sprite.x, 
            this.player.sprite.y, 
            target.x, 
            target.y
        ) + angleOffset;
        
        bullet.rotation = angle;

        // 根据武器类型设置散射角度
        let angleVariation = 0;
        if (weapon.bulletType === 'shotgun') {
            angleVariation = (Math.random() - 0.5) * 0.2; // 已有散射，这里仅添加微小随机性
        } else if (weapon.bulletType === 'rifle') {
            angleVariation = (Math.random() - 0.5) * 0.1; // 中等散射
        } else if (weapon.bulletType === 'pistol') {
            angleVariation = (Math.random() - 0.5) * 0.15; // 一般散射
        }
        // 狙击枪几乎没有散射
        
        // 设置子弹速度，考虑散射角度
        this.scene.physics.velocityFromRotation(angle + angleVariation, bullet.speed, bullet.body.velocity);
        
        // 设置子弹存活时间
        this.scene.time.delayedCall(1500, function () {
            if (bullet.active) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.destroy();
            }
        });
        
        // 射击特效
        const offsetX = this.player.sprite.flipX ? -20 : 20;
        const muzzleFlash = this.scene.add.image(this.player.sprite.x + offsetX, this.player.sprite.y - 5, 'soul')
            .setScale(0.5)
            .setTint(0xffff00)
            .setDepth(5);
        
        this.scene.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scale: 0.2,
            duration: 100,
            onComplete: function () {
                muzzleFlash.destroy();
            }
        });
        
        return bullet;
    }
    
    toggleAutoFire() {
        this.autoFire = !this.autoFire;
        
        // 显示切换提示
        const statusText = this.scene.add.text(
            this.player.sprite.x, 
            this.player.sprite.y - 50, 
            '自动射击: ' + (this.autoFire ? '开启' : '关闭'), 
            {
                fontSize: '18px',
                fill: this.autoFire ? '#00ff00' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: statusText,
            y: this.player.sprite.y - 100,
            alpha: 0,
            duration: 1000,
            onComplete: function() {
                statusText.destroy();
            }
        });
        
        return this.autoFire;
    }
    
    update(time, enemies) {
        // 更新武器状态和自动射击
        if (this.autoFire) {
            // 获取当前武器射程
            const weapon = this.getCurrentWeapon();
            const range = weapon.range;

            // 寻找最近的敌人
            let nearestEnemy = null;
            let nearestDistance = range;

            enemies.getChildren().forEach((enemy) => {
                const distance = Phaser.Math.Distance.Between(
                    this.player.sprite.x, this.player.sprite.y,
                    enemy.x, enemy.y
                );

                if (distance < nearestDistance) {
                    nearestEnemy = enemy;
                    nearestDistance = distance;
                }
            });

            // 更新目标敌人
            this.targetEnemy = nearestEnemy;

            // 如果找到目标敌人
            if (this.targetEnemy) {
                // 玩家朝向敌人
                this.player.sprite.flipX = this.targetEnemy.x < this.player.sprite.x;

                // 更新目标线
                this.targetLine
                    .setVisible(true)
                    .setPosition(this.player.sprite.x, this.player.sprite.y)
                    .setTo(0, 0, this.targetEnemy.x - this.player.sprite.x, this.targetEnemy.y - this.player.sprite.y);

                // 应用冷却时间修饰符
                const adjustedFireRate = weapon.fireRate * this.cooldownMultiplier;
                // 自动开火
                if (time > this.lastFired) {
                    // 霰弹枪发射多发子弹
                    if (weapon.bulletType === 'shotgun') {
                        for (let i = -2; i <= 2; i++) {
                            const spreadAngle = i * 0.15; // 散射角度
                            this.fireAutoTargetBullet(this.targetEnemy, spreadAngle);
                        }
                    } else {
                        this.fireAutoTargetBullet(this.targetEnemy, 0);
                    }
                    
                    this.lastFired = time + adjustedFireRate;
                }
            } else {
                // 没有目标时隐藏目标线
                this.targetLine.setVisible(false);
            }
        } else {
            // 非自动模式，隐藏目标线
            this.targetLine.setVisible(false);
        }
    }
    
    getNextWeaponInfo() {
        const nextWeaponIndex = this.currentWeapon + 1;
        if (nextWeaponIndex < this.weapons.length) {
            return {
                name: this.weapons[nextWeaponIndex].name,
                cost: this.weapons[nextWeaponIndex].unlockCost
            };
        }
        return null;
    }
    
    setTemporaryWeapon(weaponIndex, duration) {
        if (weaponIndex >= 0 && weaponIndex < this.weapons.length) {
            const oldWeapon = this.currentWeapon;
            this.currentWeapon = weaponIndex;
            
            // 武器特效
            const weaponEffect = this.scene.add.image(this.player.sprite.x, this.player.sprite.y, 'soul')
                .setTint(this.weapons[this.currentWeapon].color)
                .setAlpha(0.8)
                .setScale(1.5)
                .setDepth(5);
                
            this.scene.tweens.add({
                targets: weaponEffect,
                scale: 3,
                alpha: 0,
                duration: 800,
                onComplete: function() {
                    weaponEffect.destroy();
                }
            });
            
            // 设置定时恢复原武器
            this.scene.time.delayedCall(duration, () => {
                if (!this.scene.gameOver) {
                    this.currentWeapon = oldWeapon;
                    
                    // 显示武器恢复提示
                    const revertText = this.scene.add.text(
                        this.player.sprite.x, 
                        this.player.sprite.y - 30, 
                        '武器恢复为 ' + this.weapons[oldWeapon].name, 
                        {
                            fontSize: '18px',
                            fill: '#ffffff',
                            stroke: '#000000',
                            strokeThickness: 2
                        }
                    ).setOrigin(0.5);
                    
                    this.scene.tweens.add({
                        targets: revertText,
                        y: this.player.sprite.y - 80,
                        alpha: 0,
                        duration: 1500,
                        onComplete: function() {
                            revertText.destroy();
                        }
                    });
                }
            });
            
            return true;
        }
        return false;
    }
    
    // 增加伤害修饰符
    increaseDamageMultiplier(multiplier) {
        this.damageMultiplier *= multiplier;
        
        // 显示伤害提升效果
        const damageText = this.scene.add.text(
            this.player.sprite.x, 
            this.player.sprite.y - 50, 
            `伤害提升 ${Math.floor((multiplier - 1) * 100)}%!`, 
            {
                fontSize: '20px',
                fill: '#ff6666',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: damageText,
            y: this.player.sprite.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                damageText.destroy();
            }
        });
    }
    
    // 减少冷却时间修饰符
    decreaseCooldownMultiplier(multiplier) {
        this.cooldownMultiplier *= multiplier; // 注意：这是乘法，因为multiplier小于1会减少冷却时间
        
        // 显示冷却提升效果
        const cooldownText = this.scene.add.text(
            this.player.sprite.x, 
            this.player.sprite.y - 50, 
            `冷却时间减少 ${Math.floor((1 - multiplier) * 100)}%!`, 
            {
                fontSize: '20px',
                fill: '#66ccff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: cooldownText,
            y: this.player.sprite.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: function() {
                cooldownText.destroy();
            }
        });
    }
}
