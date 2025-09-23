import { useCallback, useMemo, useState } from "react";

export type Direction = "up" | "down" | "left" | "right";

const GRID_SIZE = 4;

let tileIdCounter = 0;
const nextTileId = () => {
  tileIdCounter += 1;
  return `tile-${tileIdCounter}`;
};

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
): TileState => {
  return {
    id: overrides?.id ?? nextTileId(),
    value,
    row,
    col,
    isNew: overrides?.isNew ?? false,
    isMerged: overrides?.isMerged ?? false,
  };
};

const createEmptyBoard = (): Board => {
  return Array.from({ length: GRID_SIZE }, () =>
    Array<TileState | null>(GRID_SIZE).fill(null),
  );
};

const cloneBoard = (board: Board): Board => {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
};

const addRandomTile = (board: Board): Board => {
  const emptyCells: Array<[number, number]> = [];

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        emptyCells.push([rowIndex, colIndex]);
      }
    });
  });

  if (emptyCells.length === 0) return board;

  const [row, col] = emptyCells[
    Math.floor(Math.random() * emptyCells.length)
  ] ?? [0, 0];
  const value = Math.random() < 0.9 ? 2 : 4;

  return board.map((currentRow, rowIndex) => {
    return currentRow.map((cell, colIndex) => {
      if (rowIndex === row && colIndex === col) {
        return createTile(row, col, value, { isNew: true });
      }
      if (!cell) return null;
      return { ...cell, isNew: false, isMerged: false };
    });
  });
};

interface MoveResult {
  board: Board;
  score: number;
  moved: boolean;
}

const compressRow = (
  row: (TileState | null)[],
  rowIndex: number,
  direction: "left" | "right",
): { row: (TileState | null)[]; score: number; moved: boolean } => {
  const workingRow = direction === "left" ? row : [...row].reverse();
  const filtered = workingRow.filter((tile): tile is TileState => tile != null);

  const result: (TileState | null)[] = Array(GRID_SIZE).fill(null);
  let score = 0;
  let moved = false;
  let targetIndex = 0;

  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i];
    const next = filtered[i + 1];
    const targetCol =
      direction === "left" ? targetIndex : GRID_SIZE - 1 - targetIndex;

    if (current && next && current.value === next.value) {
      const mergedTile = createTile(rowIndex, targetCol, current.value * 2, {
        isMerged: true,
      });
      result[targetIndex] = mergedTile;
      score += mergedTile.value;
      moved = true;
      targetIndex++;
      i++;
    } else if (current) {
      const updatedTile = createTile(rowIndex, targetCol, current.value, {
        id: current.id,
        isNew: false,
        isMerged: false,
      });
      if (current.row !== rowIndex || current.col !== targetCol) {
        moved = true;
      }
      result[targetIndex] = updatedTile;
      targetIndex++;
    }
  }

  const normalizedRow = direction === "left" ? result : result.reverse();
  return { row: normalizedRow, score, moved };
};

const compressColumn = (
  column: (TileState | null)[],
  colIndex: number,
  direction: "up" | "down",
): { column: (TileState | null)[]; score: number; moved: boolean } => {
  const workingColumn = direction === "up" ? column : [...column].reverse();
  const filtered = workingColumn.filter(
    (tile): tile is TileState => tile != null,
  );

  const result: (TileState | null)[] = Array(GRID_SIZE).fill(null);
  let score = 0;
  let moved = false;
  let targetIndex = 0;

  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i];
    const next = filtered[i + 1];
    const targetRow =
      direction === "up" ? targetIndex : GRID_SIZE - 1 - targetIndex;

    if (current && next && current.value === next.value) {
      const mergedTile = createTile(targetRow, colIndex, current.value * 2, {
        isMerged: true,
      });
      result[targetIndex] = mergedTile;
      score += mergedTile.value;
      moved = true;
      targetIndex++;
      i++;
    } else if (current) {
      const updatedTile = createTile(targetRow, colIndex, current.value, {
        id: current.id,
        isNew: false,
        isMerged: false,
      });
      if (current.row !== targetRow || current.col !== colIndex) {
        moved = true;
      }
      result[targetIndex] = updatedTile;
      targetIndex++;
    }
  }

  const normalizedColumn = direction === "up" ? result : result.reverse();
  return { column: normalizedColumn, score, moved };
};

