import * as PIXI from 'pixi.js';

export interface TileData {
  gid: number;
  x: number;
  y: number;
  solid: boolean;
}

export interface Body {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

export class TilemapLoader {
  private container = new PIXI.Container();

  private tileWidth = 32;
  private tileHeight = 32;

  private mapWidth = 0;
  private mapHeight = 0;

  private tiles: TileData[] = [];
  private grid: (TileData | null)[][] = [];

  /* ============================
     LOAD TMX
  ============================ */

  async loadFromFile(
    tmxPath: string,
    tilesetTexture: PIXI.Texture
  ): Promise<void> {
    const response = await fetch(tmxPath);
    const text = await response.text();

    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const map = xml.getElementsByTagName('map')[0];

    this.mapWidth = Number(map.getAttribute('width'));
    this.mapHeight = Number(map.getAttribute('height'));
    this.tileWidth = Number(map.getAttribute('tilewidth'));
    this.tileHeight = Number(map.getAttribute('tileheight'));

    this.grid = Array.from({ length: this.mapHeight }, () =>
      Array(this.mapWidth).fill(null)
    );

    const layer = xml.getElementsByTagName('layer')[0];
    const data = layer.getElementsByTagName('data')[0];
    const csv = data.textContent?.trim() ?? '';

    this.parseCsv(csv);
    this.render(tilesetTexture);
  }

  /* ============================
     PARSE
  ============================ */

  private parseCsv(csv: string): void {
    const rows = csv.split('\n').filter(Boolean);

    rows.forEach((row, y) => {
      row
        .split(',')
        .map(Number)
        .forEach((gid, x) => {
          if (gid > 0) {
            const tile: TileData = {
              gid,
              x,
              y,
              solid: true,
            };

            this.tiles.push(tile);
            this.grid[y][x] = tile;
          }
        });
    });
  }

  /* ============================
     RENDER
  ============================ */

  private render(tileset: PIXI.Texture): void {
    const tilesPerRow = Math.floor(tileset.width / this.tileWidth);

    this.tiles.forEach((tile) => {
      const index = tile.gid - 1;
      const tx = (index % tilesPerRow) * this.tileWidth;
      const ty = Math.floor(index / tilesPerRow) * this.tileHeight;

      const texture = new PIXI.Texture({
        source: tileset.source,
        frame: new PIXI.Rectangle(tx, ty, this.tileWidth, this.tileHeight),
      });

      const sprite = new PIXI.Sprite(texture);
      sprite.position.set(tile.x * this.tileWidth, tile.y * this.tileHeight);

      this.container.addChild(sprite);
    });
  }

  /* ============================
     COLLISION API
  ============================ */

  hasSolidTileAtTile(x: number, y: number): boolean {
    return !!this.grid[y]?.[x]?.solid;
  }

  hasSolidTileAtWorld(x: number, y: number): boolean {
    const tx = Math.floor(x / this.tileWidth);
    const ty = Math.floor(y / this.tileHeight);
    return this.hasSolidTileAtTile(tx, ty);
  }

  resolveCollision(body: Body, dt: number): void {
    // --- Vertical movement ---
    body.y += body.vy * dt;

    if (body.vy > 0) {
      // falling
      const bottom = body.y + body.height;
      if (
        this.hasSolidTileAtWorld(body.x + 1, bottom) ||
        this.hasSolidTileAtWorld(body.x + body.width - 1, bottom)
      ) {
        // Snap to top of tile
        body.y =
          Math.floor(bottom / this.tileHeight) * this.tileHeight - body.height;
        body.vy = 0;
        body.onGround = true;
      } else {
        body.onGround = false;
      }
    }

    if (body.vy < 0) {
      // jumping
      if (
        this.hasSolidTileAtWorld(body.x + 1, body.y) ||
        this.hasSolidTileAtWorld(body.x + body.width - 1, body.y)
      ) {
        body.y =
          Math.floor((body.y + this.tileHeight) / this.tileHeight) *
          this.tileHeight;
        body.vy = 0;
      }
    }

    // --- Horizontal movement ---
    body.x += body.vx * dt;

    if (body.vx > 0) {
      const right = body.x + body.width;
      if (
        this.hasSolidTileAtWorld(right, body.y + 1) ||
        this.hasSolidTileAtWorld(right, body.y + body.height - 1)
      ) {
        body.x =
          Math.floor(right / this.tileWidth) * this.tileWidth - body.width;
        body.vx = 0;
      }
    }
    if (body.vx < 0) {
      if (
        this.hasSolidTileAtWorld(body.x, body.y + 1) ||
        this.hasSolidTileAtWorld(body.x, body.y + body.height - 1)
      ) {
        body.x = Math.floor(body.x / this.tileWidth + 1) * this.tileWidth;
        body.vx = 0;
      }
    }

    // --- FINAL STANDING CHECK ---
    const footY = body.y + body.height + 1;
    body.onGround =
      this.hasSolidTileAtWorld(body.x + 1, footY) ||
      this.hasSolidTileAtWorld(body.x + body.width - 1, footY);
  }

  /* ============================
     GETTERS
  ============================ */

  getContainer(): PIXI.Container {
    return this.container;
  }

  getTileSize() {
    return { w: this.tileWidth, h: this.tileHeight };
  }
}
