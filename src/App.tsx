import type { PanInfo } from "motion/react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect } from "react";

import { GameBoard } from "./components/GameBoard";
import { useGame2048 } from "./hooks/useGame2048";

const App = () => {
  const {
    tiles,
    score,
    bestScore,
    gameOver,
    won,
    keepPlaying,
    canUndo,
    makeMove,
    undo,
    resetGame,
    startKeepPlaying,
  } = useGame2048();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd+Z (without Shift, which conventionally means redo).
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  // Game over takes precedence: the board can fill up while keeping going
  // after a win, and that must read as "Game Over!", not a second win.
  const showWin = won && !keepPlaying && !gameOver;

  const handleSwipe = useCallback(
    (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
      const { x, y } = info.offset;
      if (Math.hypot(x, y) < 30) return;

      makeMove(
        Math.abs(x) > Math.abs(y)
          ? x > 0
            ? "right"
            : "left"
          : y > 0
            ? "down"
            : "up",
      );
    },
    [makeMove],
  );

  return (
    <div className="flex h-screen min-h-screen items-center justify-center overflow-hidden bg-gray-900 text-white">
      <div className="flex flex-col items-center gap-4 px-4 sm:gap-6 md:gap-8">
        <div className="text-center">
          <h1 className="mb-2 text-[10vw] font-bold sm:mb-4 sm:text-5xl md:text-6xl">
            2048
          </h1>
          <div
            aria-live="polite"
            className="mb-2 flex justify-center gap-4 text-[5vw] sm:mb-4 sm:text-xl md:text-2xl"
          >
            <span>Score: {score}</span>
            <span>Best: {bestScore}</span>
          </div>
        </div>

        <m.div
          drag
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          dragSnapToOrigin
          onPanEnd={handleSwipe}
          style={{ touchAction: "none" }}
        >
          <GameBoard tiles={tiles} onMove={makeMove} />
        </m.div>

        <AnimatePresence>
          {(gameOver || showWin) && (
            <m.div
              key="game-state-overlay"
              aria-live="polite"
              className="text-center"
              initial={{ opacity: 0, scale: 0.8, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 26,
                mass: 0.7,
              }}
            >
              <div className="mb-2 text-[6vw] font-bold sm:mb-4 sm:text-2xl md:text-3xl">
                {showWin ? "You Win! 🎉" : "Game Over!"}
              </div>
              <div className="flex justify-center gap-3">
                {showWin && (
                  <button
                    onClick={startKeepPlaying}
                    className="rounded-lg bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-700"
                    type="button"
                  >
                    Keep Going
                  </button>
                )}
                <button
                  onClick={resetGame}
                  className="rounded-lg bg-blue-500 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700"
                  type="button"
                >
                  New Game
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <div className="text-center text-gray-400">
          <p className="mb-2 text-[3.5vw] sm:text-base">
            Swipe or use arrow keys to play
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="rounded bg-gray-700 px-4 py-2 text-sm transition-colors hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-gray-700"
              type="button"
            >
              Undo
            </button>
            <button
              onClick={resetGame}
              className="rounded bg-gray-700 px-4 py-2 text-sm transition-colors hover:bg-gray-600"
              type="button"
            >
              Reset Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
