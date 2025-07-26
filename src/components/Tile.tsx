import clsx from "clsx";

interface TileProps {
  value: number;
  position: { row: number; col: number };
}

const tileColors: Record<number, string> = {
  0: "bg-gray-600",
  2: "bg-gray-100 text-gray-800",
  4: "bg-gray-200 text-gray-800",
  8: "bg-orange-300 text-white",
  16: "bg-orange-400 text-white",
  32: "bg-orange-500 text-white",
  64: "bg-orange-600 text-white",
  128: "bg-yellow-400 text-white",
  256: "bg-yellow-500 text-white",
  512: "bg-yellow-600 text-white",
  1024: "bg-yellow-700 text-white",
  2048: "bg-yellow-800 text-white",
};

export const Tile = ({ value }: TileProps) => {
  const colorClass = tileColors[value] ?? "bg-gray-900 text-white";

  return (
    <div
      className={clsx(
        "flex aspect-square items-center justify-center",
        "rounded-md font-bold transition-all duration-150",
        "text-[5vw] sm:text-2xl md:text-3xl",
        colorClass,
        {
          "scale-100": value !== 0,
          "scale-95 opacity-0": value === 0,
        },
      )}
    >
      {value !== 0 && value}
    </div>
  );
};
