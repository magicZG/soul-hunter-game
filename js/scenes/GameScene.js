import { Player } from '../entities/Player.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { ItemSystem } from '../systems/ItemSystem.js';
import { UIManager } from '../ui/UIManager.js';
import { CollisionManager } from '../systems/CollisionManager.js';
import { InputManager } from '../systems/InputManager.js';
import { PassiveSkillSystem } from '../systems/PassiveSkillSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { ElementSystem } from '../systems/ElementSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
        this.gameOver = false;
        this.soulPoints = 0;
        this.gameTime = 0;
        this.totalKills = 0;
        this.totalSoulsCollected = 0;
    }
    
    create() {
        // 设置地图和边界
        const mapSize = 2000;
        this.physics.world.setBounds(0, 0, mapSize, mapSize);
        
        // 创建背景
        this.add.rectangle(0, 0, mapSize, mapSize, 0x222222)
            .setOrigin(0, 0)
            .setDepth(-1);
        
        // 初始化各个系统
        this.player = new Player(this, mapSize/2, mapSize/2);
        this.weaponSystem = new WeaponSystem(this, this.player);
        this.enemyManager = new EnemyManager(this, this.player);
        this.itemSystem = new ItemSystem(this, this.player);
        this.passiveSkillSystem = new PassiveSkillSystem(this, this.player);
        this.elementSystem = new ElementSystem(this);
        this.achievementSystem = new AchievementSystem(this);
        this.waveSystem = new WaveSystem(this, this.enemyManager);
        this.uiManager = new UIManager(this, this.player, this.weaponSystem, this.passiveSkillSystem, this.elementSystem);
        this.inputManager = new InputManager(this, this.player, this.weaponSystem, this.uiManager);
        this.collisionManager = new CollisionManager(this);
        
        // 设置摄像机
        this.cameras.main.setBounds(0, 0, mapSize, mapSize);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        
        // 设置碰撞
        this.collisionManager.setupCollisions(
            this.player,
            this.weaponSystem.bullets,
            this.enemyManager.enemies,
            this.enemyManager.enemyBullets,
            this.itemSystem.souls,
            this.itemSystem.traps,
            this.itemSystem.chests
        );
        
        // 初始化游戏状态
        this.soulPoints = 0;
        this.gameOver = false;
        this.gameTime = 0;
        this.totalKills = 0;
        this.totalSoulsCollected = 0;
        
        // 设置注册表存储游戏状态
        this.registry.set('usedElements', []);
    }
    
    update(time, delta) {
        if (this.gameOver) return;
        
        // 更新游戏时间
        this.gameTime += delta;
        
        // 更新各个系统
        this.player.update(time, delta);
        this.inputManager.update();
        this.weaponSystem.update(time, this.enemyManager.enemies);
        this.enemyManager.update(time);
        this.itemSystem.update(time, this.soulPoints);
        this.uiManager.update(time);
        this.passiveSkillSystem.update(time);
        this.elementSystem.update(time);
        this.waveSystem.update(time, delta);
        
        // 检查是否可以自动升级武器
        const upgradeResult = this.weaponSystem.checkAutoUpgrade(this.soulPoints);
        if (upgradeResult.success) {
            // 扣除升级费用
            this.soulPoints -= upgradeResult.cost;
            this.uiManager.updateSoulPoints(this.soulPoints);
            this.uiManager.updateWeaponText();
            this.uiManager.showWeaponUpgradeNotification(upgradeResult.weaponName);
            
            // 检查武器成就
            this.achievementSystem.checkAchievement('weaponLevel', this.weaponSystem.currentWeapon);
        }
        
        // 定期检查成就
        if (time % 5000 < 20) {  // 每5秒检查一次
            this.achievementSystem.checkAchievement('survived', this.gameTime);
            this.achievementSystem.checkAchievement('collectSouls', this.totalSoulsCollected);
        }
        
        // 检查游戏是否结束
        if (this.player.health <= 0 && !this.gameOver) {
            this.gameOver = true;
            this.showGameOver();
        }
    }
    
    addSoulPoints(points) {
        this.soulPoints += points;
        
        if (!this.totalSoulsCollected) this.totalSoulsCollected = 0;
        this.totalSoulsCollected += points;
        
        this.uiManager.updateSoulPoints(this.soulPoints);
        
        // 检查成就
        this.achievementSystem.checkAchievement('collectSouls', this.totalSoulsCollected);
        
        return this.soulPoints;
    }
    
    enemyKilled() {
        this.totalKills++;
        
        // 检查成就
        this.achievementSystem.checkAchievement('kill', this.totalKills);
        
        return this.totalKills;
    }
    
    showGameOver() {
        this.scene.start('GameOver', { 
            score: this.soulPoints, 
            kills: this.totalKills,
            wave: this.waveSystem.getCurrentWave()
        });
    }
}
