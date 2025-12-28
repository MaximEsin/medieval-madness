import * as PIXI from 'pixi.js';
import { InputManager } from '../core/InputManager';
import { TilemapLoader, type Body } from '../core/TilemapLoader';

interface Animation {
  name: string;
  row: number;
  frames: number;
  speed: number; // frames per second
}

const VISUAL_Y_OFFSET = 17;

export class Character {
  private sprite: PIXI.AnimatedSprite;
  private inputManager: InputManager;
  private animations: Map<string, PIXI.Texture[]> = new Map();

  // Character properties
  private speed: number = 200; // Movement speed
  private jumpForce: number = -700; // Jump strength (negative = up)
  private gravity: number = 2500; // Gravity force
  private currentAnimation: string = 'idle';
  private facingRight: boolean = true;

  // Frame dimensions
  private readonly FRAME_WIDTH = 144;
  private readonly FRAME_HEIGHT = 80;

  private body: Body;
  private tilemap: TilemapLoader;

  constructor(
    spritesheet: PIXI.Texture,
    inputManager: InputManager,
    x: number,
    y: number,
    tilemap: TilemapLoader
  ) {
    this.inputManager = inputManager;
    this.tilemap = tilemap;

    // Define animations we'll use (idle, walk, jump)
    const animationData: Animation[] = [
      { name: 'idle', row: 0, frames: 8, speed: 10 },
      { name: 'walk', row: 1, frames: 8, speed: 12 },
      { name: 'jump', row: 8, frames: 3, speed: 10 },
    ];

    // Create textures for each animation
    this.createAnimations(spritesheet, animationData);

    // Create animated sprite with idle animation
    const idleTextures = this.animations.get('idle')!;
    this.sprite = new PIXI.AnimatedSprite(idleTextures);
    this.sprite.animationSpeed = 10 / 60; // Convert fps to PixiJS speed
    this.sprite.position.set(x, y);
    this.sprite.anchor.set(0.4, 1); // Anchor at bottom center
    this.sprite.play();

    this.body = {
      x: x - 10,
      y: y - 28,
      width: 20,
      height: 28,
      vx: 0,
      vy: 0,
      onGround: false,
    };
  }

  // Create animation textures from spritesheet
  private createAnimations(
    spritesheet: PIXI.Texture,
    animations: Animation[]
  ): void {
    animations.forEach((anim) => {
      const textures: PIXI.Texture[] = [];

      for (let i = 0; i < anim.frames; i++) {
        const texture = new PIXI.Texture({
          source: spritesheet.source,
          frame: new PIXI.Rectangle(
            i * this.FRAME_WIDTH,
            anim.row * this.FRAME_HEIGHT,
            this.FRAME_WIDTH,
            this.FRAME_HEIGHT
          ),
        });
        textures.push(texture);
      }

      this.animations.set(anim.name, textures);
    });
  }

  // Play a specific animation
  private playAnimation(name: string, speed: number = 10): void {
    if (this.currentAnimation === name) return;

    const textures = this.animations.get(name);
    if (!textures) return;

    this.currentAnimation = name;
    this.sprite.textures = textures;
    this.sprite.animationSpeed = speed / 60;
    this.sprite.play();
  }

  update(deltaTime: number): void {
    const dt = deltaTime / 60; // секунды

    // ===== INPUT =====
    this.body.vx = 0;

    if (this.inputManager.isLeftPressed()) {
      this.body.vx = -this.speed;
      this.facingRight = false;
    }
    if (this.inputManager.isRightPressed()) {
      this.body.vx = this.speed;
      this.facingRight = true;
    }
    if (this.inputManager.isJumpPressed() && this.body.onGround) {
      this.body.vy = this.jumpForce;
      this.body.onGround = false;
    }

    // ===== GRAVITY =====
    if (!this.body.onGround) {
      this.body.vy += this.gravity * dt;
    }

    // ===== COLLISION =====
    this.tilemap.resolveCollision(this.body, dt);

    // ===== APPLY TO SPRITE =====
    this.sprite.position.set(
      this.body.x + this.body.width / 2,
      this.body.y + this.body.height + VISUAL_Y_OFFSET
    );

    this.sprite.scale.x = this.facingRight ? 1 : -1;

    // ===== ANIMATION =====
    this.updateAnimation();
  }

  // Update animation based on character state
  private updateAnimation(): void {
    if (!this.body.onGround) {
      this.playAnimation('jump', 10);
    } else if (this.body.vx !== 0) {
      this.playAnimation('walk', 12);
    } else {
      this.playAnimation('idle', 10);
    }
  }

  // Get the sprite to add to the scene
  getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }

  // Get character position
  getPosition(): { x: number; y: number } {
    return { x: this.sprite.position.x, y: this.sprite.position.y };
  }
}
