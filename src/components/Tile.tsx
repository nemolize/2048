import clsx from "clsx";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

import type { TileState } from "../hooks/useGame2048";

interface TileProps {
  tile: TileState;
  style?: CSSProperties;
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

export const Tile = ({ tile, style }: TileProps) => {
  const { value, isMerged, isNew, id } = tile;
  const colorClass = tileColors[value] ?? "bg-gray-900 text-white";

  return (
    <motion.div
      layout
      layoutId={id}
      className={clsx(
        "flex h-full w-full items-center justify-center",
        "rounded-md font-bold",
        "text-[5vw] sm:text-2xl md:text-3xl",
        colorClass,
      )}
      style={style}
      initial={{ scale: isNew ? 0.6 : 1, opacity: isNew ? 0 : 1 }}
      animate={
        isMerged ? { scale: [1, 1.1, 1], opacity: 1 } : { scale: 1, opacity: 1 }
      }
      transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.6 }}
    >
      {value}
    </motion.div>
  );
};
