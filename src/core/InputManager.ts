export class InputManager {
  private keys: Map<string, boolean> = new Map();

  constructor() {
    this.setupListeners();
  }

  // Setup keyboard event listeners
  private setupListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });
  }

  // Check if a key is currently pressed
  isKeyPressed(keyCode: string): boolean {
    return this.keys.get(keyCode) || false;
  }

  isAttackPressed(): boolean {
    return this.isKeyPressed('KeyH');
  }

  isLeftPressed(): boolean {
    return this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft');
  }

  isRightPressed(): boolean {
    return this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight');
  }

  isJumpPressed(): boolean {
    return (
      this.isKeyPressed('Space') ||
      this.isKeyPressed('KeyW') ||
      this.isKeyPressed('ArrowUp')
    );
  }

  // Clean up listeners
  destroy(): void {
    this.keys.clear();
  }
}
