export class WaveSystem {
    constructor(scene, enemyManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
        
        this.currentWave = 0;
        this.totalWaves = 10;
        this.enemiesPerWave = [5, 8, 12, 15, 20, 25, 30, 35, 40, 50]; // 每波的敌人数量
        this.enemiesRemaining = 0;
        this.waveActive = false;
        this.waveCompleted = false;
        this.allWavesCompleted = false;
        
        // 波次计时器
        this.waveTimer = 0;
        this.waveCooldown = 10000; // 波次之间的间隔时间(ms)
        this.waveStarted = false;
        
        try {
            // 创建波次UI文本
            this.createWaveUI();
        } catch (error) {
            console.error("Error in WaveSystem constructor:", error);
        }
    }
    
    createWaveUI() {
        try {
            // 使用安全的坐标值
            const x = 20;
            const y = 20;
            
            this.waveText = this.scene.add.text(
                x,
                y,
                '波次: 0/' + this.totalWaves,
                {
                    fontSize: '22px',
                    fill: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(1000);
            
            this.enemiesText = this.scene.add.text(
                x,
                y + 30,
                '剩余敌人: 0',
                {
                    fontSize: '18px',
                    fill: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(1000)
            .setVisible(false);
            
        } catch (error) {
            console.error("Error in createWaveUI:", error);
            // 创建降级版UI (如果有错误)
            this.waveText = { setText: () => {}, setVisible: () => {} };
            this.enemiesText = { setText: () => {}, setVisible: () => {} };
        }
    }
    
    update(time, delta) {
        try {
            if (this.allWavesCompleted) {
                return;
            }
            
            if (!this.waveActive) {
                // 波次之间的冷却时间
                if (time > this.waveTimer) {
                    if (!this.waveStarted) {
                        this.startNextWave();
                    }
                } else {
                    // 显示下一波倒计时
                    const remainingTime = Math.ceil((this.waveTimer - time) / 1000);
                    this.enemiesText.setText('下一波开始: ' + remainingTime + '秒');
                    this.enemiesText.setVisible(true);
                }
            } else {
                // 更新剩余敌人数量
                if (this.enemyManager && typeof this.enemyManager.getKilledEnemiesCount === 'function') {
                    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - this.enemyManager.getKilledEnemiesCount());
                    this.enemiesText.setText('剩余敌人: ' + this.enemiesRemaining);
                    this.enemiesText.setVisible(true);
                    
                    // 重置敌人击杀计数器
                    this.enemyManager.resetKilledEnemiesCount();
                }
                
                // 检查当前波次是否完成
                if (this.enemiesRemaining <= 0 && this.waveActive) {
                    this.completeWave();
                }
            }
        } catch (error) {
            console.error("Error in WaveSystem update:", error);
        }
    }
    
    startNextWave() {
        try {
            this.currentWave++;
            if (this.currentWave > this.totalWaves) {
                this.victoryComplete();
                return;
            }
            
            // 设置当前波次的敌人数量
            this.enemiesRemaining = this.enemiesPerWave[this.currentWave - 1];
            this.waveActive = true;
            this.waveStarted = true;
            
            // 更新UI
            this.waveText.setText('波次: ' + this.currentWave + '/' + this.totalWaves);
            
            // 显示波次开始消息
            this.showWaveStartMessage();
            
            // 设置敌人生成参数
            if (this.enemyManager && typeof this.enemyManager.setWaveParameters === 'function') {
                this.enemyManager.setWaveParameters(this.currentWave, this.enemiesRemaining);
            }
            
            // 最后一波增加Boss敌人
            if (this.currentWave === this.totalWaves && this.enemyManager && 
                typeof this.enemyManager.spawnBossEnemy === 'function') {
                this.enemyManager.spawnBossEnemy();
            }
            
            // 触发成就
            if (this.scene.achievementSystem && 
                typeof this.scene.achievementSystem.checkAchievement === 'function') {
                this.scene.achievementSystem.checkAchievement('reachWave', this.currentWave);
            }
        } catch (error) {
            console.error("Error in startNextWave:", error);
        }
    }
    
    completeWave() {
        try {
            this.waveActive = false;
            this.waveStarted = false;
            this.waveCompleted = true;
            
            // 显示波次完成消息
            if (this.currentWave < this.totalWaves) {
                this.showWaveCompleteMessage();
            }
            
            // 设置下一波的冷却时间
            this.waveTimer = this.scene.time.now + this.waveCooldown;
            
            // 所有波次完成检查
            if (this.currentWave >= this.totalWaves) {
                this.victoryComplete();
            }
        } catch (error) {
            console.error("Error in completeWave:", error);
        }
    }
    
    victoryComplete() {
        try {
            this.allWavesCompleted = true;
            
            // 显示胜利消息
            this.showVictoryMessage();
            
            // 记录在成就系统中
            if (this.scene.achievementSystem && 
                typeof this.scene.achievementSystem.unlockAchievement === 'function') {
                this.scene.achievementSystem.unlockAchievement('completeAllWaves');
            }
        } catch (error) {
            console.error("Error in victoryComplete:", error);
        }
    }
    
    showWaveStartMessage() {
        try {
            // 特殊波次提示
            let waveTitle = '第 ' + this.currentWave + ' 波';
            let waveSubtitle = '';
            
            if (this.currentWave === this.totalWaves) {
                waveTitle = '最终波次';
                waveSubtitle = 'BOSS来袭!';
            } else if (this.currentWave === Math.floor(this.totalWaves / 2)) {
                waveSubtitle = '难度提升！';
            }
            
            // 创建主标题
            const titleText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 - 50,
                waveTitle,
                {
                    fontSize: '40px',
                    fontStyle: 'bold',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 6
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setAlpha(0);
            
            // 副标题（如果有）
            let subtitleText = null;
            if (waveSubtitle) {
                subtitleText = this.scene.add.text(
                    this.scene.cameras.main.width / 2,
                    this.scene.cameras.main.height / 2,
                    waveSubtitle,
                    {
                        fontSize: '24px',
                        fill: '#ff0000',
                        stroke: '#000000',
                        strokeThickness: 4
                    }
                )
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2000)
                .setAlpha(0);
            }
            
            // 动画效果
            this.scene.tweens.add({
                targets: titleText,
                alpha: 1,
                y: this.scene.cameras.main.height / 2 - 70,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: titleText,
                        alpha: 0,
                        y: this.scene.cameras.main.height / 2 - 100,
                        delay: 1500,
                        duration: 800,
                        onComplete: () => {
                            titleText.destroy();
                        }
                    });
                }
            });
            
            if (subtitleText) {
                this.scene.tweens.add({
                    targets: subtitleText,
                    alpha: 1,
                    y: this.scene.cameras.main.height / 2 + 20,
                    duration: 800,
                    ease: 'Power2',
                    delay: 400,
                    onComplete: () => {
                        this.scene.tweens.add({
                            targets: subtitleText,
                            alpha: 0,
                            y: this.scene.cameras.main.height / 2 + 50,
                            delay: 1500,
                            duration: 800,
                            onComplete: () => {
                                subtitleText.destroy();
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error("Error in showWaveStartMessage:", error);
        }
    }
    
    showWaveCompleteMessage() {
        try {
            const completedText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
                '波次完成!',
                {
                    fontSize: '36px',
                    fontStyle: 'bold',
                    fill: '#00ff00',
                    stroke: '#000000',
                    strokeThickness: 5
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setAlpha(0);
            
            // 休息提示
            const restText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 + 50,
                '休息片刻...',
                {
                    fontSize: '24px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setAlpha(0);
            
            // 动画
            this.scene.tweens.add({
                targets: completedText,
                alpha: 1,
                y: this.scene.cameras.main.height / 2 - 20,
                duration: 800,
                ease: 'Power2'
            });
            
            this.scene.tweens.add({
                targets: restText,
                alpha: 1,
                duration: 800,
                delay: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: [completedText, restText],
                        alpha: 0,
                        delay: 1500,
                        duration: 800,
                        onComplete: () => {
                            completedText.destroy();
                            restText.destroy();
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Error in showWaveCompleteMessage:", error);
        }
    }
    
    showVictoryMessage() {
        try {
            // 创建半透明黑色背景
            const overlay = this.scene.add.rectangle(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
                this.scene.cameras.main.width,
                this.scene.cameras.main.height,
                0x000000,
                0.7
            )
            .setScrollFactor(0)
            .setDepth(1999)
            .setAlpha(0);
            
            // 创建胜利文本
            const victoryText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 - 100,
                '胜利!',
                {
                    fontSize: '64px',
                    fontStyle: 'bold',
                    fill: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 6
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setAlpha(0);
            
            // 创建魂点文本
            const soulText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 + 20,
                '总共收集: ' + this.scene.soulPoints + ' 魂点',
                {
                    fontSize: '32px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setAlpha(0);
            
            // 添加继续按钮
            const continueButton = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 + 100,
                '继续探索',
                {
                    fontSize: '28px',
                    fill: '#00ff00',
                    stroke: '#000000',
                    strokeThickness: 3,
                    backgroundColor: '#333333',
                    padding: { x: 20, y: 10 }
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setAlpha(0)
            .setInteractive({ useHandCursor: true });
            
            continueButton.on('pointerover', function() {
                this.setScale(1.1);
            });
            
            continueButton.on('pointerout', function() {
                this.setScale(1);
            });
            
            continueButton.on('pointerdown', () => {
                // 隐藏胜利界面，但不结束游戏，继续让玩家探索
                this.scene.tweens.add({
                    targets: [overlay, victoryText, soulText, continueButton],
                    alpha: 0,
                    duration: 500,
                    onComplete: function() {
                        overlay.destroy();
                        victoryText.destroy();
                        soulText.destroy();
                        continueButton.destroy();
                    }
                });
            });
            
            // 动画
            this.scene.tweens.add({
                targets: overlay,
                alpha: 0.7,
                duration: 1000
            });
            
            this.scene.tweens.add({
                targets: victoryText,
                alpha: 1,
                y: this.scene.cameras.main.height / 2 - 80,
                duration: 1000,
                ease: 'Power2',
                delay: 500
            });
            
            this.scene.tweens.add({
                targets: soulText,
                alpha: 1,
                duration: 1000,
                delay: 1000
            });
            
            this.scene.tweens.add({
                targets: continueButton,
                alpha: 1,
                duration: 1000,
                delay: 1500
            });
        } catch (error) {
            console.error("Error in showVictoryMessage:", error);
        }
    }
    
    getCurrentWave() {
        return this.currentWave;
    }
    
    getTotalWaves() {
        return this.totalWaves;
    }
    
    isWaveActive() {
        return this.waveActive;
    }
    
    getEnemiesRemaining() {
        return this.enemiesRemaining;
    }
    
    // 添加缺失的方法
    getEnemiesForCurrentWave() {
        return this.enemiesPerWave[this.currentWave - 1] || 0;
    }
    
    resetWaves() {
        try {
            this.currentWave = 0;
            this.enemiesRemaining = 0;
            this.waveActive = false;
            this.waveCompleted = false;
            this.allWavesCompleted = false;
            this.waveStarted = false;
            
            // 更新UI
            if (this.waveText) this.waveText.setText('波次: 0/' + this.totalWaves);
            if (this.enemiesText) {
                this.enemiesText.setText('剩余敌人: 0');
                this.enemiesText.setVisible(false);
            }
        } catch (error) {
            console.error("Error in resetWaves:", error);
        }
    }
}
