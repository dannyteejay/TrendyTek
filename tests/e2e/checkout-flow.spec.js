import { test, expect } from "@playwright/test";

test.describe("🛒 Critical E-Commerce Checkout Funnel", () => {
  test("User navigates, adds item to cart, fills form, and creates order", async ({ page }) => {
    // 1. Visit Storefront
    await page.goto("http://localhost:5173/");

    // 2. Navigate to Collection
    await page.click("text=COLLECTION");
    await expect(page).toHaveURL(/.*collection/);

    // 3. Open First Product
    const firstProduct = page.locator(".group").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    // 4. Select Size & Add To Cart
    const sizeButton = page.locator("button:has-text('M')").first();
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
    }
    await page.click("button:has-text('ADD TO CART')");

    // 5. Navigate to Cart & Checkout
    await page.click("a[href='/cart']");
    await expect(page).toHaveURL(/.*cart/);
    await page.click("button:has-text('PROCEED TO CHECKOUT')");
    await expect(page).toHaveURL(/.*place-order/);

    // 6. Fill Delivery Details
    await page.fill("input[placeholder='First name']", "John");
    await page.fill("input[placeholder='Last name']", "Doe");
    await page.fill("input[placeholder='Email address']", "johndoe@example.com");
    await page.fill("input[placeholder='Street']", "123 Commercial Way");
    await page.fill("input[placeholder='City']", "Lagos");
    await page.fill("input[placeholder='State']", "Lagos");
    await page.fill("input[placeholder='Zipcode']", "100001");
    await page.fill("input[placeholder='Country']", "Nigeria");
    await page.fill("input[placeholder='Phone']", "08012345678");

    // 7. Select COD & Place Order
    await page.click("p:has-text('CASH ON DELIVERY')");
    await page.click("button:has-text('PLACE ORDER')");

    // 8. Verify Order Confirmation
    await expect(page).toHaveURL(/.*orders/);
    await expect(page.locator("text=MY ORDERS")).toBeVisible();
  });
});