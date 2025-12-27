import * as PIXI from 'pixi.js';
import { InputManager } from '../core/InputManager';

interface Animation {
  name: string;
  row: number;
  frames: number;
  speed: number; // frames per second
}

export class Character {
  private sprite: PIXI.AnimatedSprite;
  private inputManager: InputManager;
  private animations: Map<string, PIXI.Texture[]> = new Map();

  // Character properties
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private speed: number = 150; // Movement speed
  private jumpForce: number = -400; // Jump strength (negative = up)
  private gravity: number = 980; // Gravity force
  private isOnGround: boolean = false;
  private currentAnimation: string = 'idle';
  private facingRight: boolean = true;

  // Frame dimensions
  private readonly FRAME_WIDTH = 144;
  private readonly FRAME_HEIGHT = 80;

  constructor(
    spritesheet: PIXI.Texture,
    inputManager: InputManager,
    x: number,
    y: number
  ) {
    this.inputManager = inputManager;

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
    this.sprite.anchor.set(0.5, 1); // Anchor at bottom center
    this.sprite.play();
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

  // Update character (called every frame)
  update(deltaTime: number): void {
    const dt = deltaTime / 60; // Normalize deltaTime

    // Handle horizontal movement
    this.velocity.x = 0;

    if (this.inputManager.isLeftPressed()) {
      this.velocity.x = -this.speed;
      this.facingRight = false;
    } else if (this.inputManager.isRightPressed()) {
      this.velocity.x = this.speed;
      this.facingRight = true;
    }

    // Apply gravity
    if (!this.isOnGround) {
      this.velocity.y += this.gravity * dt;
    }

    // Handle jumping
    if (this.inputManager.isJumpPressed() && this.isOnGround) {
      this.velocity.y = this.jumpForce;
      this.isOnGround = false;
    }

    // Update position
    this.sprite.position.x += this.velocity.x * dt;
    this.sprite.position.y += this.velocity.y * dt;

    // Simple ground collision (we'll improve this later)
    const groundY = 530; // Temporary ground position
    if (this.sprite.position.y >= groundY) {
      this.sprite.position.y = groundY;
      this.velocity.y = 0;
      this.isOnGround = true;
    }

    // Update sprite direction
    this.sprite.scale.x = this.facingRight ? 1 : -1;

    // Update animation based on state
    this.updateAnimation();
  }

  // Update animation based on character state
  private updateAnimation(): void {
    if (!this.isOnGround) {
      this.playAnimation('jump', 10);
    } else if (this.velocity.x !== 0) {
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

  // Set ground state (will be used for proper collision later)
  setOnGround(onGround: boolean): void {
    this.isOnGround = onGround;
  }
}
