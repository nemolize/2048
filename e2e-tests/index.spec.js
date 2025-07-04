import { expect, test } from "@playwright/test";

test("should load the 2048 game", async ({ page }) => {
  await page.goto("/");

  // Check page title
  await expect(page).toHaveTitle("2048 Game");

  // Check that the game title is present
  await expect(page.getByRole("heading", { name: "2048" })).toBeVisible();

  // Check that score is displayed
  await expect(page.getByText("Score: 0")).toBeVisible();

  // Check that the game board is present
  const gameBoard = page.locator(".grid-cols-4");
  await expect(gameBoard).toBeVisible();

  // Check that tiles are present in the game board
  const tiles = gameBoard.locator(".aspect-square");
  await expect(tiles).toHaveCount(16); // 4x4 grid

  // Check reset button is visible
  await expect(page.getByRole("button", { name: "Reset Game" })).toBeVisible();

  // Check swipe instructions
  await expect(page.getByText("Swipe to play")).toBeVisible();
});

test("should handle game interactions", async ({ page }) => {
  await page.goto("/");

  // Get initial score
  const scoreText = await page.getByText(/Score: \d+/).textContent();
  const initialScore = parseInt(scoreText.match(/\d+/)[0]);

  // Simulate a swipe (drag) gesture
  const gameBoard = page.locator(".grid-cols-4");
  const box = await gameBoard.boundingBox();

  // Swipe left
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 50, box.y + box.height / 2);
  await page.mouse.up();

  // Wait a bit for the game to update
  await page.waitForTimeout(300);

  // Score might have changed if tiles merged
  const newScoreText = await page.getByText(/Score: \d+/).textContent();
  const newScore = parseInt(newScoreText.match(/\d+/)[0]);
  expect(newScore).toBeGreaterThanOrEqual(initialScore);
});

test("should reset the game", async ({ page }) => {
  await page.goto("/");

  // Make some moves first
  const gameBoard = page.locator(".grid-cols-4");
  const box = await gameBoard.boundingBox();

  // Swipe in different directions
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 50, box.y + box.height / 2);
  await page.mouse.up();

  await page.waitForTimeout(200);

  // Click reset button
  await page.getByRole("button", { name: "Reset Game" }).click();

  // Score should be back to 0
  await expect(page.getByText("Score: 0")).toBeVisible();
});
