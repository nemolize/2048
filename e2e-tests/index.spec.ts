import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const readScore = async (page: Page): Promise<number> => {
  const scoreText = await page.getByText(/Score: \d+/).textContent();
  const match = scoreText?.match(/\d+/);
  if (!match) throw new Error(`score text not found: ${String(scoreText)}`);
  return Number.parseInt(match[0], 10);
};

const swipeLeft = async (page: Page, gameBoard: Locator): Promise<void> => {
  const box = await gameBoard.boundingBox();
  if (!box) throw new Error("game board has no bounding box");

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 50, box.y + box.height / 2);
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

  // Check that tiles are present in the game board
  const cells = gameBoard.locator('[role="presentation"]');
  await expect(cells).toHaveCount(16); // 4x4 grid placeholders

  // Check reset button is visible
  await expect(page.getByRole("button", { name: "Reset Game" })).toBeVisible();

  // Check swipe instructions
  await expect(page.getByText("Swipe or use arrow keys to play")).toBeVisible();
});

test("should handle game interactions", async ({ page }) => {
  await page.goto("/");

  const initialScore = await readScore(page);

  // Simulate a swipe (drag) gesture
  const gameBoard = page.getByRole("application");
  await swipeLeft(page, gameBoard);

  // Wait a bit for the game to update
  await page.waitForTimeout(300);

  // Score might have changed if tiles merged
  const newScore = await readScore(page);
  expect(newScore).toBeGreaterThanOrEqual(initialScore);
});

test("should reset the game", async ({ page }) => {
  await page.goto("/");

  // Make some moves first
  const gameBoard = page.getByRole("application");
  await swipeLeft(page, gameBoard);

  await page.waitForTimeout(200);

  // Click reset button
  await page.getByRole("button", { name: "Reset Game" }).click();

  // Score should be back to 0
  await expect(page.getByText("Score: 0")).toBeVisible();
});

test("tiles remain square and aligned", async ({ page }) => {
  await page.goto("/");

  const board = page.getByRole("application");
  await expect(board).toBeVisible();

  const tileSnapshot = await board.evaluate((boardElement) => {
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

  expect(tileSnapshot).not.toBeNull();
  const { boardWidth, boardHeight, tiles } = tileSnapshot ?? {
    boardWidth: 0,
    boardHeight: 0,
    tiles: [],
  };

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
