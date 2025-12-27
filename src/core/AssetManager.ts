import * as PIXI from 'pixi.js';

export class AssetManager {
  // Store loaded assets here
  private assets: Map<string, PIXI.Texture> = new Map();

  constructor() {}

  // Load all game assets
  async loadAssets(): Promise<void> {
    console.log('Loading assets...');

    // Define your background layers
    // Replace these paths with your actual image paths
    const assetsToLoad = [
      {
        name: 'forest_layers_1',
        path: 'backgrounds/forest/forest_layers_1.png',
      }, // Furthest back
      {
        name: 'forest_layers_2',
        path: 'backgrounds/forest/forest_layers_2.png',
      }, // Middle
      {
        name: 'forest_layers_3',
        path: 'backgrounds/forest/forest_layers_3.png',
      }, // Closest to camera
      { name: 'tileset', path: 'levels/forest/oak_woods_tileset.png' },
      { name: 'character', path: 'hero/Fire_Warrior-Sheet.png' },
      // Add more assets here as needed
    ];

    // Load each asset
    for (const asset of assetsToLoad) {
      try {
        const texture = await PIXI.Assets.load(asset.path);
        this.assets.set(asset.name, texture);
        console.log(`Loaded: ${asset.name}`);
      } catch (error) {
        console.warn(`Failed to load ${asset.name}:`, error);
      }
    }

    console.log('Assets loaded!');
  }

  // Get a loaded texture by name
  getTexture(name: string): PIXI.Texture | undefined {
    return this.assets.get(name);
  }

  // Check if an asset exists
  hasAsset(name: string): boolean {
    return this.assets.has(name);
  }

  // Add a texture manually (useful for generated textures)
  addTexture(name: string, texture: PIXI.Texture): void {
    this.assets.set(name, texture);
  }
}
