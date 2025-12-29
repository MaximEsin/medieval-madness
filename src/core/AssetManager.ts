import * as PIXI from 'pixi.js';
import { core } from '../data/core';
import { forest } from '../data/forest';
import type { Asset } from '../types';

export class AssetManager {
  // Store loaded assets here
  private assets: Map<string, PIXI.Texture> = new Map();

  constructor() {}

  // Load all game assets
  async loadAssets(level: number): Promise<void> {
    console.log('Loading assets...');

    let levelAssets: Asset[] = [];

    if (level === 1) {
      levelAssets = forest;
    }

    const assetsToLoad = [...core, ...levelAssets];

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
