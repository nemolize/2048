import clsx from "clsx";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";

import type { Direction, TileState } from "../hooks/useGame2048";
import { Tile } from "./Tile";

interface GameBoardProps {
  grid: number[][];
  tiles: TileState[];
  onMove: (direction: Direction) => void;
}

const gridClasses =
  "grid grid-cols-4 grid-rows-4 gap-[2vw] p-[2vw] sm:gap-3 sm:p-3 md:gap-4 md:p-4";

const keyDirectionMap: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export const GameBoard = ({ grid, tiles, onMove }: GameBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boardRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const direction = keyDirectionMap[event.key];
    if (direction) {
      event.preventDefault();
      onMove(direction);
    }
  };

  return (
    <div
      ref={boardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={clsx(
        "relative aspect-square w-[90vw] max-w-[500px]",
        "touch-none rounded-lg bg-gray-700 select-none",
        "ring-blue-500 outline-none focus:ring-4",
      )}
      style={{ touchAction: "none" }}
      role="application"
      aria-label="2048 game board"
    >
      <div className={clsx(gridClasses, "h-full")}>
        {grid.flat().map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            role="presentation"
            className="rounded-md bg-gray-600"
          />
        ))}
      </div>

      <div
        className={clsx(
          "pointer-events-none absolute inset-0 h-full",
          gridClasses,
        )}
      >
        <AnimatePresence>
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              style={{
                gridColumnStart: tile.col + 1,
                gridRowStart: tile.row + 1,
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
