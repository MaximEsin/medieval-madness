import * as PIXI from 'pixi.js';

interface TileData {
  gid: number; // Global tile ID
  x: number;
  y: number;
}

export class TilemapLoader {
  private container: PIXI.Container;
  private tileWidth: number = 32;
  private tileHeight: number = 32;
  private mapWidth: number = 0;
  private mapHeight: number = 0;
  private tiles: TileData[] = [];

  constructor() {
    this.container = new PIXI.Container();
  }

  // Load and parse TMX file
  async loadFromFile(
    tmxPath: string,
    tilesetTexture: PIXI.Texture
  ): Promise<void> {
    try {
      // Fetch the TMX file
      const response = await fetch(tmxPath);
      const tmxText = await response.text();

      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(tmxText, 'text/xml');

      // Get map properties
      const mapElement = xmlDoc.getElementsByTagName('map')[0];
      this.mapWidth = parseInt(mapElement.getAttribute('width') || '0');
      this.mapHeight = parseInt(mapElement.getAttribute('height') || '0');
      this.tileWidth = parseInt(mapElement.getAttribute('tilewidth') || '32');
      this.tileHeight = parseInt(mapElement.getAttribute('tileheight') || '32');

      // Get tile data
      const layerElement = xmlDoc.getElementsByTagName('layer')[0];
      const dataElement = layerElement.getElementsByTagName('data')[0];
      const csvData = dataElement.textContent?.trim() || '';

      // Parse CSV data
      this.parseCsvData(csvData);

      // Render tiles
      this.renderTiles(tilesetTexture);

      console.log(`Tilemap loaded: ${this.mapWidth}x${this.mapHeight}`);
    } catch (error) {
      console.error('Failed to load tilemap:', error);
    }
  }

  // Parse CSV tile data
  private parseCsvData(csvData: string): void {
    const rows = csvData.split('\n').filter((row) => row.trim() !== '');

    rows.forEach((row, y) => {
      const tiles = row.split(',').map((t) => parseInt(t.trim()));

      tiles.forEach((gid, x) => {
        if (gid > 0) {
          // 0 means empty tile
          this.tiles.push({ gid, x, y });
        }
      });
    });
  }

  // Render tiles as sprites
  private renderTiles(tilesetTexture: PIXI.Texture): void {
    // Calculate how many tiles fit in the tileset texture horizontally
    const tilesPerRow = Math.floor(tilesetTexture.width / this.tileWidth);

    this.tiles.forEach((tile) => {
      // Convert GID to tileset coordinates
      const tileIndex = tile.gid - 1; // GID starts at 1, index starts at 0
      const tileX = (tileIndex % tilesPerRow) * this.tileWidth;
      const tileY = Math.floor(tileIndex / tilesPerRow) * this.tileHeight;

      // Create texture for this specific tile
      const tileTexture = new PIXI.Texture({
        source: tilesetTexture.source,
        frame: new PIXI.Rectangle(
          tileX,
          tileY,
          this.tileWidth,
          this.tileHeight
        ),
      });

      // Create sprite
      const sprite = new PIXI.Sprite(tileTexture);
      sprite.position.set(tile.x * this.tileWidth, tile.y * this.tileHeight);

      this.container.addChild(sprite);
    });
  }

  // Get the container with all tiles
  getContainer(): PIXI.Container {
    return this.container;
  }

  // Get tile data for collision detection
  getTiles(): TileData[] {
    return this.tiles;
  }

  // Get map dimensions in pixels
  getMapSize(): { width: number; height: number } {
    return {
      width: this.mapWidth * this.tileWidth,
      height: this.mapHeight * this.tileHeight,
    };
  }

  // Check if a position has a tile (useful for collision)
  hasTileAt(x: number, y: number): boolean {
    return this.tiles.some((tile) => tile.x === x && tile.y === y);
  }
}
