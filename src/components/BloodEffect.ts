import * as PIXI from 'pixi.js';

export class BloodEffect {
  private sprite: PIXI.AnimatedSprite;
  private lifeTimer: number = 0;

  constructor(textures: PIXI.Texture[], x: number, y: number) {
    // Create animated sprite from individual frame textures
    this.sprite = new PIXI.AnimatedSprite(textures);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.animationSpeed = 35 / 60; // 15 FPS
    this.sprite.position.set(x, y - 20); // Raise effect 20 pixels
    this.sprite.play();

    // Calculate duration based on frame count and speed
    this.lifeTimer = (textures.length / 35) * 60; // Duration in frames
  }

  update(deltaTime: number): boolean {
    this.lifeTimer -= deltaTime;
    return this.lifeTimer > 0; // Return true if still alive
  }

  getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
