import clsx from "clsx";
import { Tile } from "./Tile";

interface GameBoardProps {
  grid: number[][];
}

export const GameBoard = ({ grid }: GameBoardProps) => {
  return (
    <div
      className={clsx(
        "relative bg-gray-700 rounded-lg p-4",
        "grid grid-cols-4 gap-4",
        "touch-none select-none",
      )}
      style={{ touchAction: "none" }}
    >
      {grid.map((row, rowIndex) =>
        row.map((value, colIndex) => (
          <Tile
            key={`${rowIndex}-${colIndex}`}
            value={value}
            position={{ row: rowIndex, col: colIndex }}
          />
        )),
      )}
    </div>
  );
};
