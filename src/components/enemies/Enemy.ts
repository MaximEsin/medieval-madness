import * as PIXI from 'pixi.js';
import type { Body, TilemapLoader } from '../../core/TilemapLoader';

interface EnemyAnimation {
  name: 'idle' | 'walk' | 'attack';
  texture: PIXI.Texture;
  frames: number;
  speed: number; // fps
}

export class Enemy {
  private sprite: PIXI.AnimatedSprite;
  private animations: Map<string, PIXI.Texture[]> = new Map();

  private tilemap: TilemapLoader;
  private body: Body;

  private speed = 80;
  private gravity = 2500;

  private facingRight = false;
  private currentAnimation = 'idle';

  private isAttacking = false;
  private attackTimer = 0;
  private readonly ATTACK_DURATION = 0.4;

  private health = 1;

  // Размер одного кадра (враг обычно компактный)
  private readonly FRAME_WIDTH = 64;
  private readonly FRAME_HEIGHT = 64;

  constructor(
    animations: EnemyAnimation[],
    x: number,
    y: number,
    tilemap: TilemapLoader
  ) {
    this.tilemap = tilemap;

    this.createAnimations(animations);

    const idle = this.animations.get('idle');
    if (!idle) throw new Error('Enemy idle animation missing');

    this.sprite = new PIXI.AnimatedSprite(idle);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = 6 / 60;
    this.sprite.play();

    this.body = {
      x: x - 12,
      y: y - 28,
      width: 24,
      height: 28,
      vx: 0,
      vy: 0,
      onGround: false,
    };
  }

  /* ============================
     ANIMATIONS
  ============================ */

  private createAnimations(data: EnemyAnimation[]): void {
    data.forEach((anim) => {
      const textures: PIXI.Texture[] = [];

      for (let i = 0; i < anim.frames; i++) {
        textures.push(
          new PIXI.Texture({
            source: anim.texture.source,
            frame: new PIXI.Rectangle(
              i * this.FRAME_WIDTH,
              0,
              this.FRAME_WIDTH,
              this.FRAME_HEIGHT
            ),
          })
        );
      }

      this.animations.set(anim.name, textures);
    });
  }

  private playAnimation(name: string, fps: number): void {
    if (this.currentAnimation === name) return;

    const textures = this.animations.get(name);
    if (!textures) return;

    this.currentAnimation = name;
    this.sprite.textures = textures;
    this.sprite.animationSpeed = fps / 60;
    this.sprite.play();
  }

  /* ============================
     UPDATE
  ============================ */

  update(deltaTime: number): void {
    const dt = deltaTime / 60;

    // --- Attack state ---
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // --- Movement ---
    if (!this.isAttacking) {
      this.body.vx = this.facingRight ? this.speed : -this.speed;
    } else {
      this.body.vx = 0;
    }

    // --- Gravity ---
    this.body.vy += this.gravity * dt;

    // --- Collision ---
    this.tilemap.resolveCollision(this.body, dt);

    // --- Edge detection (не падает с платформы) ---
    if (this.body.onGround) {
      const footX = this.facingRight
        ? this.body.x + this.body.width + 2
        : this.body.x - 2;

      const footY = this.body.y + this.body.height + 2;

      if (!this.tilemap.hasSolidTileAtWorld(footX, footY)) {
        this.facingRight = !this.facingRight;
      }
    }

    // --- Apply to sprite ---
    this.sprite.position.set(
      this.body.x + this.body.width / 2,
      this.body.y + this.body.height
    );

    this.sprite.scale.x = this.facingRight ? 1 : -1;

    // --- Animation ---
    this.updateAnimation();
  }

  private updateAnimation(): void {
    if (this.isAttacking) {
      this.playAnimation('attack', 12);
    } else if (this.body.vx !== 0) {
      this.playAnimation('walk', 8);
    } else {
      this.playAnimation('idle', 6);
    }
  }

  /* ============================
     COMBAT
  ============================ */

  startAttack(): void {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.attackTimer = this.ATTACK_DURATION;
  }

  takeDamage(amount = 1): void {
    this.health -= amount;

    if (this.health <= 0) {
      this.sprite.destroy();
    }
  }

  /* ============================
     GETTERS
  ============================ */

  getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }

  getBody(): Body {
    return this.body;
  }
}
