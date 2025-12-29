import * as PIXI from 'pixi.js';
import { AssetManager } from './AssetManager';
import { TilingBackground } from '../components/TilingBackground';
import { TilemapLoader } from './TilemapLoader';
import { InputManager } from './InputManager';
import { Character } from '../components/Character';
import { LevelTrigger } from '../components/LevelTrigger';

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

  private levelStart?: LevelTrigger;
  private levelEnd?: LevelTrigger;

  private levelText?: PIXI.Text;
  private messageTimer: number = 0;
  private messageDuration: number = 200;

  private deathText?: PIXI.Text;
  private deathTimer: number = 0;
  private deathDuration: number = 100;
  private isDead: boolean = false;

  private currentLevel: number = 1;
  private isLevelTransition: boolean = false;

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
    await this.assetManager.loadAssets(1);

    // Setup the tiling background
    this.setupBackground();

    // Setup the tilemap
    await this.setupTilemap(1);

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
  private async setupTilemap(level: number): Promise<void> {
    let tileset: string = 'tileset1';

    if (level === 1) {
      tileset = 'tileset1';
    }

    const tilesetTexture = this.assetManager.getTexture(tileset);

    if (tilesetTexture) {
      this.tilemap = new TilemapLoader();
      await this.tilemap.loadFromFile(
        `levels/forest/forestLvl${level}.tmx`,
        tilesetTexture
      );

      // Add tilemap to main layer
      this.mainLayer.addChild(this.tilemap.getContainer());
    } else {
      console.warn('Tileset texture not loaded');
    }

    const endTexture = this.assetManager.getTexture('levelTrigger1');

    if (!endTexture) throw new Error('No end texture found');
    if (!this.tilemap) throw new Error('No tilemap found');

    this.levelStart = new LevelTrigger(endTexture, 50, 480, 32, 32);
    this.levelEnd = new LevelTrigger(
      endTexture,
      this.tilemap.getWidthInPixels() - 50,
      480,
      32,
      32
    );

    this.mainLayer.addChild(this.levelStart.sprite);
    this.mainLayer.addChild(this.levelEnd.sprite);
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
    if (this.character && this.tilemap && !this.isDead) {
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

      if (
        this.levelEnd &&
        this.character &&
        this.levelEnd.checkCollision(this.character.getBody()) &&
        !this.isLevelTransition
      ) {
        this.completeLevel();
      }

      // Если герой провалился ниже уровня
      const mapHeightInPixels = this.tilemap?.getHeightInPixels() ?? 1000;
      if (this.character.getBody().y > mapHeightInPixels + 100) {
        this.gameOver();
      }

      if (this.levelText && this.messageTimer > 0) {
        this.messageTimer -= deltaTime;
        if (this.messageTimer <= 0) {
          this.levelText.visible = false;
        }
      }
    }

    if (this.isDead) {
      this.deathTimer -= deltaTime;
      if (this.deathTimer <= 0) {
        this.restartLevel();
      }
    }

    if (this.isLevelTransition && this.messageTimer <= 0) {
      this.loadNextLevel();
    }
  }

  private async loadNextLevel(): Promise<void> {
    this.isLevelTransition = false;
    this.currentLevel++;

    // 1. Удаляем старые объекты
    if (this.character) {
      this.mainLayer.removeChild(this.character.getSprite());
      this.character = undefined;
    }

    if (this.tilemap) {
      this.mainLayer.removeChild(this.tilemap.getContainer());
      this.tilemap = undefined;
    }

    if (this.levelStart) {
      this.mainLayer.removeChild(this.levelStart.sprite);
      this.levelStart = undefined;
    }

    if (this.levelEnd) {
      this.mainLayer.removeChild(this.levelEnd.sprite);
      this.levelEnd = undefined;
    }

    // 2. Загружаем новый уровень
    await this.setupTilemap(this.currentLevel);

    // 3. Создаём нового персонажа на старте
    this.setupCharacter();

    // 4. Сброс камеры
    this.mainLayer.position.x = 0;

    if (this.tilingBackground) {
      this.tilingBackground.setScrollPosition(0);
    }

    // 5. Показываем название уровня
    this.showMessage(`Level ${this.currentLevel}`);
  }

  private completeLevel(): void {
    this.isLevelTransition = true;

    this.showMessage('Level Complete!');
  }

  private restartLevel(): void {
    this.isDead = false;

    // Скрываем сообщение
    if (this.deathText) this.deathText.visible = false;

    // Удаляем старого персонажа
    if (this.character) {
      this.mainLayer.removeChild(this.character.getSprite());
    }

    // Создаём нового персонажа
    this.setupCharacter();

    // Сбрасываем фон и камеру
    if (this.tilingBackground) {
      this.tilingBackground.setScrollPosition(0);
    }
  }

  private showMessage(text: string): void {
    if (!this.levelText) {
      this.levelText = new PIXI.Text(text, {
        fontFamily: 'main',
        fontSize: 48,
        fill: 0xffffff,
        align: 'center',
        stroke: 0x000000,
      });
      this.levelText.anchor.set(0.5, 0);
      this.levelText.position.set(this.app.screen.width / 2, 20);
      this.app.stage.addChild(this.levelText);
    } else {
      this.levelText.text = text;
      this.levelText.visible = true;
    }
    this.messageTimer = this.messageDuration;
  }

  private gameOver(): void {
    if (this.isDead) return; // Чтобы не спамить
    this.isDead = true;

    // Создаём текст
    if (!this.deathText) {
      this.deathText = new PIXI.Text('You Died', {
        fontFamily: 'main',
        fontSize: 72,
        fill: 0xff0000,
        align: 'center',
        stroke: 0x000000,
      });
      this.deathText.anchor.set(0.5, 0.5);
      this.deathText.position.set(
        this.app.screen.width / 2,
        this.app.screen.height / 2
      );
      this.app.stage.addChild(this.deathText);
    } else {
      this.deathText.visible = true;
    }

    // Таймер перед перезапуском
    this.deathTimer = this.deathDuration;
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
