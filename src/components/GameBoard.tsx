import clsx from "clsx";
import { AnimatePresence } from "motion/react";
import { useEffect } from "react";

import type { Direction, TileState } from "../hooks/useGame2048";
import { Tile } from "./Tile";

interface GameBoardProps {
  tiles: TileState[];
  onMove: (direction: Direction) => void;
}

const CELL_COUNT = 16;

const gridClasses =
  "grid grid-cols-4 grid-rows-4 gap-[2vw] p-[2vw] sm:gap-3 sm:p-3 md:gap-4 md:p-4";

const keyDirectionMap: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export const GameBoard = ({ tiles, onMove }: GameBoardProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = keyDirectionMap[event.key];
      if (direction) {
        event.preventDefault();
        onMove(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onMove]);

  return (
    <div
      className={clsx(
        "relative aspect-square w-[90vw] max-w-[500px]",
        "touch-none rounded-lg bg-gray-700 select-none",
      )}
      style={{ touchAction: "none" }}
      role="application"
      aria-label="2048 game board"
    >
      <div className={clsx(gridClasses, "h-full")}>
        {Array.from({ length: CELL_COUNT }, (_, i) => (
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
