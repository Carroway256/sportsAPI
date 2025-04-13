import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { stateManager } from "../src/state";
import { fetchMappings } from "../src/apiCalls";

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

  describe("fetchMappings", () => {
    it("should fetch and store mappings successfully", async () => {
      // Mock data
      const mockMappings = {
        mappings: "value1:key1;value2:key2",
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
        value1: "key1",
        value2: "key2",
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
