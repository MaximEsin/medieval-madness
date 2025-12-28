import * as PIXI from 'pixi.js';
import { type Body } from '../core/TilemapLoader';

export class LevelTrigger {
  public sprite: PIXI.Sprite;
  public body: Body;

  constructor(
    texture: PIXI.Texture,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.position.set(x, y);
    this.sprite.width = width;
    this.sprite.height = height;

    this.body = { x, y, width, height, vx: 0, vy: 0, onGround: false };
  }

  // Проверка столкновения с героем
  checkCollision(characterBody: Body): boolean {
    return (
      characterBody.x + characterBody.width > this.body.x &&
      characterBody.x < this.body.x + this.body.width &&
      characterBody.y + characterBody.height > this.body.y &&
      characterBody.y < this.body.y + this.body.height
    );
  }
}
