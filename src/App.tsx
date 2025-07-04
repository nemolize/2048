import interact from "@interactjs/interact";
import "@interactjs/auto-start";
import "@interactjs/actions/drag";
import "@interactjs/actions/gesture";
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
        "flex min-h-screen h-screen",
        "items-center justify-center",
        "bg-gray-900 text-white overflow-hidden",
      )}
    >
      <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 px-4">
        <div className="text-center">
          <h1 className="text-[10vw] sm:text-5xl md:text-6xl font-bold mb-2 sm:mb-4">
            2048
          </h1>
          <div className="text-[5vw] sm:text-xl md:text-2xl mb-2 sm:mb-4">
            Score: {score}
          </div>
        </div>

        <div ref={gameBoardRef}>
          <GameBoard grid={grid} />
        </div>

        {(gameOver || won) && (
          <div className="text-center">
            <div className="text-[6vw] sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4">
              {won ? "You Win! 🎉" : "Game Over!"}
            </div>
            <button
              onClick={resetGame}
              className={clsx(
                "rounded-lg bg-blue-500 px-6 py-3",
                "font-bold text-white",
                "hover:bg-blue-700 transition-colors",
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
              "hover:bg-gray-600 transition-colors",
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
