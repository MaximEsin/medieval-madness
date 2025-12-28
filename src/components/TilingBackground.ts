import * as PIXI from 'pixi.js';

export class TilingBackground {
  private container: PIXI.Container;
  private layers: PIXI.TilingSprite[] = [];
  private scrollSpeeds: number[] = [];

  constructor(
    layerTextures: PIXI.Texture[],
    height: number,
    scrollSpeeds: number[] = [0.01, 0.03, 0.05] // Parallax speeds for each layer
  ) {
    this.container = new PIXI.Container();
    this.scrollSpeeds = scrollSpeeds;

    // Create tiling sprites for each layer
    layerTextures.forEach((texture) => {
      // Make the tiling sprite much wider than the screen for horizontal tiling
      const tilingSprite = new PIXI.TilingSprite({
        texture: texture,
        width: texture.width * 3, // Wide enough to tile horizontally
        height: texture.height, // Use the texture's natural height
      });

      // Scale uniformly to fit screen height (maintains aspect ratio)
      const scale = height / texture.height;
      tilingSprite.scale.set(scale, scale); // Scale both X and Y equally

      // Position each layer at the same spot (they'll overlap)
      tilingSprite.position.set(0, 0);

      // Add to container and store reference
      this.container.addChild(tilingSprite);
      this.layers.push(tilingSprite);
    });
  }

  // Update the background scroll based on camera/player position
  // Call this when the player moves, not every frame
  update(cameraX: number): void {
    this.layers.forEach((layer, index) => {
      // Move each layer based on camera position with parallax effect
      layer.tilePosition.x = -cameraX * this.scrollSpeeds[index];
    });
  }

  // Manually set scroll position (useful for following camera)
  setScrollPosition(x: number): void {
    this.layers.forEach((layer, index) => {
      layer.tilePosition.x = -x * this.scrollSpeeds[index];
    });
  }

  // Get the container to add to your scene
  getContainer(): PIXI.Container {
    return this.container;
  }

  // Update individual layer speed
  setLayerSpeed(layerIndex: number, speed: number): void {
    if (layerIndex >= 0 && layerIndex < this.scrollSpeeds.length) {
      this.scrollSpeeds[layerIndex] = speed;
    }
  }

  // Stop scrolling
  stopScroll(): void {
    this.scrollSpeeds = this.scrollSpeeds.map(() => 0);
  }
}
