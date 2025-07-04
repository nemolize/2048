import clsx from "clsx";
import { Tile } from "./Tile";

interface GameBoardProps {
  grid: number[][];
}

export const GameBoard = ({ grid }: GameBoardProps) => {
  return (
    <div
      className={clsx(
        "relative bg-gray-700 rounded-lg",
        "grid grid-cols-4",
        "touch-none select-none",
        "w-[90vw] max-w-[500px] aspect-square",
        "gap-[2vw] p-[2vw]",
        "sm:gap-3 sm:p-3",
        "md:gap-4 md:p-4",
      )}
      style={{ touchAction: "none" }}
    >
      {grid.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          // Create a stable key based on grid position
          // For a 4x4 grid, this creates keys from "pos-0" to "pos-15"
          const positionKey = `pos-${rowIndex * 4 + colIndex}`;
          return (
            <Tile
              key={positionKey}
              value={value}
              position={{ row: rowIndex, col: colIndex }}
            />
          );
        }),
      )}
    </div>
  );
};
