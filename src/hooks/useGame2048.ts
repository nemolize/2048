import { useCallback, useMemo, useRef, useState } from "react";

export type Direction = "up" | "down" | "left" | "right";

const GRID_SIZE = 4;

let tileIdCounter = 0;
const nextTileId = () => `tile-${++tileIdCounter}`;

export interface TileState {
  id: string;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
}

type Board = (TileState | null)[][];

const createTile = (
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

const createEmptyBoard = (): Board =>
  Array.from({ length: GRID_SIZE }, () =>
    Array<TileState | null>(GRID_SIZE).fill(null),
  );

const addRandomTile = (board: Board): Board => {
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

interface MoveResult {
  board: Board;
  score: number;
  moved: boolean;
}

type Orientation = "horizontal" | "vertical";

const compressLine = (
  line: (TileState | null)[],
  fixedIndex: number,
  orientation: Orientation,
  reverse: boolean,
): { line: (TileState | null)[]; score: number; moved: boolean } => {
  const workingLine = reverse ? [...line].reverse() : line;
  const filtered = workingLine.filter((t): t is TileState => t != null);

  const result: (TileState | null)[] = Array(GRID_SIZE).fill(null);
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
      result[targetIndex] = createTile(row, col, current.value * 2, {
        isMerged: true,
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

  return { line: reverse ? result.reverse() : result, score, moved };
};

const moveHorizontal = (board: Board, reverse: boolean): MoveResult => {
  let moved = false;
  let score = 0;

  const nextBoard = board.map((row, rowIndex) => {
    const result = compressLine(row, rowIndex, "horizontal", reverse);
    if (result.moved) moved = true;
    score += result.score;
    return result.line;
  });

  return { board: nextBoard, score, moved };
};

const moveVertical = (board: Board, reverse: boolean): MoveResult => {
  let moved = false;
  let score = 0;
  const nextBoard = createEmptyBoard();

  for (let col = 0; col < GRID_SIZE; col++) {
    const column = board.map((row) => row[col] ?? null);
    const result = compressLine(column, col, "vertical", reverse);
    if (result.moved) moved = true;
    score += result.score;
    for (let row = 0; row < GRID_SIZE; row++) {
      const targetRow = nextBoard[row];
      if (targetRow) targetRow[col] = result.line[row] ?? null;
    }
  }

  return { board: nextBoard, score, moved };
};

const moveBoard = (board: Board, direction: Direction): MoveResult => {
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

const checkGameOver = (board: Board): boolean => {
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

const checkWin = (board: Board): boolean =>
  board.some((row) => row.some((cell) => cell?.value === 2048));

const initializeBoard = (): Board =>
  addRandomTile(addRandomTile(createEmptyBoard()));

export const useGame2048 = () => {
  const [board, setBoard] = useState<Board>(initializeBoard);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  // Mirror of `board` so rapid successive moves (before React re-renders)
  // always compute from the latest board without impure updater side effects.
  const boardRef = useRef(board);

  const makeMove = useCallback(
    (direction: Direction) => {
      if (gameOver || won) return;

      const {
        board: movedBoard,
        score: gainedScore,
        moved,
      } = moveBoard(boardRef.current, direction);
      if (!moved) return;

      const boardWithNewTile = addRandomTile(movedBoard);
      boardRef.current = boardWithNewTile;
      setBoard(boardWithNewTile);
      setScore((prev) => prev + gainedScore);

      if (checkWin(boardWithNewTile)) setWon(true);
      else if (checkGameOver(boardWithNewTile)) setGameOver(true);
    },
    [gameOver, won],
  );

  const resetGame = useCallback(() => {
    const freshBoard = initializeBoard();
    boardRef.current = freshBoard;
    setBoard(freshBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  const grid = useMemo(
    () => board.map((row) => row.map((cell) => cell?.value ?? 0)),
    [board],
  );
  const tiles = useMemo(
    () => board.flat().filter((cell): cell is TileState => cell != null),
    [board],
  );

  return { grid, tiles, score, gameOver, won, makeMove, resetGame };
};
