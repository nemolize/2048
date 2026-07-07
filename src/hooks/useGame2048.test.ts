import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Board } from "../lib/game";
import { createTile, GHOST_LIFETIME_MS, initializeBoard } from "../lib/game";
import { useGame2048 } from "./useGame2048";

// Keep the real game logic but make the starting board injectable, so each
// test drives the hook from a known deterministic position instead of
// fighting Math.random.
vi.mock("../lib/game", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/game")>();
  return { ...actual, initializeBoard: vi.fn(actual.initializeBoard) };
});

const boardFromValues = (values: number[][]): Board =>
  values.map((row, r) =>
    row.map((value, c) =>
      value === 0 ? null : createTile(r, c, value, { id: `r${r}c${c}` }),
    ),
  );

const startFrom = (values: number[][]) => {
  vi.mocked(initializeBoard).mockReturnValueOnce(boardFromValues(values));
};

const countTiles = (grid: number[][]) =>
  grid.flat().filter((value) => value !== 0).length;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useGame2048", () => {
  it("initializes with a 4x4 grid containing two tiles, score 0, not over, not won", () => {
    const { result } = renderHook(() => useGame2048());

    expect(result.current.grid).toHaveLength(4);
    expect(result.current.grid.every((row) => row.length === 4)).toBe(true);
    expect(countTiles(result.current.grid)).toBe(2);
    expect(result.current.score).toBe(0);
    expect(result.current.gameOver).toBe(false);
    expect(result.current.won).toBe(false);
  });

  describe("makeMove", () => {
    it("merges tiles, updates the score, and spawns one new tile", () => {
      startFrom([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      // New-tile placement: first empty cell, value 2.
      vi.spyOn(Math, "random").mockReturnValue(0);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });

      expect(result.current.score).toBe(4);
      expect(result.current.grid).toEqual([
        [4, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
    });

    it("ignores a move that neither slides nor merges anything", () => {
      startFrom([
        [2, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const { result } = renderHook(() => useGame2048());
      const gridBefore = result.current.grid;

      act(() => {
        result.current.makeMove("left");
      });

      expect(result.current.grid).toEqual(gridBefore);
      expect(result.current.score).toBe(0);
      expect(countTiles(result.current.grid)).toBe(2);
    });

    it("sets won when a move creates a 2048 tile, then ignores further moves", () => {
      startFrom([
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });

      expect(result.current.won).toBe(true);
      expect(result.current.score).toBe(2048);

      const gridAfterWin = result.current.grid;
      act(() => {
        result.current.makeMove("right");
      });

      expect(result.current.grid).toEqual(gridAfterWin);
      expect(result.current.score).toBe(2048);
    });

    it("sets gameOver when the board fills with no moves left, then ignores further moves", () => {
      startFrom([
        [0, 2, 4, 2],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ]);
      // The left move packs row 0 to [2, 4, 2, _]; the spawn lands in the
      // vacated cell as a 4 (roll >= 0.9), completing a checkerboard with no
      // adjacent equal tiles.
      vi.spyOn(Math, "random").mockReturnValue(0.95);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });

      expect(result.current.grid).toEqual([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ]);
      expect(result.current.gameOver).toBe(true);

      const scoreBefore = result.current.score;
      act(() => {
        result.current.makeMove("up");
      });

      expect(result.current.grid).toEqual([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ]);
      expect(result.current.score).toBe(scoreBefore);
    });
  });

  describe("tiles and ghost handling", () => {
    it("keeps the surviving id on the merged tile and places the ghost in the merge cell", () => {
      startFrom([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });

      const merged = result.current.tiles.find((t) => t.isMerged);
      const ghost = result.current.tiles.find((t) => t.isGhost === true);

      expect(merged).toMatchObject({ id: "r0c0", value: 4, row: 0, col: 0 });
      expect(ghost).toMatchObject({ id: "r0c1", value: 2, row: 0, col: 0 });
    });

    it("drops ghosts after the slide animation window", () => {
      vi.useFakeTimers();
      startFrom([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });

      expect(result.current.tiles.some((t) => t.isGhost === true)).toBe(true);

      act(() => {
        vi.advanceTimersByTime(GHOST_LIFETIME_MS);
      });

      expect(result.current.tiles.some((t) => t.isGhost === true)).toBe(false);

      vi.useRealTimers();
    });
  });

  describe("resetGame", () => {
    it("resets score, flags, and board to a fresh two-tile state", () => {
      startFrom([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });
      expect(result.current.score).toBe(4);

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.gameOver).toBe(false);
      expect(result.current.won).toBe(false);
      expect(countTiles(result.current.grid)).toBe(2);
      expect(result.current.tiles.some((t) => t.isGhost === true)).toBe(false);
    });
  });
});
