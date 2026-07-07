export type Direction = "up" | "down" | "left" | "right";

export const GRID_SIZE = 4;

// How long merged-away ghost tiles stay rendered (covers the slide animation).
export const GHOST_LIFETIME_MS = 350;

let tileIdCounter = 0;
export const nextTileId = () => `tile-${++tileIdCounter}`;

export interface TileState {
  id: string;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
  /** A tile consumed by a merge, kept alive so it can slide into the merge cell. */
  isGhost?: boolean;
}

export type Board = (TileState | null)[][];

export const createTile = (
  row: number,
  col: number,
  value: number,
  overrides?: Partial<Omit<TileState, "row" | "col" | "value">>,
): TileState => ({
  id: overrides?.id ?? nextTileId(),
  value,
  row,
  col,
  isNew: overrides?.isNew ?? false,
  isMerged: overrides?.isMerged ?? false,
});

export const createEmptyBoard = (): Board =>
  Array.from({ length: GRID_SIZE }, () =>
    Array<TileState | null>(GRID_SIZE).fill(null),
  );

export const addRandomTile = (board: Board): Board => {
  const emptyCells: [number, number][] = [];
  board.forEach((row, r) =>
    row.forEach((cell, c) => !cell && emptyCells.push([r, c])),
  );

  if (emptyCells.length === 0) return board;

  const [row, col] = emptyCells[
    Math.floor(Math.random() * emptyCells.length)
  ] ?? [0, 0];
  const value = Math.random() < 0.9 ? 2 : 4;

  // Existing tiles keep their flags: compressLine already rebuilds fresh
  // isNew/isMerged flags for every surviving tile on each move, and clearing
  // them here would wipe the isMerged flag the current move just set
  // (suppressing the merge pop animation).
  return board.map((currentRow, r) =>
    currentRow.map((cell, c) =>
      r === row && c === col
        ? createTile(row, col, value, { isNew: true })
        : cell,
    ),
  );
};

export interface MoveResult {
  board: Board;
  ghosts: TileState[];
  score: number;
  moved: boolean;
}

export type Orientation = "horizontal" | "vertical";

export const compressLine = (
  line: (TileState | null)[],
  fixedIndex: number,
  orientation: Orientation,
  reverse: boolean,
): {
  line: (TileState | null)[];
  ghosts: TileState[];
  score: number;
  moved: boolean;
} => {
  const workingLine = reverse ? [...line].reverse() : line;
  const filtered = workingLine.filter((t): t is TileState => t != null);

  const result: (TileState | null)[] = Array(GRID_SIZE).fill(null);
  const ghosts: TileState[] = [];
  let score = 0;
  let moved = false;
  let targetIndex = 0;

  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i];
    const next = filtered[i + 1];
    const targetPos = reverse ? GRID_SIZE - 1 - targetIndex : targetIndex;
    const [row, col] =
      orientation === "horizontal"
        ? [fixedIndex, targetPos]
        : [targetPos, fixedIndex];

    if (current && next && current.value === next.value) {
      // Keep `current`'s id so the surviving tile slides into the merge cell
      // (same React key -> continuous layout animation) instead of remounting.
      result[targetIndex] = createTile(row, col, current.value * 2, {
        id: current.id,
        isMerged: true,
      });
      // Keep the consumed tile as a ghost that slides into the same cell
      // underneath the merged tile, then gets removed.
      ghosts.push({
        ...next,
        row,
        col,
        isNew: false,
        isMerged: false,
        isGhost: true,
      });
      score += current.value * 2;
      moved = true;
      targetIndex++;
      i++;
    } else if (current) {
      result[targetIndex] = createTile(row, col, current.value, {
        id: current.id,
        isNew: false,
        isMerged: false,
      });
      if (current.row !== row || current.col !== col) moved = true;
      targetIndex++;
    }
  }

  return { line: reverse ? result.reverse() : result, ghosts, score, moved };
};

export const moveHorizontal = (board: Board, reverse: boolean): MoveResult => {
  let moved = false;
  let score = 0;
  const ghosts: TileState[] = [];

  const nextBoard = board.map((row, rowIndex) => {
    const result = compressLine(row, rowIndex, "horizontal", reverse);
    if (result.moved) moved = true;
    score += result.score;
    ghosts.push(...result.ghosts);
    return result.line;
  });

  return { board: nextBoard, ghosts, score, moved };
};

export const moveVertical = (board: Board, reverse: boolean): MoveResult => {
  let moved = false;
  let score = 0;
  const ghosts: TileState[] = [];
  const nextBoard = createEmptyBoard();

  for (let col = 0; col < GRID_SIZE; col++) {
    const column = board.map((row) => row[col] ?? null);
    const result = compressLine(column, col, "vertical", reverse);
    if (result.moved) moved = true;
    score += result.score;
    ghosts.push(...result.ghosts);
    for (let row = 0; row < GRID_SIZE; row++) {
      const targetRow = nextBoard[row];
      if (targetRow) targetRow[col] = result.line[row] ?? null;
    }
  }

  return { board: nextBoard, ghosts, score, moved };
};

export const moveBoard = (board: Board, direction: Direction): MoveResult => {
  switch (direction) {
    case "left":
      return moveHorizontal(board, false);
    case "right":
      return moveHorizontal(board, true);
    case "up":
      return moveVertical(board, false);
    case "down":
      return moveVertical(board, true);
  }
};

export const checkGameOver = (board: Board): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = board[row]?.[col];
      if (!current) return false;
      if (board[row]?.[col + 1]?.value === current.value) return false;
      if (board[row + 1]?.[col]?.value === current.value) return false;
    }
  }
  return true;
};

export const checkWin = (board: Board): boolean =>
  board.some((row) => row.some((cell) => cell?.value === 2048));

export const initializeBoard = (): Board =>
  addRandomTile(addRandomTile(createEmptyBoard()));

export const compareTileIds = (a: TileState, b: TileState) =>
  a.id.localeCompare(b.id, undefined, { numeric: true });

export interface SerializedTile {
  id: string;
  value: number;
  row: number;
  col: number;
}

export type SerializedBoard = (SerializedTile | null)[][];

export const serializeBoard = (board: Board): SerializedBoard =>
  board.map((row) =>
    row.map((cell) =>
      cell
        ? { id: cell.id, value: cell.value, row: cell.row, col: cell.col }
        : null,
    ),
  );

const isSerializedTile = (value: unknown): value is SerializedTile => {
  if (typeof value !== "object" || value === null) return false;
  const cell = value as Record<string, unknown>;
  return (
    typeof cell.id === "string" &&
    typeof cell.value === "number" &&
    typeof cell.row === "number" &&
    typeof cell.col === "number"
  );
};

export const isSerializedBoard = (value: unknown): value is SerializedBoard =>
  Array.isArray(value) &&
  value.length === GRID_SIZE &&
  value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === GRID_SIZE &&
      row.every((cell) => cell === null || isSerializedTile(cell)),
  );

const TILE_ID_PATTERN = /^tile-(\d+)$/;

export const deserializeBoard = (serialized: SerializedBoard): Board => {
  // Restored ids can outrank the fresh module counter after a reload; advance
  // it so newly spawned tiles never collide with restored React keys.
  for (const cell of serialized.flat()) {
    const idNumber = cell ? TILE_ID_PATTERN.exec(cell.id)?.[1] : null;
    if (idNumber != null)
      tileIdCounter = Math.max(tileIdCounter, Number(idNumber));
  }

  return serialized.map((row) =>
    row.map((cell) =>
      cell ? createTile(cell.row, cell.col, cell.value, { id: cell.id }) : null,
    ),
  );
};
