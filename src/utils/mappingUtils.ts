import { Mappings, SportEvent } from "../types";

/**
 * Processes a mapping string from the API and converts it to a mappings object
 * @param mappingsString - The mappings string from the API (format: "value1:key1;value2:key2")
 * @returns A mappings object with keys and values
 */
export function processMappings(mappingsString: string): Mappings {
  const mappingsArray = mappingsString.split(";");
  const mappingsObject: Mappings = {};

  mappingsArray.forEach((mapping) => {
    const [value, key] = mapping.split(":");
    mappingsObject[value] = key;
  });

  return mappingsObject;
}

/**
 * Applies mappings to an array of items
 * @param items - The items to apply mappings to
 * @param mappingsObject - The mappings object
 * @returns The items with mappings applied
 */
export function applyMappingsToItems(
  items: string[],
  mappingsObject: Mappings
): string[] {
  return items.map((item) => {
    if (mappingsObject[item]) {
      return mappingsObject[item];
    }

    return item;
  });
}

/**
 * Processes odds entries and applies mappings to them
 * @param oddsString - The odds string (format: "id1@odds1|id2@odds2")
 * @param mappingsObject - The mappings object
 * @returns The processed odds entries with mappings applied
 */
export function processOddsEntries(
  oddsString: string,
  mappingsObject: Mappings
): string[] {
  const oddsEntries = oddsString.split("|");

  const processedOdds = oddsEntries.map((entry) => {
    const [id, odds] = entry.split("@");

    const mappedId = mappingsObject[id] || id;

    return `${mappedId}@${odds}`;
  });

  return processedOdds;
}

/**
 * Extracts team names from odds entries
 * @param oddsString - The odds string (format: "id1@odds1|id2@odds2")
 * @returns An object with home and away team names
 */
export function extractTeamNames(oddsString: string): {
  homeTeam: string;
  awayTeam: string;
} {
  let homeTeam = "Unknown";
  let awayTeam = "Unknown";

  if (oddsString.includes("|")) {
    const oddsEntries = oddsString.split("|");
    if (oddsEntries.length >= 2) {
      homeTeam = oddsEntries[0].split("@")[0];
      awayTeam = oddsEntries[1].split("@")[0];
    }
  }

  return { homeTeam, awayTeam };
}

/**
 * Processes event data from the state API response
 * @param line - A line of data from the state API
 * @param mappingsObject - The mappings object
 * @returns A processed event object
 */
export function processEventData(
  line: string,
  mappingsObject: Mappings
): any[] {
  const items = line.split(",");

  // Apply mappings to all items except the last one (which might be odds)
  const mappedItems = items.slice(0, -1).map((item) => {
    if (mappingsObject[item]) {
      return mappingsObject[item];
    }
    return item;
  });

  // Handle the last item separately (potential odds data)
  const lastItem = items[items.length - 1];

  // If the last item contains odds data
  if (lastItem && lastItem.includes("@") && lastItem.includes("|")) {
    const oddsEntries = lastItem.split("|");
    const processedOdds = oddsEntries.map((entry) => {
      const [id, odds] = entry.split("@");
      const [home, away] = odds.split(":");
      return {
        type: mappingsObject[id],
        home: home,
        away: away,
      };
    });

    // Return the mapped items plus the processed odds as separate elements
    return [...mappedItems, ...processedOdds];
  } else {
    // If last item is not odds data, apply mappings to it as well
    if (lastItem && mappingsObject[lastItem]) {
      mappedItems.push(mappingsObject[lastItem]);
    } else if (lastItem) {
      mappedItems.push(lastItem);
    }
    return mappedItems;
  }
}

/**
 * Creates a SportEvent object from processed event data
 * @param event - The processed event data
 * @returns A SportEvent object
 */
export function createSportEvent(event: any[]): SportEvent {
  const currentScore = event.find((item) => item?.type === "CURRENT");

  return {
    id: event[0],
    status: event[6],
    ...(currentScore && {
      scores: {
        CURRENT: {
          type: currentScore.type,
          home: currentScore.home,
          away: currentScore.away,
        },
      },
    }),
    startTime: new Date(Number(event[3])).toISOString(),
    sport: event[1],
    competitors: {
      HOME: event[4],
      AWAY: event[5],
    },
    competition: event[2],
  };
}
