import * as PIXI from 'pixi.js';
import { AssetManager } from './AssetManager';
import { TilingBackground } from '../components/TilingBackground';
import { TilemapLoader } from './TilemapLoader';
import { InputManager } from './InputManager';
import { Character } from '../components/Character';

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

  // Tilemap
  private tilemap?: TilemapLoader;

  // Input and character
  private inputManager: InputManager;
  private character?: Character;

  constructor() {
    // Create the PixiJS application
    this.app = new PIXI.Application();
    this.assetManager = new AssetManager();
    this.inputManager = new InputManager();

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

    // Setup the tilemap
    await this.setupTilemap();

    this.setupCharacter();

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
        this.app.screen.height,
        [0.02, 0.05, 0.08] // Scroll speeds for parallax effect
      );

      // Add background to the background layer
      this.backgroundLayer.addChild(this.tilingBackground.getContainer());
    } else {
      console.warn('Some background textures failed to load');
    }
  }

  // Setup the tilemap
  private async setupTilemap(): Promise<void> {
    const tilesetTexture = this.assetManager.getTexture('tileset');

    if (tilesetTexture) {
      this.tilemap = new TilemapLoader();
      await this.tilemap.loadFromFile(
        'levels/forest/forestLvl1.tmx',
        tilesetTexture
      );

      // Add tilemap to main layer
      this.mainLayer.addChild(this.tilemap.getContainer());
    } else {
      console.warn('Tileset texture not loaded');
    }
  }

  // Setup the character
  private setupCharacter(): void {
    const characterTexture = this.assetManager.getTexture('character');

    if (characterTexture) {
      // Spawn character at position (100, 500)
      if (!this.tilemap) throw new Error('No tilemap found');
      this.character = new Character(
        characterTexture,
        this.inputManager,
        100,
        530,
        this.tilemap
      );

      // Add character sprite to main layer
      this.mainLayer.addChild(this.character.getSprite());
    } else {
      console.warn('Character texture not loaded');
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

  private update(deltaTime: number): void {
    // Обновляем персонажа
    if (this.character) {
      this.character.update(deltaTime);
    }

    // КАМЕРА
    if (this.character && this.tilemap) {
      const screenWidth = this.app.screen.width;
      const mapWidth = this.tilemap.getWidthInPixels();

      // Позиция персонажа
      const charX = this.character.getPosition().x;

      // Камера хочет держать персонажа в центре
      let cameraX = charX - screenWidth / 2;

      // Ограничиваем камеру по краям карты
      cameraX = Math.max(0, cameraX); // не уходим в минус слева
      cameraX = Math.min(mapWidth - screenWidth, cameraX); // не уходим за карту справа

      // Применяем к mainLayer (тайлы + персонаж)
      this.mainLayer.position.x = -cameraX;

      // Применяем к параллаксному фону
      if (this.tilingBackground) {
        this.tilingBackground.setScrollPosition(cameraX);
      }
    }
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

  // Get the tilemap (useful for collision detection)
  getTilemap(): TilemapLoader | undefined {
    return this.tilemap;
  }
}
