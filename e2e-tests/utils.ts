import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type SwipeDirection = "left" | "right";

export type Swipe = (
  page: Page,
  gameBoard: Locator,
  direction: SwipeDirection,
) => Promise<void>;

/**
 * Serialize the board into a deterministic "row,col:label" string so
 * before/after comparisons detect any tile movement, merge, or spawn.
 */
export const serializeBoard = async (gameBoard: Locator): Promise<string> =>
  gameBoard.evaluate((boardElement) =>
    Array.from(boardElement.querySelectorAll<HTMLElement>('[role="img"]'))
      .map(
        (tile) =>
          `${tile.style.gridRowStart},${tile.style.gridColumnStart}:${
            tile.getAttribute("aria-label") ?? ""
          }`,
      )
      .sort()
      .join("|"),
  );

/**
 * Swipe left and assert the board actually changed. If the left swipe was a
 * no-op (both starting tiles already sat in the leftmost column), a right
 * swipe is guaranteed to move them, so fall back to that before asserting.
 */
export const expectSwipeToChangeBoard = async (
  page: Page,
  gameBoard: Locator,
  swipe: Swipe,
): Promise<void> => {
  const before = await serializeBoard(gameBoard);

  await swipe(page, gameBoard, "left");
  await page.waitForTimeout(400);

  if ((await serializeBoard(gameBoard)) === before) {
    await swipe(page, gameBoard, "right");
  }

  await expect.poll(async () => serializeBoard(gameBoard)).not.toBe(before);
};
