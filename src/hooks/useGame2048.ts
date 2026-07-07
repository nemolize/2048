import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Board, Direction, TileState } from "../lib/game";
import {
  addRandomTile,
  checkGameOver,
  checkWin,
  compareTileIds,
  GHOST_LIFETIME_MS,
  initializeBoard,
  moveBoard,
} from "../lib/game";

export type { Direction, TileState } from "../lib/game";

export const useGame2048 = () => {
  const [board, setBoard] = useState<Board>(initializeBoard);
  const [ghosts, setGhosts] = useState<TileState[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  // Mirror of `board` so rapid successive moves (before React re-renders)
  // always compute from the latest board without impure updater side effects.
  const boardRef = useRef(board);
  const ghostTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(ghostTimeoutRef.current), []);

  const makeMove = useCallback(
    (direction: Direction) => {
      if (gameOver || won) return;

      const {
        board: movedBoard,
        ghosts: mergeGhosts,
        score: gainedScore,
        moved,
      } = moveBoard(boardRef.current, direction);
      if (!moved) return;

      const boardWithNewTile = addRandomTile(movedBoard);
      boardRef.current = boardWithNewTile;
      setBoard(boardWithNewTile);
      setScore((prev) => prev + gainedScore);

      // Ghosts slide into their merge cell (hidden under the merged tile),
      // then get dropped once the slide animation has settled.
      setGhosts(mergeGhosts);
      clearTimeout(ghostTimeoutRef.current);
      if (mergeGhosts.length > 0) {
        ghostTimeoutRef.current = setTimeout(
          () => setGhosts([]),
          GHOST_LIFETIME_MS,
        );
      }

      if (checkWin(boardWithNewTile)) setWon(true);
      else if (checkGameOver(boardWithNewTile)) setGameOver(true);
    },
    [gameOver, won],
  );

  const resetGame = useCallback(() => {
    clearTimeout(ghostTimeoutRef.current);
    const freshBoard = initializeBoard();
    boardRef.current = freshBoard;
    setBoard(freshBoard);
    setGhosts([]);
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  const grid = useMemo(
    () => board.map((row) => row.map((cell) => cell?.value ?? 0)),
    [board],
  );
  // Stable id-sorted order keeps DOM order constant across moves, so React
  // never reorders tile nodes mid-animation. Z-order is handled via zIndex.
  const tiles = useMemo(
    () =>
      [
        ...board.flat().filter((cell): cell is TileState => cell != null),
        ...ghosts,
      ].sort(compareTileIds),
    [board, ghosts],
  );

  return { grid, tiles, score, gameOver, won, makeMove, resetGame };
};
