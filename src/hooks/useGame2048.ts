import { useCallback, useState } from "react";

export type Direction = "up" | "down" | "left" | "right";

const GRID_SIZE = 4;

const createEmptyGrid = (): number[][] => {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
};

const addRandomTile = (grid: number[][]): number[][] => {
  const emptyCells: [number, number][] = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i]?.[j] === 0) {
        emptyCells.push([i, j]);
      }
    }
  }

  if (emptyCells.length === 0) return grid;

  const newGrid = grid.map((row) => [...row]);
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  if (!randomCell) return grid;
  const [row, col] = randomCell;
  const targetRow = newGrid[row];
  if (targetRow) {
    targetRow[col] = Math.random() < 0.9 ? 2 : 4;
  }

  return newGrid;
};

const moveLeft = (row: number[]): [number[], number] => {
  let score = 0;
  const filtered = row.filter((val) => val !== 0);
  const merged: number[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i];
    const next = filtered[i + 1];
    if (current !== undefined && i < filtered.length - 1 && current === next) {
      merged.push(current * 2);
      score += current * 2;
      i++;
    } else if (current !== undefined) {
      merged.push(current);
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0);
  }

  return [merged, score];
};

const rotateGrid = (grid: number[][]): number[][] => {
  const rotated = createEmptyGrid();
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const sourceRow = grid[GRID_SIZE - j - 1];
      const targetRow = rotated[i];
      if (sourceRow && targetRow) {
        const value = sourceRow[i];
        if (value !== undefined) {
          targetRow[j] = value;
        }
      }
    }
  }
  return rotated;
};

const move = (
  grid: number[][],
  direction: Direction,
): [number[][], number, boolean] => {
  let rotatedGrid = grid;
  let rotations = 0;

  switch (direction) {
    case "up":
      rotations = 3;
      break;
    case "right":
      rotations = 2;
      break;
    case "down":
      rotations = 1;
      break;
    case "left":
      rotations = 0;
      break;
  }

  for (let i = 0; i < rotations; i++) {
    rotatedGrid = rotateGrid(rotatedGrid);
  }

  let moved = false;
  let totalScore = 0;
  const newGrid = rotatedGrid.map((row, _rowIndex) => {
    const [newRow, score] = moveLeft(row);
    totalScore += score;
    if (newRow.some((val, index) => val !== row[index])) {
      moved = true;
    }
    return newRow;
  });

  let result = newGrid;
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    result = rotateGrid(result);
  }

  return [result, totalScore, moved];
};

const checkGameOver = (grid: number[][]): boolean => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const current = grid[i]?.[j];
      if (current === 0 || current === undefined) return false;

      const below = grid[i + 1]?.[j];
      const right = grid[i]?.[j + 1];

      if (i < GRID_SIZE - 1 && current === below) return false;
      if (j < GRID_SIZE - 1 && current === right) return false;
    }
  }
  return true;
};

const checkWin = (grid: number[][]): boolean => {
  return grid.some((row) => row.some((value) => value === 2048));
};

export const useGame2048 = () => {
  const [grid, setGrid] = useState(() => {
    const initialGrid = createEmptyGrid();
    return addRandomTile(addRandomTile(initialGrid));
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const makeMove = useCallback(
    (direction: Direction) => {
      if (gameOver || won) return;

      const [newGrid, moveScore, moved] = move(grid, direction);

      if (moved) {
        const gridWithNewTile = addRandomTile(newGrid);
        setGrid(gridWithNewTile);
        setScore((prevScore) => prevScore + moveScore);

        if (checkWin(gridWithNewTile)) {
          setWon(true);
        } else if (checkGameOver(gridWithNewTile)) {
          setGameOver(true);
        }
      }
    },
    [grid, gameOver, won],
  );

  const resetGame = useCallback(() => {
    const initialGrid = createEmptyGrid();
    setGrid(addRandomTile(addRandomTile(initialGrid)));
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  return {
    grid,
    score,
    gameOver,
    won,
    makeMove,
    resetGame,
  };
};
