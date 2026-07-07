import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type { SwipeDirection } from "./utils";
import { expectSwipeToChangeBoard } from "./utils";

/**
 * Drive a swipe with real touch input via CDP so the touch → pointer event
 * cascade the mobile swipe UX depends on is exercised end-to-end.
 * Chromium-only, which both configured projects satisfy.
 */
const touchSwipe = async (
  page: Page,
  gameBoard: Locator,
  direction: SwipeDirection,
): Promise<void> => {
  const box = await gameBoard.boundingBox();
  if (!box) throw new Error("game board has no bounding box");

  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const step = (direction === "left" ? -1 : 1) * 20;

  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y }],
    });
    for (let i = 1; i <= 5; i += 1) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: startX + i * step, y }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await cdp.detach();
  }
};

test("touch swipe moves tiles on the board", async ({ page, isMobile }) => {
  test.skip(!isMobile, "touch swipe is exercised on the mobile project only");

  await page.goto("/");

  const gameBoard = page.getByRole("application");
  await expect(gameBoard.locator('[role="img"]')).toHaveCount(2);

  await expectSwipeToChangeBoard(page, gameBoard, touchSwipe);
});
