import * as PIXI from 'pixi.js';
import type { Body, TilemapLoader } from '../../core/TilemapLoader';
import type { Character } from '../Character';
import { aabb } from '../../helpers/helpers';

interface EnemyAnimation {
  name: 'idle' | 'walk' | 'attack';
  texture: PIXI.Texture;
  frames: number;
  fps: number;
}

const VISUAL_OFFSET_Y = 7;

export class GroundEnemy {
  private sprite: PIXI.AnimatedSprite;
  private animations = new Map<string, PIXI.Texture[]>();
  private tilemap: TilemapLoader;
  private body: Body;
  private speed = 80;
  private gravity = 2500;
  private facingRight = false;
  private currentAnimation = 'idle';
  private health = 1;

  private isAttacking = false;
  private attackTimer = 0;
  private readonly ATTACK_DURATION = 0.4;
  private attackCooldown = 1; // секунды
  private attackCooldownTimer = 0;

  private readonly FRAME_WIDTH = 149;
  private readonly FRAME_HEIGHT = 96;

  constructor(
    animations: EnemyAnimation[],
    x: number,
    y: number,
    tilemap: TilemapLoader
  ) {
    this.tilemap = tilemap;
    this.createAnimations(animations);

    const idle = this.animations.get('idle');
    if (!idle) throw new Error('GroundEnemy: idle animation missing');

    this.sprite = new PIXI.AnimatedSprite(idle);
    this.sprite.anchor.set(0.4, 1);
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

  private createAnimations(data: EnemyAnimation[]): void {
    data.forEach((anim) => {
      const frames: PIXI.Texture[] = [];
      for (let i = 0; i < anim.frames; i++) {
        frames.push(
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
      this.animations.set(anim.name, frames);
    });
  }

  private playAnimation(name: 'idle' | 'walk' | 'attack', fps: number): void {
    if (this.currentAnimation === name) return;
    const textures = this.animations.get(name);
    if (!textures) return;
    this.currentAnimation = name;
    this.sprite.textures = textures;
    this.sprite.animationSpeed = fps / 60;
    this.sprite.play();
  }

  update(deltaTime: number, hero: Character): void {
    const dt = deltaTime;

    // --- ATTACK TIMER ---
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) this.isAttacking = false;
    } else {
      // --- AI: простая атака по дистанции ---
      const distance = hero.getBody().x - this.body.x;
      if (
        Math.abs(distance) < 40 &&
        this.attackCooldownTimer <= 0 &&
        !this.isAttacking
      ) {
        if (this.isHeroInFront(hero)) {
          this.startAttack();
        }
      }
    }

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }

    // --- MOVE ---
    if (!this.isAttacking)
      this.body.vx = this.facingRight ? this.speed : -this.speed;
    else this.body.vx = 0;

    // --- GRAVITY ---
    this.body.vy += this.gravity * dt;

    // --- COLLISION ---
    this.tilemap.resolveCollision(this.body, dt);

    // --- PLATFORM EDGE ---
    if (this.body.onGround) {
      const checkX = this.facingRight
        ? this.body.x + this.body.width + 2
        : this.body.x - 2;
      const checkY = this.body.y + this.body.height + 2;
      if (!this.tilemap.hasSolidTileAtWorld(checkX, checkY))
        this.facingRight = !this.facingRight;
    }

    // --- APPLY TO SPRITE ---
    this.sprite.position.set(
      this.body.x + this.body.width / 2,
      this.body.y + this.body.height + VISUAL_OFFSET_Y
    );
    this.sprite.scale.x = this.facingRight ? 1 : -1;

    // --- ANIMATION ---
    this.updateAnimation();

    // --- COLLISION WITH HERO ---
    this.checkHeroCollision(hero);
  }

  private updateAnimation(): void {
    if (this.isAttacking) this.playAnimation('attack', 12);
    else if (this.body.vx !== 0) this.playAnimation('walk', 8);
    else this.playAnimation('idle', 6);
  }

  private checkHeroCollision(hero: Character) {
    const heroAttack = hero.getAttackBox();
    const enemyAttack = this.getAttackBox();

    // Герой бьёт врага
    if (heroAttack && aabb(heroAttack, this.body)) {
      this.takeDamage(1);
    }

    // Враг бьёт героя
    if (enemyAttack && aabb(enemyAttack, hero.getBody())) {
      hero.takeDamage(1);
    }
  }

  getAttackBox(): Body | null {
    if (!this.isAttacking) return null;

    const range = 25;

    return {
      x: this.facingRight ? this.body.x + this.body.width : this.body.x - range,
      y: this.body.y + 4,
      width: range,
      height: this.body.height - 8,
      vx: 0,
      vy: 0,
      onGround: false,
    };
  }

  private isHeroInFront(hero: Character): boolean {
    const heroX = hero.getBody().x + hero.getBody().width / 2;
    const enemyX = this.body.x + this.body.width / 2;

    if (this.facingRight) {
      return heroX > enemyX;
    } else {
      return heroX < enemyX;
    }
  }

  startAttack(): void {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackTimer = this.ATTACK_DURATION;
    this.attackCooldownTimer = this.attackCooldown;
  }

  takeDamage(amount = 1): void {
    this.health -= amount;
    if (this.health <= 0) this.sprite.visible = false;
  }

  getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }
  getBody(): Body {
    return this.body;
  }
  isDead(): boolean {
    return this.health <= 0;
  }
}
