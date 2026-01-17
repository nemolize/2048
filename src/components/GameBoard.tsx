import clsx from "clsx";
import { motion } from "motion/react";

import type { TileState } from "../hooks/useGame2048";
import { Tile } from "./Tile";

interface GameBoardProps {
  grid: number[][];
  tiles: TileState[];
}

const gridClasses =
  "grid grid-cols-4 grid-rows-4 gap-[2vw] p-[2vw] sm:gap-3 sm:p-3 md:gap-4 md:p-4";

export const GameBoard = ({ grid, tiles }: GameBoardProps) => (
  <div
    className={clsx(
      "relative aspect-square w-[90vw] max-w-[500px]",
      "touch-none rounded-lg bg-gray-700 select-none",
    )}
    style={{ touchAction: "none" }}
    role="grid"
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

    <motion.div
      layout
      role="group"
      className={clsx(
        "pointer-events-none absolute inset-0 h-full",
        gridClasses,
      )}
    >
      {tiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          style={{ gridColumnStart: tile.col + 1, gridRowStart: tile.row + 1 }}
        />
      ))}
    </motion.div>
  </div>
);
