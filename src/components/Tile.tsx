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

// The move (layout) transition takes ~300ms; hold the pop / spawn scale
// changes back until the slide has essentially settled so the two effects
// don't fight for the same transform.
const MOVE_TRANSITION = {
  type: "spring" as const,
  stiffness: 450,
  damping: 30,
  mass: 0.6,
};
const POP_DELAY_S = 0.05;
const SPAWN_DELAY_S = 0.1;

export const Tile = ({ tile, style }: TileProps) => {
  const { value, isMerged, isNew, isGhost } = tile;
  const colorClass = tileColors[value] ?? "bg-gray-900 text-white";

  const animate = isMerged
    ? {
        scale: [1, 1.15, 1],
        opacity: 1,
        transition: {
          scale: { duration: 0.22, delay: POP_DELAY_S, times: [0, 0.5, 1] },
          opacity: { duration: 0.1 },
        },
      }
    : isNew
      ? {
          scale: 1,
          opacity: 1,
          transition: {
            scale: {
              type: "spring" as const,
              stiffness: 500,
              damping: 25,
              delay: SPAWN_DELAY_S,
            },
            opacity: { duration: 0.15, delay: SPAWN_DELAY_S },
          },
        }
      : { scale: 1, opacity: 1 };

  return (
    <motion.div
      layout
      className={clsx(
        "flex h-full w-full items-center justify-center",
        "rounded-md font-bold",
        "text-[5vw] sm:text-2xl md:text-3xl",
        colorClass,
      )}
      style={{
        ...style,
        // Ghosts slide underneath the merged tile so they aren't seen while
        // arriving at the merge cell.
        zIndex: isGhost === true ? 0 : isMerged ? 2 : 1,
      }}
      role="gridcell"
      initial={{
        opacity: isNew ? 0 : 1,
        scale: isNew ? 0.5 : 1,
      }}
      animate={animate}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={MOVE_TRANSITION}
    >
      {value}
    </motion.div>
  );
};
