import { stateManager } from "./state";
import { EventStatus, SportEvent } from "./types";
import {
  processMappings,
  processEventData,
  createSportEvent,
} from "./utils/mappingUtils";
export async function fetchMappings(): Promise<void> {
  try {
    const response = await fetch("http://localhost:3000/api/mappings");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const mappings = await response.json();

    const mappingsObject = processMappings(mappings.mappings);

    stateManager.set("mappings", mappingsObject);
    stateManager.set("shouldFetchNewCycleMap", false);
  } catch (error) {
    console.error("Error fetching mappings:", error);
  }
}

export async function fetchState(): Promise<void> {
  try {
    const response = await fetch("http://localhost:3000/api/state");
    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const state = await response.json();

    const mappedState = state.odds.split("\n");
    const notIdEventsField = mappedState[0].split(",")[1];
    const mappingsObject = stateManager.get("mappings");

    const shouldFetchNewCycleMap =
      mappingsObject[notIdEventsField] === undefined;

    if (shouldFetchNewCycleMap) {
      stateManager.set("shouldFetchNewCycleMap", true);
      const currentState = stateManager.get("state");
      Object.values(currentState).forEach((event: SportEvent) => {
        event.status = EventStatus.REMOVED;
      });
      stateManager.set("state", {});
      stateManager.set("archivedEvents", currentState);
      await fetchMappings();
      return;
    }

    const processedEvents = mappedState.map((line) =>
      processEventData(line, mappingsObject)
    );

    processedEvents.forEach((event) => {
      const mappedEvent = createSportEvent(event);
      stateManager.setState(mappedEvent.id, mappedEvent);
    });
  } catch (error) {
    console.error("Error fetching state:", error);
  }
}
