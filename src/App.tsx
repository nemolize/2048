import "@interactjs/auto-start";
import "@interactjs/actions/drag";
import "@interactjs/actions/gesture";

import interact from "@interactjs/interact";
import type { InteractEvent } from "@interactjs/types";
import clsx from "clsx";
import { useEffect, useRef } from "react";

import { GameBoard } from "./components/GameBoard";
import { useGame2048 } from "./hooks/useGame2048";

const App = () => {
  const { grid, score, gameOver, won, makeMove, resetGame } = useGame2048();
  const gameBoardRef = useRef<HTMLDivElement>(null);

  // Handle swipe gestures with interact.js
  useEffect(() => {
    if (!gameBoardRef.current) return;

    let startX = 0;
    let startY = 0;
    let hasSwiped = false;

    const interactable = interact(gameBoardRef.current).draggable({
      listeners: {
        start(event: InteractEvent) {
          startX = event.page.x;
          startY = event.page.y;
          hasSwiped = false;
        },
        move(event: InteractEvent) {
          if (hasSwiped) return;

          const deltaX = event.page.x - startX;
          const deltaY = event.page.y - startY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          // Only trigger on significant swipes
          if (distance < 30) return;

          hasSwiped = true;

          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          if (absX > absY) {
            // Horizontal swipe
            makeMove(deltaX > 0 ? "right" : "left");
          } else {
            // Vertical swipe
            makeMove(deltaY > 0 ? "down" : "up");
          }
        },
      },
    });

    return () => {
      interactable.unset();
    };
  }, [makeMove]);

  return (
    <div
      className={clsx(
        "flex h-screen min-h-screen",
        "items-center justify-center",
        "overflow-hidden bg-gray-900 text-white",
      )}
    >
      <div className="flex flex-col items-center gap-4 px-4 sm:gap-6 md:gap-8">
        <div className="text-center">
          <h1 className="mb-2 text-[10vw] font-bold sm:mb-4 sm:text-5xl md:text-6xl">
            2048
          </h1>
          <div className="mb-2 text-[5vw] sm:mb-4 sm:text-xl md:text-2xl">
            Score: {score}
          </div>
        </div>

        <div ref={gameBoardRef}>
          <GameBoard grid={grid} />
        </div>

        {(gameOver || won) && (
          <div className="text-center">
            <div className="mb-2 text-[6vw] font-bold sm:mb-4 sm:text-2xl md:text-3xl">
              {won ? "You Win! 🎉" : "Game Over!"}
            </div>
            <button
              onClick={resetGame}
              className={clsx(
                "rounded-lg bg-blue-500 px-6 py-3",
                "font-bold text-white",
                "transition-colors hover:bg-blue-700",
              )}
              type="button"
            >
              New Game
            </button>
          </div>
        )}

        <div className="text-center text-gray-400">
          <p className="mb-2 text-[3.5vw] sm:text-base">Swipe to play</p>
          <button
            onClick={resetGame}
            className={clsx(
              "rounded bg-gray-700 px-4 py-2 text-sm",
              "transition-colors hover:bg-gray-600",
            )}
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
