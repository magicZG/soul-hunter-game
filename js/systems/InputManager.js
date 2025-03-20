// js/systems/InputManager.js
export class InputManager {
    constructor(scene, player, weaponSystem, uiManager) {
        this.scene = scene;
        this.player = player;
        this.weaponSystem = weaponSystem;
        this.uiManager = uiManager;
        
        // 控制状态
        this.isUsingKeyboard = false;
        
        // 初始化控制器
        this.init();
    }
    
    init() {
        // 键盘控制设置
        this.keys = this.scene.input.keyboard.addKeys({
            up: 'W',
            left: 'A',
            down: 'S',
            right: 'D'
        });
        
        // 单次触发的按键设置
        this.keyJ = this.scene.input.keyboard.addKey('J');
        this.keyK = this.scene.input.keyboard.addKey('K');
        this.keyL = this.scene.input.keyboard.addKey('L');
        
        this.scene.input.keyboard.on('keydown-J', () => {
            this.uiManager.upgradeWeapon();
        });
        
        this.scene.input.keyboard.on('keydown-K', () => {
            this.uiManager.toggleAutoFire();
        });
        
        // 虚拟摇杆控制
        this.setupJoystick();
        
        // 设置触摸/鼠标事件处理
        this.scene.input.on('pointerdown', this.handlePointerDown, this);
        this.scene.input.on('pointermove', this.handlePointerMove, this);
        this.scene.input.on('pointerup', this.handlePointerUp, this);
    }
    
    setupJoystick() {
        // 创建虚拟摇杆
        const joyStickRadius = 50;
        const joyStickX = 100;
        const joyStickY = this.scene.cameras.main.height - 100;

        // 摇杆背景
        this.joystickBase = this.scene.add.image(joyStickX, joyStickY, 'joystickBase')
            .setScrollFactor(0)
            .setAlpha(0.7)
            .setScale(1.5)
            .setDepth(1000);

        // 摇杆按钮
        this.joystick = this.scene.add.image(joyStickX, joyStickY, 'joystick')
            .setScrollFactor(0)
            .setAlpha(0.9)
            .setScale(0.8)
            .setDepth(1002);

        this.joystick.baseX = joyStickX;
        this.joystick.baseY = joyStickY;
        this.joystick.radius = joyStickRadius;
        this.joystick.isBeingDragged = false;
    }
    
    update() {
        // 键盘控制
        let keyboardMoving = false;
        let dx = 0;
        let dy = 0;
        
        if (this.keys.up.isDown) {
            dy -= 1;
            keyboardMoving = true;
        }
        if (this.keys.down.isDown) {
            dy += 1;
            keyboardMoving = true;
        }
        if (this.keys.left.isDown) {
            dx -= 1;
            keyboardMoving = true;
            this.player.sprite.flipX = true;
        }
        if (this.keys.right.isDown) {
            dx += 1;
            keyboardMoving = true;
            this.player.sprite.flipX = false;
        }
        
        // 键盘射击
        if (this.keyL.isDown) {
            this.weaponSystem.fireBullet();
        }
        
        // 如果使用键盘控制
        if (keyboardMoving) {
            this.isUsingKeyboard = true;
            
            // 归一化向量(防止对角线移动更快)
            if (dx !== 0 && dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx = dx / length;
                dy = dy / length;
            }
            
            // 设置玩家速度
            const speed = 300;
            this.player.sprite.setVelocity(dx * speed, dy * speed);
            
            // 朝向控制
            if (dx !== 0) {
                this.player.sprite.flipX = dx < 0;
            }
        }
        // 虚拟摇杆控制(移动设备)
        else if (this.joystick.isBeingDragged) {
            this.isUsingKeyboard = false;
            
            // 计算距离和方向
            dx = this.joystick.x - this.joystick.baseX;
            dy = this.joystick.y - this.joystick.baseY;

            // 归一化并缩放
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            const speedFactor = Phaser.Math.Clamp(magnitude / this.joystick.radius, 0, 1);

            // 应用速度
            const speed = 300;
            this.player.sprite.setVelocity(
                dx / magnitude * speed * speedFactor,
                dy / magnitude * speed * speedFactor
            );

            // 朝向控制
            if (magnitude > 10) {
                this.player.sprite.flipX = dx < 0;
            }
        } else if (!this.isUsingKeyboard) {
            // 没有输入，停止移动
            this.player.sprite.setVelocity(0, 0);
        }
    }
    
    handlePointerDown(pointer) {
        const touchX = pointer.x;
        const touchY = pointer.y;

        // 判断是否点在虚拟摇杆区域
        const distance = Phaser.Math.Distance.Between(
            this.joystick.baseX, 
            this.joystick.baseY, 
            touchX, 
            touchY
        );

        if (distance < this.joystick.radius * 1.5) {
            this.joystick.isBeingDragged = true;
            this.joystick.x = touchX;
            this.joystick.y = touchY;

            // 保存指针ID以追踪这个触摸点
            this.joystick.pointerId = pointer.id;
            
            // 切换到触摸控制
            this.isUsingKeyboard = false;
        }
    }
    
    handlePointerMove(pointer) {
        if (this.joystick.isBeingDragged && this.joystick.pointerId === pointer.id) {
            const touchX = pointer.x;
            const touchY = pointer.y;

            // 计算从基点到触摸点的向量
            const dx = touchX - this.joystick.baseX;
            const dy = touchY - this.joystick.baseY;

            // 计算距离
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.joystick.radius) {
                // 在半径范围内，直接移动到触摸位置
                this.joystick.x = touchX;
                this.joystick.y = touchY;
            } else {
                // 超出范围，限制在半径内
                const angle = Math.atan2(dy, dx);
                this.joystick.x = this.joystick.baseX + Math.cos(angle) * this.joystick.radius;
                this.joystick.y = this.joystick.baseY + Math.sin(angle) * this.joystick.radius;
            }
            
            // 切换到触摸控制
            this.isUsingKeyboard = false;
        }
    }
    
    handlePointerUp(pointer) {
        if (this.joystick.isBeingDragged && this.joystick.pointerId === pointer.id) {
            this.joystick.isBeingDragged = false;
            this.joystick.x = this.joystick.baseX;
            this.joystick.y = this.joystick.baseY;
        }
    }
}
