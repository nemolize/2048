import clsx from "clsx";
import { motion } from "motion/react";

import type { TileState } from "../hooks/useGame2048";
import { Tile } from "./Tile";

interface GameBoardProps {
  grid: number[][];
  tiles: TileState[];
}

const boardGridClasses = clsx(
  "grid grid-cols-4",
  "grid-rows-4",
  "gap-[2vw] p-[2vw]",
  "sm:gap-3 sm:p-3",
  "md:gap-4 md:p-4",
);

export const GameBoard = ({ grid, tiles }: GameBoardProps) => {
  return (
    <div
      className={clsx(
        "relative rounded-lg bg-gray-700",
        "aspect-square w-[90vw] max-w-[500px]",
        "touch-none select-none",
      )}
      style={{ touchAction: "none" }}
    >
      <div className={clsx(boardGridClasses, "h-full")}>
        {grid.map((row, rowIndex) =>
          row.map((_, colIndex) => {
            const cellKey = `cell-${rowIndex}-${colIndex}`;
            return <div key={cellKey} className="rounded-md bg-gray-600" />;
          }),
        )}
      </div>

      <motion.div
        layout
        className={clsx(
          "pointer-events-none absolute inset-0",
          "h-full",
          boardGridClasses,
        )}
      >
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
      </motion.div>
    </div>
  );
};