const moveLeft = (board: Board): MoveResult => {
  let moved = false;
  let score = 0;

  const nextBoard = board.map((row, rowIndex) => {
    const {
      row: updatedRow,
      score: rowScore,
      moved: rowMoved,
    } = compressRow(row, rowIndex, "left");
    if (rowMoved) moved = true;
    score += rowScore;
    return updatedRow;
  });

  return { board: nextBoard, score, moved };
};

const moveRight = (board: Board): MoveResult => {
  let moved = false;
  let score = 0;

  const nextBoard = board.map((row, rowIndex) => {
    const {
      row: updatedRow,
      score: rowScore,
      moved: rowMoved,
    } = compressRow(row, rowIndex, "right");
    if (rowMoved) moved = true;
    score += rowScore;
    return updatedRow;
  });

  return { board: nextBoard, score, moved };
};

const moveUp = (board: Board): MoveResult => {
  let moved = false;
  let score = 0;
  const nextBoard = createEmptyBoard();

  for (let col = 0; col < GRID_SIZE; col++) {
    const column = board.map((row) => row[col] ?? null);
    const {
      column: updatedColumn,
      score: colScore,
      moved: colMoved,
    } = compressColumn(column, col, "up");
    if (colMoved) moved = true;
    score += colScore;
    for (let row = 0; row < GRID_SIZE; row++) {
      const targetRow = nextBoard[row];
      if (targetRow) {
        targetRow[col] = updatedColumn[row] ?? null;
      }
    }
  }

  return { board: nextBoard, score, moved };
};

const moveDown = (board: Board): MoveResult => {
  let moved = false;
  let score = 0;
  const nextBoard = createEmptyBoard();

  for (let col = 0; col < GRID_SIZE; col++) {
    const column = board.map((row) => row[col] ?? null);
    const {
      column: updatedColumn,
      score: colScore,
      moved: colMoved,
    } = compressColumn(column, col, "down");
    if (colMoved) moved = true;
    score += colScore;
    for (let row = 0; row < GRID_SIZE; row++) {
      const targetRow = nextBoard[row];
      if (targetRow) {
        targetRow[col] = updatedColumn[row] ?? null;
      }
    }
  }

  return { board: nextBoard, score, moved };
};

const moveBoard = (board: Board, direction: Direction): MoveResult => {
  switch (direction) {
    case "left":
      return moveLeft(board);
    case "right":
      return moveRight(board);
    case "up":
      return moveUp(board);
    case "down":
      return moveDown(board);
  }
};

const boardToNumberGrid = (board: Board): number[][] => {
  return board.map((row) => row.map((cell) => cell?.value ?? 0));
};

const checkGameOver = (board: Board): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = board[row]?.[col];
      if (!current) return false;

      const right = board[row]?.[col + 1];
      if (right && right.value === current.value) return false;

      const below = board[row + 1]?.[col];
      if (below && below.value === current.value) return false;
    }
  }
  return true;
};

const checkWin = (board: Board): boolean => {
  return board.some((row) => row.some((cell) => cell?.value === 2048));
};

const initializeBoard = (): Board => {
  let board = createEmptyBoard();
  board = addRandomTile(board);
  return addRandomTile(board);
};

export const useGame2048 = () => {
  const [board, setBoard] = useState<Board>(() => initializeBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const makeMove = useCallback(
    (direction: Direction) => {
      if (gameOver || won) return;

      setBoard((currentBoard) => {
        const currentSnapshot = cloneBoard(currentBoard);
        const {
          board: movedBoard,
          score: gainedScore,
          moved,
        } = moveBoard(currentSnapshot, direction);

        if (!moved) {
          return currentBoard;
        }

        const boardWithNewTile = addRandomTile(movedBoard);
        setScore((prev) => prev + gainedScore);

        if (!won && checkWin(boardWithNewTile)) {
          setWon(true);
        } else if (!gameOver && checkGameOver(boardWithNewTile)) {
          setGameOver(true);
        }

        return boardWithNewTile;
      });
    },
    [gameOver, won],
  );

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  const grid = useMemo(() => boardToNumberGrid(board), [board]);
  const tiles = useMemo(() => {
    return board.flat().filter((cell): cell is TileState => cell != null);
  }, [board]);

  return {
    grid,
    tiles,
    score,
    gameOver,
    won,
    makeMove,
    resetGame,
  };
};
