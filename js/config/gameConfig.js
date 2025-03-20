// 游戏全局配置
export const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 武器配置 - 已增加了升级所需魂点
export const weaponsConfig = [
    { name: '手枪', range: 300, damage: 1, fireRate: 300, color: 0xffffff, unlockCost: 0, bulletType: 'pistol' },
    { name: '霰弹枪', range: 200, damage: 2, fireRate: 600, color: 0xff8800, unlockCost: 120, bulletType: 'shotgun' },
    { name: '步枪', range: 400, damage: 1, fireRate: 150, color: 0x00ff00, unlockCost: 300, bulletType: 'rifle' },
    { name: '狙击枪', range: 600, damage: 3, fireRate: 800, color: 0xff0000, unlockCost: 600, bulletType: 'sniper' }
];
