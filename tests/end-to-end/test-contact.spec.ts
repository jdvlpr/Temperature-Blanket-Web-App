import { expect, test } from '@playwright/test';

test.describe('Contact Page', () => {
  test('Page loads and displays email', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    
    // The email is generated via JS, so we wait for it.
    // Assuming PUBLIC_BASE_DOMAIN_NAME is set in the environment or defaults are used.
    // We look for the mail icon or the link containing 'mailto:'
    const emailLink = page.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
    
    // Verify it's not "Loading..."
    await expect(emailLink).not.toHaveText('Loading...');
    
    // Optional: Check for specific text if we know the domain, but just checking it's loaded is good for now.
    const emailText = await emailLink.textContent();
    expect(emailText).toContain('@');
  });
});
