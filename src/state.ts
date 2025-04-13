import { AppState } from "./types";

/**
 * In-memory application state manager
 */
class StateManager {
  private static instance: StateManager;
  private state: AppState = {
    mappings: {},
    state: {},
  };

  private constructor() {}

  /**
   * Get the singleton instance of the StateManager
   * @returns StateManager instance
   */
  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Set a value in the state
   * @param key - The key to set
   * @param value - The value to set
   */
  public set(key: string, value: any): void {
    this.state[key] = value;
  }

  /**
   * Get a value from the state
   * @param key - The key to get
   * @returns The value for the key
   */
  public get(key: string): any {
    return this.state[key];
  }

  /**
   * Delete a value from the state
   * @param key - The key to delete
   */
  public delete(key: string): void {
    delete this.state[key];
  }

  /**
   * Get the entire state
   * @returns A copy of the entire state
   */
  public getAll(): AppState {
    return { ...this.state };
  }

  /**
   * Clear the entire state
   */
  public clear(): void {
    this.state = {
      mappings: {},
      state: {},
    };
  }
}

// Export a singleton instance
export const stateManager = StateManager.getInstance();
