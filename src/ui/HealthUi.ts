import * as PIXI from 'pixi.js';

export class HealthUI {
  private container = new PIXI.Container();
  private hearts: PIXI.Sprite[] = [];

  private empty!: PIXI.Texture;
  private half!: PIXI.Texture;
  private full!: PIXI.Texture;

  private maxHearts = 1; // 1 сердце = 2 hp
  private hp = 2;

  constructor(tileset: PIXI.Texture, portrait: PIXI.Texture) {
    this.createTextures(tileset);
    this.createHearts();

    const portraitTexture = new PIXI.Sprite(portrait);
    portraitTexture.scale.set(1);
    portraitTexture.position.set(0, 0);
    this.container.addChild(portraitTexture);
  }

  private createTextures(tileset: PIXI.Texture) {
    // 146,147,148 → вычисляем смещения
    const tileSize = 16;

    const indexEmpty = 146 - 1;
    const indexHalf = 147 - 1;
    const indexFull = 148 - 1;

    const tilesPerRow = Math.floor(tileset.width / tileSize);

    const tex = (index: number) =>
      new PIXI.Texture({
        source: tileset.source,
        frame: new PIXI.Rectangle(
          (index % tilesPerRow) * tileSize,
          Math.floor(index / tilesPerRow) * tileSize,
          tileSize,
          tileSize
        ),
      });

    this.empty = tex(indexEmpty);
    this.half = tex(indexHalf);
    this.full = tex(indexFull);
  }

  private createHearts() {
    for (let i = 0; i < this.maxHearts; i++) {
      const s = new PIXI.Sprite(this.full);
      s.position.set(70 + i * 20, 10);
      s.scale.set(2);
      this.container.addChild(s);
      this.hearts.push(s);
    }
  }

  setHP(value: number) {
    this.hp = Math.max(0, value);
    this.updateVisual();
  }

  private updateVisual() {
    for (let i = 0; i < this.hearts.length; i++) {
      const heartHP = this.hp - i * 2;

      if (heartHP >= 2) {
        this.hearts[i].texture = this.full;
      } else if (heartHP === 1) {
        this.hearts[i].texture = this.half;
      } else {
        this.hearts[i].texture = this.empty;
      }
    }
  }

  getContainer() {
    return this.container;
  }
}
