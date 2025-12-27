import { Game } from './core/Game';

// Create and start the game
async function startGame() {
  try {
    // Create a new game instance
    const game = new Game();

    // Initialize the game (load assets, setup canvas, etc.)
    await game.init();

    // Start the game loop
    game.start();

    // Make game accessible globally for debugging (optional)
    (window as any).game = game;
  } catch (error) {
    console.error('Failed to start game:', error);
  }
}

// Start the game when the page loads
startGame();
