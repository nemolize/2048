import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type { SwipeDirection } from "./utils";
import { expectSwipeToChangeBoard } from "./utils";

const mouseSwipe = async (
  page: Page,
  gameBoard: Locator,
  direction: SwipeDirection,
): Promise<void> => {
  const box = await gameBoard.boundingBox();
  if (!box) throw new Error("game board has no bounding box");

  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const endX = direction === "left" ? box.x + 50 : box.x + box.width - 50;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 5 });
  await page.mouse.up();
};

test("should load the 2048 game", async ({ page }) => {
  await page.goto("/");

  // Check page title
  await expect(page).toHaveTitle("2048 Game");

  // Check that the game title is present
  await expect(page.getByRole("heading", { name: "2048" })).toBeVisible();

  // Check that score is displayed
  await expect(page.getByText("Score: 0")).toBeVisible();

  // Check that the game board is present
  const gameBoard = page.getByRole("application");
  await expect(gameBoard).toBeVisible();

  // Check that the placeholder cells and the two starting tiles are present
  const cells = gameBoard.locator('[role="presentation"]');
  await expect(cells).toHaveCount(16); // 4x4 grid placeholders
  await expect(gameBoard.locator('[role="img"]')).toHaveCount(2);

  // Check reset button is visible
  await expect(page.getByRole("button", { name: "Reset Game" })).toBeVisible();

  // Check swipe instructions
  await expect(page.getByText("Swipe or use arrow keys to play")).toBeVisible();
});

test("swipe moves tiles on the board", async ({ page }) => {
  await page.goto("/");

  const gameBoard = page.getByRole("application");
  await expect(gameBoard.locator('[role="img"]')).toHaveCount(2);

  // A successful move must change the board (tiles shift and a new one
  // spawns) — assert on the serialized board, not on the score, which is
  // monotonic and passes even when movement is broken.
  await expectSwipeToChangeBoard(page, gameBoard, mouseSwipe);
});

test("should reset the game", async ({ page }) => {
  await page.goto("/");

  // Make a move that verifiably changed the board first
  const gameBoard = page.getByRole("application");
  await expectSwipeToChangeBoard(page, gameBoard, mouseSwipe);

  // Click reset button
  await page.getByRole("button", { name: "Reset Game" }).click();

  // Score should be back to 0 and the board back to the two starting tiles
  await expect(page.getByText("Score: 0")).toBeVisible();
  await expect(gameBoard.locator('[role="img"]')).toHaveCount(2);
});

test("tiles remain square and aligned", async ({ page }) => {
  await page.goto("/");

  const board = page.getByRole("application");
  await expect(board).toBeVisible();

  const tileSnapshot = await board.evaluate((boardElement: HTMLElement) => {
    const boardRect = boardElement.getBoundingClientRect();
    // Use offsetWidth/Height (layout box, ignores transform) instead of
    // getBoundingClientRect (transform-aware) so in-flight scale animations
    // don't perturb the measurements this test cares about.
    const tiles = Array.from(
      boardElement.querySelectorAll<HTMLElement>('[role="img"]'),
    ).map((tile) => ({
      width: tile.offsetWidth,
      height: tile.offsetHeight,
      rowStart: Number.parseInt(tile.style.gridRowStart || "0", 10),
      colStart: Number.parseInt(tile.style.gridColumnStart || "0", 10),
    }));

    return {
      boardWidth: boardRect.width,
      boardHeight: boardRect.height,
      tiles,
    };
  });

  const { boardWidth, boardHeight, tiles } = tileSnapshot;

  expect(Math.abs(boardWidth - boardHeight)).toBeLessThan(1);
  expect(tiles.length).toBeGreaterThan(0);

  const baseWidth = tiles[0]?.width ?? 0;
  tiles.forEach((tile) => {
    expect(tile.width).toBeGreaterThan(0);
    expect(tile.height).toBeGreaterThan(0);
    expect(Math.abs(tile.width - tile.height)).toBeLessThan(1);
    expect(Math.abs(tile.width - baseWidth)).toBeLessThan(1);
    expect(tile.rowStart).toBeGreaterThanOrEqual(1);
    expect(tile.rowStart).toBeLessThanOrEqual(4);
    expect(tile.colStart).toBeGreaterThanOrEqual(1);
    expect(tile.colStart).toBeLessThanOrEqual(4);
  });
});
