import { Mappings } from "../types";

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
    // If the item exists in our mappings, replace it
    if (mappingsObject[item]) {
      return mappingsObject[item];
    }
    // Otherwise keep the original item
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
  // Split by pipe to get individual odds entries
  const oddsEntries = oddsString.split("|");

  // Process each odds entry
  const processedOdds = oddsEntries.map((entry) => {
    // Split by @ to separate ID and odds
    const [id, odds] = entry.split("@");

    // Apply mapping to the ID if it exists
    const mappedId = mappingsObject[id] || id;

    // Return the mapped ID with the original odds
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
      // Extract team names from the odds entries
      homeTeam = oddsEntries[0].split("@")[0];
      awayTeam = oddsEntries[1].split("@")[0];
    }
  }

  return { homeTeam, awayTeam };
}
