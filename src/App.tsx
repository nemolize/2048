import type { PanInfo } from "motion/react";
import { AnimatePresence, m } from "motion/react";
import { useCallback } from "react";

import { GameBoard } from "./components/GameBoard";
import { useGame2048 } from "./hooks/useGame2048";

const App = () => {
  const { tiles, score, gameOver, won, makeMove, resetGame } = useGame2048();

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
            className="mb-2 text-[5vw] sm:mb-4 sm:text-xl md:text-2xl"
          >
            Score: {score}
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
          {(gameOver || won) && (
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
                {won ? "You Win! 🎉" : "Game Over!"}
              </div>
              <button
                onClick={resetGame}
                className="rounded-lg bg-blue-500 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700"
                type="button"
              >
                New Game
              </button>
            </m.div>
          )}
        </AnimatePresence>

        <div className="text-center text-gray-400">
          <p className="mb-2 text-[3.5vw] sm:text-base">
            Swipe or use arrow keys to play
          </p>
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
  );
};

export default App;
