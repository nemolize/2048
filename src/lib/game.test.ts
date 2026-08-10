import { afterEach, describe, expect, it, vi } from "vitest";

import type { Board } from "./game";
import {
  addRandomTile,
  checkGameOver,
  checkWin,
  compareTileIds,
  createEmptyBoard,
  createTile,
  GRID_SIZE,
  initializeBoard,
  moveBoard,
} from "./game";

/**
 * Build a board from a 4x4 value matrix. 0 means empty. Each tile gets a
 * deterministic id derived from its starting cell (`r{row}c{col}`) so tests
 * can assert id inheritance across moves.
 */
const boardFromValues = (values: number[][]): Board =>
  values.map((row, r) =>
    row.map((value, c) =>
      value === 0
        ? null
        : createTile(r, c, value, { id: `r${String(r)}c${String(c)}` }),
    ),
  );

const valuesFromBoard = (board: Board): number[][] =>
  board.map((row) => row.map((cell) => cell?.value ?? 0));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createEmptyBoard", () => {
  it("creates a 4x4 board of empty cells", () => {
    const board = createEmptyBoard();

    expect(board).toHaveLength(GRID_SIZE);
    board.forEach((row) => {
      expect(row).toHaveLength(GRID_SIZE);
      row.forEach((cell) => {
        expect(cell).toBeNull();
      });
    });
  });
});

