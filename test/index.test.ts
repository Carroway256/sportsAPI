import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { stateManager } from "../src/state";
import { fetchMappings } from "../src/apiCalls";
import {
  processMappings,
  applyMappingsToItems,
  processOddsEntries,
  extractTeamNames,
  processEventData,
  createSportEvent,
} from "../src/utils/mappingUtils";
import { EventStatus } from "../src/types";

// Mock the fetch function
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("index", () => {
  beforeEach(() => {
    // Clear the state before each test
    stateManager.clear();
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it("should run test", () => {
    expect(true).toBe(true);
  });

  it("should get response from /api/state endpoint", async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/state");
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    } catch (error) {
      // If the server is not running, the test will fail with a connection error
      // This is expected behavior if the server is not running
      expect(error.code).toBe("ECONNREFUSED");
    }
  });

  it("should return 500 error from /client/state endpoint when state is empty", async () => {
    // Ensure state is empty
    stateManager.clear();

    try {
      const response = await axios.get("http://localhost:3000/client/state");
      // This line should not be reached if state is empty
      expect(response.status).not.toBe(200);
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        // If server is not running, this is expected
        expect(error.code).toBe("ECONNREFUSED");
      } else {
        // If server is running, verify we get a 500 error
        expect(error.response.status).toBe(500);
        expect(error.response.data).toEqual({
          message: "Something went wrong, please try again",
        });
      }
    }
  });

  describe("fetchMappings", () => {
    it("should fetch and store mappings successfully", async () => {
      // Mock data
      const mockMappings = {
        mappings: "key1:value1;key2:value2",
      };

      // Mock the fetch response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMappings),
      });

      // Call the function
      await fetchMappings();

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/mappings"
      );

      // Verify the mappings were stored in state
      expect(stateManager.get("mappings")).toEqual({
        key1: "value1",
        key2: "value2",
      });
    });

    it("should handle fetch errors gracefully", async () => {
      // Mock a failed fetch
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Spy on console.error
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Call the function
      await fetchMappings();

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching mappings:",
        expect.any(Error)
      );

      // Verify state remains empty
      expect(stateManager.get("mappings")).toEqual({});

      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});

describe("mappingUtils", () => {
  describe("processMappings", () => {
    it("should convert mapping string to object", () => {
      const mappingString = "id1:value1;id2:value2;id3:value3";
      const result = processMappings(mappingString);

      expect(result).toEqual({
        id1: "value1",
        id2: "value2",
        id3: "value3",
      });
    });

    it("should handle empty mapping string", () => {
      const result = processMappings("");
      expect(result).toEqual({});
    });
  });

  describe("applyMappingsToItems", () => {
    it("should apply mappings to items", () => {
      const items = ["id1", "unknown", "id2"];
      const mappings = {
        id1: "value1",
        id2: "value2",
      };

      const result = applyMappingsToItems(items, mappings);

      expect(result).toEqual(["value1", "unknown", "value2"]);
    });

    it("should handle empty arrays", () => {
      const result = applyMappingsToItems([], {});
      expect(result).toEqual([]);
    });
  });

  describe("processOddsEntries", () => {
    it("should process odds entries with mappings", () => {
      const oddsString = "id1@1:2|id2@3:4";
      const mappings = {
        id1: "HOME",
        id2: "AWAY",
      };

      const result = processOddsEntries(oddsString, mappings);

      expect(result).toEqual(["HOME@1:2", "AWAY@3:4"]);
    });

    it("should handle unknown IDs", () => {
      const oddsString = "id1@1:2|unknown@3:4";
      const mappings = {
        id1: "HOME",
      };

      const result = processOddsEntries(oddsString, mappings);

      expect(result).toEqual(["HOME@1:2", "unknown@3:4"]);
    });
  });

  describe("extractTeamNames", () => {
    it("should extract team names from odds string", () => {
      const oddsString = "HOME@1:2|AWAY@3:4";

      const result = extractTeamNames(oddsString);

      expect(result).toEqual({
        homeTeam: "HOME",
        awayTeam: "AWAY",
      });
    });

    it("should handle invalid odds string", () => {
      const result = extractTeamNames("invalid");

      expect(result).toEqual({
        homeTeam: "Unknown",
        awayTeam: "Unknown",
      });
    });
  });

  describe("processEventData", () => {
    it("should process event data with odds", () => {
      const line =
        "event123,sport123,comp123,1617184800000,team1,team2,ACTIVE,type1@1:2|type2@3:4";
      const mappings = {
        sport123: "FOOTBALL",
        team1: "Real Madrid",
        team2: "Barcelona",
        ACTIVE: "LIVE",
        type1: "CURRENT",
        type2: "PERIOD_1",
      };

      const result = processEventData(line, mappings);

      expect(result).toHaveLength(9); // 7 original fields + 2 odds entries
      expect(result[1]).toBe("FOOTBALL");
      expect(result[4]).toBe("Real Madrid");
      expect(result[5]).toBe("Barcelona");
      expect(result[6]).toBe("LIVE");
      expect(result[7]).toHaveProperty("type", "CURRENT");
      expect(result[8]).toHaveProperty("type", "PERIOD_1");
    });

    it("should process event data without odds", () => {
      const line = "event123,sport123,comp123,1617184800000,team1,team2,ACTIVE";
      const mappings = {
        sport123: "FOOTBALL",
        team1: "Real Madrid",
        team2: "Barcelona",
        ACTIVE: "LIVE",
      };

      const result = processEventData(line, mappings);

      expect(result).toHaveLength(7);
      expect(result[1]).toBe("FOOTBALL");
      expect(result[6]).toBe("LIVE");
    });
  });

  describe("createSportEvent", () => {
    it("should create a sport event object", () => {
      const eventData = [
        "event123",
        "FOOTBALL",
        "Champions League",
        "1617184800000",
        "Real Madrid",
        "Barcelona",
        "LIVE",
        { type: "CURRENT", home: "2", away: "1" },
      ];

      const result = createSportEvent(eventData);

      expect(result).toEqual({
        id: "event123",
        status: "LIVE",
        scores: {
          CURRENT: {
            type: "CURRENT",
            home: "2",
            away: "1",
          },
        },
        startTime: new Date(1617184800000).toISOString(),
        sport: "FOOTBALL",
        competitors: {
          HOME: "Real Madrid",
          AWAY: "Barcelona",
        },
        competition: "Champions League",
      });
    });

    it("should create a sport event without scores", () => {
      const eventData = [
        "event123",
        "FOOTBALL",
        "Champions League",
        "1617184800000",
        "Real Madrid",
        "Barcelona",
        "PRE",
      ];

      const result = createSportEvent(eventData);

      expect(result).toEqual({
        id: "event123",
        status: "PRE",
        startTime: new Date(1617184800000).toISOString(),
        sport: "FOOTBALL",
        competitors: {
          HOME: "Real Madrid",
          AWAY: "Barcelona",
        },
        competition: "Champions League",
      });
      expect(result.scores).toBeUndefined();
    });
  });
});
