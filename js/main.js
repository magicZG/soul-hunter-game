import { config } from './config/gameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// 创建游戏实例
const game = new Phaser.Game(config);

// 添加场景
game.scene.add('Boot', BootScene);
game.scene.add('Game', GameScene);
game.scene.add('GameOver', GameOverScene);

// 启动引导场景
game.scene.start('Boot');