describe("moveBoard — merge rules", () => {
  it("merges 2+2 into 4 and scores the merged value", () => {
    const board = boardFromValues([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(valuesFromBoard(result.board)).toEqual([
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(4);
    expect(result.moved).toBe(true);
    expect(result.ghosts).toHaveLength(1);
  });

  it("merges 4+4 into 8", () => {
    const board = boardFromValues([
      [0, 0, 0, 0],
      [4, 0, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(valuesFromBoard(result.board)).toEqual([
      [0, 0, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(8);
  });

  it("merges 2+2+2 into 4 and 2 (nearest pair first), never 6", () => {
    const board = boardFromValues([
      [2, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(valuesFromBoard(result.board)).toEqual([
      [4, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(4);
  });

  it("moving right merges the pair nearest the right edge", () => {
    const board = boardFromValues([
      [2, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "right");

    expect(valuesFromBoard(result.board)).toEqual([
      [0, 0, 2, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(4);
  });

  it("does not chain-merge within a single move (2+2 then 4 stays 4,4)", () => {
    const board = boardFromValues([
      [2, 2, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(valuesFromBoard(result.board)).toEqual([
      [4, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(4);
  });

  it("merges two independent pairs in one line (4,4,8,8 → 8,16)", () => {
    const board = boardFromValues([
      [4, 4, 8, 8],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(valuesFromBoard(result.board)).toEqual([
      [8, 16, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(24);
    expect(result.ghosts).toHaveLength(2);
  });

  it("merges vertically on an up move", () => {
    const board = boardFromValues([
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ]);

    const result = moveBoard(board, "up");

    expect(valuesFromBoard(result.board)).toEqual([
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(4);
    expect(result.moved).toBe(true);
  });

  it("merges vertically on a down move (pair nearest the bottom edge first)", () => {
    const board = boardFromValues([
      [0, 2, 0, 0],
      [0, 2, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "down");

    expect(valuesFromBoard(result.board)).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 4, 0, 0],
    ]);
    expect(result.score).toBe(4);
  });
});

describe("moveBoard — sliding and no-op moves", () => {
  it("slides a tile to the edge without merging, keeping its id", () => {
    const board = boardFromValues([
      [0, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(valuesFromBoard(result.board)).toEqual([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.board[0]?.[0]?.id).toBe("r0c2");
    expect(result.score).toBe(0);
    expect(result.moved).toBe(true);
    expect(result.ghosts).toHaveLength(0);
  });

  it("reports moved: false when nothing can slide or merge", () => {
    const board = boardFromValues([
      [2, 4, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(result.moved).toBe(false);
    expect(result.score).toBe(0);
    expect(result.ghosts).toHaveLength(0);
    expect(valuesFromBoard(result.board)).toEqual(valuesFromBoard(board));
  });

  it("treats adjacent unequal tiles against the edge as a no-op", () => {
    const board = boardFromValues([
      [2, 0, 0, 0],
      [4, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 0, 0, 0],
    ]);

    const result = moveBoard(board, "up");

    expect(result.moved).toBe(false);
  });
});

describe("moveBoard — id inheritance and ghosts", () => {
  it("keeps the id of the tile nearest the move edge on the merged tile", () => {
    const board = boardFromValues([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    const merged = result.board[0]?.[0];
    expect(merged?.id).toBe("r0c0");
    expect(merged?.isMerged).toBe(true);
    expect(merged?.value).toBe(4);
  });

  it("spawns a ghost carrying the consumed tile's id at the merge cell", () => {
    const board = boardFromValues([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "left");

    expect(result.ghosts).toEqual([
      expect.objectContaining({
        id: "r0c1",
        value: 2,
        row: 0,
        col: 0,
        isGhost: true,
      }),
    ]);
  });

  it("on a right move, the tile nearest the right edge survives the merge", () => {
    const board = boardFromValues([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const result = moveBoard(board, "right");

    const merged = result.board[0]?.[3];
    expect(merged?.id).toBe("r0c1");
    expect(result.ghosts).toEqual([
      expect.objectContaining({ id: "r0c0", row: 0, col: 3, isGhost: true }),
    ]);
  });
});

describe("checkGameOver", () => {
  it("returns true for a full board with no adjacent equal tiles", () => {
    const board = boardFromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);

    expect(checkGameOver(board)).toBe(true);
  });

  it("returns false when the board has an empty cell", () => {
    const board = boardFromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 0],
    ]);

    expect(checkGameOver(board)).toBe(false);
  });

  it("returns false when a horizontal merge is still possible", () => {
    const board = boardFromValues([
      [2, 2, 4, 8],
      [4, 8, 2, 4],
      [2, 4, 8, 2],
      [4, 2, 4, 8],
    ]);

    expect(checkGameOver(board)).toBe(false);
  });

  it("returns false when a vertical merge is still possible", () => {
    const board = boardFromValues([
      [2, 4, 2, 4],
      [2, 8, 4, 2],
      [4, 2, 8, 4],
      [8, 4, 2, 8],
    ]);

    expect(checkGameOver(board)).toBe(false);
  });
});

describe("checkWin", () => {
  it("returns true when a 2048 tile is on the board", () => {
    const board = boardFromValues([
      [0, 0, 0, 0],
      [0, 0, 2048, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    expect(checkWin(board)).toBe(true);
  });

  it("returns false when the highest tile is below 2048", () => {
    const board = boardFromValues([
      [1024, 512, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    expect(checkWin(board)).toBe(false);
  });
});

describe("addRandomTile", () => {
  it("places a new tile with isNew in the randomly chosen empty cell", () => {
    // First call picks the empty-cell index, second decides the value (<0.9 → 2).
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.5);
    const board = boardFromValues([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    const next = addRandomTile(board);

    const newTile = next[0]?.[1];
    expect(newTile?.value).toBe(2);
    expect(newTile?.isNew).toBe(true);
    // The pre-existing tile is untouched.
    expect(next[0]?.[0]?.id).toBe("r0c0");
  });

  it("spawns a 4 when the value roll is at least 0.9", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.95);

    const next = addRandomTile(createEmptyBoard());

    expect(next[0]?.[0]?.value).toBe(4);
  });

  it("returns the board unchanged when it is full", () => {
    const board = boardFromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);

    expect(addRandomTile(board)).toBe(board);
  });
});

describe("initializeBoard", () => {
  it("creates a board with exactly two tiles", () => {
    const board = initializeBoard();

    const tiles = board.flat().filter((cell) => cell != null);
    expect(tiles).toHaveLength(2);
    tiles.forEach((tile) => {
      expect([2, 4]).toContain(tile.value);
    });
  });
});

describe("compareTileIds", () => {
  it("sorts numerically so tile-10 comes after tile-2", () => {
    const a = createTile(0, 0, 2, { id: "tile-2" });
    const b = createTile(0, 1, 2, { id: "tile-10" });

    expect(compareTileIds(a, b)).toBeLessThan(0);
    expect(compareTileIds(b, a)).toBeGreaterThan(0);
  });
});
