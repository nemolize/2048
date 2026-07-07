import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Board, Direction, SerializedBoard, TileState } from "../lib/game";
import {
  addRandomTile,
  checkGameOver,
  checkWin,
  compareTileIds,
  deserializeBoard,
  GHOST_LIFETIME_MS,
  initializeBoard,
  isSerializedBoard,
  moveBoard,
  serializeBoard,
} from "../lib/game";

export type { Direction, TileState } from "../lib/game";

export const BEST_SCORE_STORAGE_KEY = "game2048:bestScore";
export const GAME_STATE_STORAGE_KEY = "game2048:state";

const GAME_STATE_VERSION = 1;

interface PersistedGameState {
  version: number;
  board: SerializedBoard;
  score: number;
  gameOver: boolean;
  won: boolean;
}

interface GameSnapshot {
  board: Board;
  score: number;
  gameOver: boolean;
  won: boolean;
}

// localStorage can be absent (some test environments) or throw (privacy mode,
// quota exceeded) — persistence silently degrades to in-memory state.
const safeGetItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore — see note above.
  }
};

const safeRemoveItem = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore — see note above.
  }
};

const isPersistedGameState = (value: unknown): value is PersistedGameState => {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    state.version === GAME_STATE_VERSION &&
    typeof state.score === "number" &&
    typeof state.gameOver === "boolean" &&
    typeof state.won === "boolean" &&
    isSerializedBoard(state.board)
  );
};

const loadBestScore = (): number => {
  const raw = safeGetItem(BEST_SCORE_STORAGE_KEY);
  if (raw == null) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};

const loadInitialSnapshot = (): GameSnapshot => {
  const raw = safeGetItem(GAME_STATE_STORAGE_KEY);
  if (raw != null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isPersistedGameState(parsed)) {
        return {
          board: deserializeBoard(parsed.board),
          score: parsed.score,
          gameOver: parsed.gameOver,
          won: parsed.won,
        };
      }
    } catch {
      // Corrupt JSON — treat like any other invalid entry below.
    }
    safeRemoveItem(GAME_STATE_STORAGE_KEY);
  }

  return { board: initializeBoard(), score: 0, gameOver: false, won: false };
};

const saveGameState = (snapshot: GameSnapshot) => {
  const state: PersistedGameState = {
    version: GAME_STATE_VERSION,
    board: serializeBoard(snapshot.board),
    score: snapshot.score,
    gameOver: snapshot.gameOver,
    won: snapshot.won,
  };
  safeSetItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
};

export const useGame2048 = () => {
  const [initialSnapshot] = useState(loadInitialSnapshot);
  const [board, setBoard] = useState<Board>(initialSnapshot.board);
  const [ghosts, setGhosts] = useState<TileState[]>([]);
  const [score, setScore] = useState(initialSnapshot.score);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [gameOver, setGameOver] = useState(initialSnapshot.gameOver);
  const [won, setWon] = useState(initialSnapshot.won);
  // Mirrors of `board`/`score`/`bestScore` so rapid successive moves (before
  // React re-renders) always compute from the latest values without impure
  // updater side effects.
  const boardRef = useRef(board);
  const scoreRef = useRef(score);
  const bestScoreRef = useRef(bestScore);
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

      const nextScore = scoreRef.current + gainedScore;
      scoreRef.current = nextScore;
      setScore(nextScore);

      if (nextScore > bestScoreRef.current) {
        bestScoreRef.current = nextScore;
        setBestScore(nextScore);
        safeSetItem(BEST_SCORE_STORAGE_KEY, String(nextScore));
      }

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

      const nextWon = checkWin(boardWithNewTile);
      const nextGameOver = !nextWon && checkGameOver(boardWithNewTile);
      if (nextWon) setWon(true);
      else if (nextGameOver) setGameOver(true);

      saveGameState({
        board: boardWithNewTile,
        score: nextScore,
        gameOver: nextGameOver,
        won: nextWon,
      });
    },
    [gameOver, won],
  );

  const resetGame = useCallback(() => {
    clearTimeout(ghostTimeoutRef.current);
    const freshBoard = initializeBoard();
    boardRef.current = freshBoard;
    scoreRef.current = 0;
    setBoard(freshBoard);
    setGhosts([]);
    setScore(0);
    setGameOver(false);
    setWon(false);
    // Best score deliberately survives a reset.
    safeRemoveItem(GAME_STATE_STORAGE_KEY);
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

  return { grid, tiles, score, bestScore, gameOver, won, makeMove, resetGame };
};
