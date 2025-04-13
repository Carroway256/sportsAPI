import { stateManager } from "./state";

export async function fetchMappings(): Promise<void> {
  try {
    const response = await fetch("http://localhost:3000/api/mappings");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const mappings = await response.json();
    const mappingsArray = mappings.mappings.split(";");
    const mappingsObject = {};
    mappingsArray.forEach((mapping) => {
      const [value, key] = mapping.split(":");
      mappingsObject[value] = key;
    });
    stateManager.set("mappings", mappingsObject);
    fetchState();
  } catch (error) {
    console.error("Error fetching mappings:", error);
  }
}

export async function fetchState(): Promise<void> {
  try {
    const response = await fetch("http://localhost:3000/api/state");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const state = await response.json();

    const mappedState = state.odds.split("\n");
    const mappingsObject = stateManager.get("mappings");
    console.log("Mappings object:", JSON.stringify(mappingsObject, null, 2));

    const processedEvents = mappedState.map((line) => {
      const items = line.split(",");

      const mappedItems = items.map((item) => {
        if (mappingsObject[item]) {
          return mappingsObject[item];
        }
      });

      if (mappedItems.length > 0) {
        const lastItem = mappedItems[mappedItems.length - 1];
        if (lastItem.includes("@") && lastItem.includes("|")) {
          const oddsEntries = lastItem.split("|");
          console.log("Odds entries:", JSON.stringify(oddsEntries, null, 2));

          const processedOdds = oddsEntries.map((entry) => {
            const [id, odds] = entry.split("@");
            console.log("Processing odds:", mappingsObject[id], odds);

            const mappedId = mappingsObject[id] || id;

            // Only include CURRENT scores
            if (mappingsObject[id].startsWith("CURRENT")) {
              console.log("Processing CURRENT odds:", odds);
              const [home, away] = odds.split(":");
              return {
                type: "CURRENT",
                home: home,
                away: away,
              };
            }
          });

          mappedItems.splice(mappedItems.length - 1, 1, ...processedOdds);
        }
      }

      return mappedItems;
    });

    console.log("Processed events:", JSON.stringify(processedEvents, null, 2));
    const events = processedEvents.map((event) => {
      return {
        id: event[0],
        status: event[6],
      };
    });
    console.log("Formatted events:", JSON.stringify(events, null, 2));
    stateManager.set("state", events);
  } catch (error) {
    console.error("Error fetching state:", error);
  }
}
