import * as PIXI from 'pixi.js';
import { AssetManager } from './AssetManager';
import { TilingBackground } from '../components/TilingBackground';

export class Game {
  // Properties (data that belongs to this class)
  private app: PIXI.Application;
  private assetManager: AssetManager;
  private isRunning: boolean = false;

  // Game layers for organizing sprites
  private backgroundLayer: PIXI.Container;
  private mainLayer: PIXI.Container;

  // Tiling background
  private tilingBackground?: TilingBackground;

  constructor() {
    // Create the PixiJS application
    this.app = new PIXI.Application();
    this.assetManager = new AssetManager();

    // Create layers
    this.backgroundLayer = new PIXI.Container();
    this.mainLayer = new PIXI.Container();
  }

  // Initialize the game
  async init(): Promise<void> {
    // Initialize PixiJS
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1099bb,
    });

    // Add the canvas to the HTML document
    document.body.appendChild(this.app.canvas);

    // Add layers to the stage in order (background first, then main)
    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.mainLayer);

    // Load all game assets
    await this.assetManager.loadAssets();

    // Setup the tiling background
    this.setupBackground();

    console.log('Game initialized!');
  }

  // Setup the tiling background with 3 layers
  private setupBackground(): void {
    const bgTextures = [
      this.assetManager.getTexture('forest_layers_1'),
      this.assetManager.getTexture('forest_layers_2'),
      this.assetManager.getTexture('forest_layers_3'),
    ];

    // Check if all textures loaded successfully
    if (bgTextures.every((tex) => tex !== undefined)) {
      this.tilingBackground = new TilingBackground(
        bgTextures as PIXI.Texture[],
        this.app.screen.width,
        this.app.screen.height,
        [0.2, 0.5, 0.8] // Scroll speeds for parallax effect
      );

      // Add background to the background layer
      this.backgroundLayer.addChild(this.tilingBackground.getContainer());
    } else {
      console.warn('Some background textures failed to load');
    }
  }

  // Start the game loop
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Add the game loop to PixiJS ticker
    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime);
    });

    console.log('Game started!');
  }

  // Update game logic (called every frame)
  private update(deltaTime: number): void {
    // deltaTime is the time elapsed since last frame
    // Background will be updated when player moves
    // We'll add that functionality when we create the player
    // You'll add more game logic here later
  }

  // Stop the game loop
  stop(): void {
    this.isRunning = false;
    this.app.ticker.stop();
  }

  // Get the PixiJS stage (where you'll add sprites)
  getStage(): PIXI.Container {
    return this.app.stage;
  }

  // Get the asset manager
  getAssetManager(): AssetManager {
    return this.assetManager;
  }

  // Get the background layer
  getBackgroundLayer(): PIXI.Container {
    return this.backgroundLayer;
  }

  // Get the main layer
  getMainLayer(): PIXI.Container {
    return this.mainLayer;
  }

  // Get screen dimensions
  getWidth(): number {
    return this.app.screen.width;
  }

  getHeight(): number {
    return this.app.screen.height;
  }

  // Get the tiling background (useful for updating it based on player position)
  getTilingBackground(): TilingBackground | undefined {
    return this.tilingBackground;
  }
}
