/**
 * Type definitions for the application data structures
 */

/**
 * Represents a score in a match
 */
export interface Score {
  type: string;
  home: string;
  away: string;
}

/**
 * Represents a competitor in a match
 */
export interface Competitor {
  type: string;
  name: string;
}

/**
 * Represents a single event/match
 */
export interface Event {
  id: string;
  status: string;
  scores: {
    CURRENT: Score;
  };
  startTime: string;
  sport: string;
  competitors: {
    HOME: Competitor;
    AWAY: Competitor;
  };
  competition: string;
}

/**
 * Represents the state of all events
 */
export interface EventsState {
  [eventId: string]: Event;
}

/**
 * Represents the mappings from IDs to names
 */
export interface Mappings {
  [id: string]: string;
}

/**
 * Represents the application state
 */
export interface AppState {
  mappings: Mappings;
  state: EventsState;
  [key: string]: any;
}
