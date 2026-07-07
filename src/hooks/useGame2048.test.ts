import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Board } from "../lib/game";
import {
  createTile,
  GHOST_LIFETIME_MS,
  initializeBoard,
  serializeBoard,
} from "../lib/game";
import {
  BEST_SCORE_STORAGE_KEY,
  GAME_STATE_STORAGE_KEY,
  useGame2048,
} from "./useGame2048";

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

// Persistence is keyed on localStorage; isolate every test from the previous
// one's saved state.
beforeEach(() => {
  localStorage.clear();
});

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

  describe("keep going after a win", () => {
    // Semantics choice: `won` stays true for the rest of the game once set;
    // `keepPlaying` is a separate flag that unblocks moves (and, in the UI,
    // dismisses the win overlay).
    it("keeps won true and accepts moves again after startKeepPlaying", () => {
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
      expect(result.current.keepPlaying).toBe(false);

      act(() => {
        result.current.startKeepPlaying();
      });
      expect(result.current.won).toBe(true);
      expect(result.current.keepPlaying).toBe(true);

      const scoreBefore = result.current.score;
      act(() => {
        result.current.makeMove("right");
      });

      // The move went through: tiles slid right and a new tile spawned.
      expect(countTiles(result.current.grid)).toBe(3);
      expect(result.current.score).toBe(scoreBefore);
    });

    it("does not re-trigger the win state when another 2048 tile forms", () => {
      startFrom([
        [1024, 1024, 0, 0],
        [512, 512, 0, 0],
        [512, 512, 0, 0],
        [0, 0, 0, 0],
      ]);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });
      expect(result.current.won).toBe(true);

      act(() => {
        result.current.startKeepPlaying();
      });

      // Column 0 now holds 2048, 1024, 1024 — moving up forms a second 2048.
      act(() => {
        result.current.makeMove("up");
      });

      expect(result.current.grid[1]?.[0]).toBe(2048);
      // Still in keep-playing mode (no second win overlay), moves continue.
      expect(result.current.won).toBe(true);
      expect(result.current.keepPlaying).toBe(true);
      expect(result.current.gameOver).toBe(false);

      const scoreBefore = result.current.score;
      act(() => {
        result.current.makeMove("up");
      });
      expect(result.current.score).toBe(scoreBefore + 4096);
    });

    it("clears keepPlaying on resetGame", () => {
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
      act(() => {
        result.current.startKeepPlaying();
      });
      expect(result.current.keepPlaying).toBe(true);

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.keepPlaying).toBe(false);
      expect(result.current.won).toBe(false);
    });

    it("ignores startKeepPlaying before winning", () => {
      startFrom([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.startKeepPlaying();
      });

      expect(result.current.keepPlaying).toBe(false);
      expect(localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBeNull();
    });

    it("restores keepPlaying across a remount", () => {
      startFrom([
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const first = renderHook(() => useGame2048());

      act(() => {
        first.result.current.makeMove("left");
      });
      act(() => {
        first.result.current.startKeepPlaying();
      });
      first.unmount();

      const second = renderHook(() => useGame2048());

      expect(second.result.current.won).toBe(true);
      expect(second.result.current.keepPlaying).toBe(true);
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

  describe("persistence", () => {
    it("starts bestScore at 0 when nothing is stored", () => {
      const { result } = renderHook(() => useGame2048());

      expect(result.current.bestScore).toBe(0);
    });

    it("restores a stored best score on init", () => {
      localStorage.setItem(BEST_SCORE_STORAGE_KEY, "128");

      const { result } = renderHook(() => useGame2048());

      expect(result.current.bestScore).toBe(128);
    });

    it("raises bestScore to the new score and persists it", () => {
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

      expect(result.current.bestScore).toBe(4);
      expect(localStorage.getItem(BEST_SCORE_STORAGE_KEY)).toBe("4");
    });

    it("keeps a higher stored best score when the current score stays below it", () => {
      localStorage.setItem(BEST_SCORE_STORAGE_KEY, "100");
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
      expect(result.current.bestScore).toBe(100);
      expect(localStorage.getItem(BEST_SCORE_STORAGE_KEY)).toBe("100");
    });

    it("preserves bestScore across resetGame while the score returns to 0", () => {
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
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.bestScore).toBe(4);
      expect(localStorage.getItem(BEST_SCORE_STORAGE_KEY)).toBe("4");
    });

    it("restores board, score, and flags across a remount", () => {
      startFrom([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const first = renderHook(() => useGame2048());

      act(() => {
        first.result.current.makeMove("left");
      });
      const gridAfterMove = first.result.current.grid;
      first.unmount();

      const initCallsBeforeRemount =
        vi.mocked(initializeBoard).mock.calls.length;
      const second = renderHook(() => useGame2048());

      expect(second.result.current.grid).toEqual(gridAfterMove);
      expect(second.result.current.score).toBe(4);
      expect(second.result.current.gameOver).toBe(false);
      expect(second.result.current.won).toBe(false);
      // The restore path must not generate a fresh board.
      expect(vi.mocked(initializeBoard).mock.calls.length).toBe(
        initCallsBeforeRemount,
      );
    });

    it("clears the persisted game state on resetGame", () => {
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
      expect(localStorage.getItem(GAME_STATE_STORAGE_KEY)).not.toBeNull();

      act(() => {
        result.current.resetGame();
      });

      expect(localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBeNull();
    });

    it("loads a v1 payload with keepPlaying defaulting to false", () => {
      const storedBoard = boardFromValues([
        [4, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      localStorage.setItem(
        GAME_STATE_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          board: serializeBoard(storedBoard),
          score: 42,
          gameOver: false,
          won: false,
        }),
      );

      const { result } = renderHook(() => useGame2048());

      // The v1 game survives the version bump instead of being wiped.
      expect(result.current.score).toBe(42);
      expect(countTiles(result.current.grid)).toBe(2);
      expect(result.current.keepPlaying).toBe(false);
    });

    it("re-saves a restored v1 game as v2 on the next move", () => {
      const storedBoard = boardFromValues([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      localStorage.setItem(
        GAME_STATE_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          board: serializeBoard(storedBoard),
          score: 0,
          gameOver: false,
          won: false,
        }),
      );
      vi.spyOn(Math, "random").mockReturnValue(0);
      const { result } = renderHook(() => useGame2048());

      act(() => {
        result.current.makeMove("left");
      });

      const raw = localStorage.getItem(GAME_STATE_STORAGE_KEY);
      expect(raw).not.toBeNull();
      const saved: unknown = JSON.parse(raw ?? "null");
      expect(saved).toMatchObject({ version: 2, keepPlaying: false });
    });

    it("falls back to a fresh game and clears the entry on corrupt JSON", () => {
      localStorage.setItem(GAME_STATE_STORAGE_KEY, "{ not json");

      const { result } = renderHook(() => useGame2048());

      expect(countTiles(result.current.grid)).toBe(2);
      expect(result.current.score).toBe(0);
      expect(localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBeNull();
    });

    it("rejects a well-formed payload with the wrong shape or version", () => {
      localStorage.setItem(
        GAME_STATE_STORAGE_KEY,
        JSON.stringify({
          version: 999,
          board: [],
          score: 0,
          gameOver: false,
          won: false,
        }),
      );

      const { result } = renderHook(() => useGame2048());

      expect(countTiles(result.current.grid)).toBe(2);
      expect(result.current.score).toBe(0);
      expect(localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBeNull();
    });
  });
});
