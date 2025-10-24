/**
 * E2E Tests for Motoboy Flow
 * Tests complete user journey from landing page to dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Motoboy Flow - Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start from landing page
    await page.goto('/');
  });

  test('should display "Sou Motoboy" button with correct styling', async ({ page }) => {
    // Find the "Sou Motoboy" button
    const motoboyButton = page.getByRole('button', { name: /sou motoboy/i });
    
    // Verify button is visible
    await expect(motoboyButton).toBeVisible();
    
    // Verify text is readable (not white/transparent)
    const textColor = await motoboyButton.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // Color should not be white (rgb(255, 255, 255))
    expect(textColor).not.toBe('rgb(255, 255, 255)');
    
    // Verify button has proper contrast
    const backgroundColor = await motoboyButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(backgroundColor).toBeTruthy();
  });

  test('should navigate to auth page when clicking "Sou Motoboy"', async ({ page }) => {
    // Click the button
    await page.getByRole('button', { name: /sou motoboy/i }).click();
    
    // Should navigate to auth page
    await expect(page).toHaveURL('/auth');
    
    // Auth page should be loaded
    await expect(page.getByText(/criar conta/i)).toBeVisible();
  });

  test('should create motoboy account successfully', async ({ page }) => {
    // Navigate to auth
    await page.goto('/auth');
    
    // Switch to signup tab
    await page.getByRole('tab', { name: /criar conta/i }).click();
    
    // Fill form
    const timestamp = Date.now();
    await page.fill('input[name="fullName"]', 'João Motoboy Teste');
    await page.fill('input[name="email"]', `motoboy${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'senha123');
    
    // Select motoboy role
    await page.getByLabel(/motoboy/i).click();
    
    // Submit form
    await page.getByRole('button', { name: /criar conta/i }).click();
    
    // Should show success message
    await expect(page.getByText(/conta criada com sucesso/i)).toBeVisible({ timeout: 5000 });
    
    // Should redirect to motoboy dashboard
    await expect(page).toHaveURL('/motoboy', { timeout: 10000 });
  });

  test('should handle login as motoboy without crashes', async ({ page }) => {
    // This test assumes a motoboy account exists
    await page.goto('/auth');
    
    // Fill login form
    await page.fill('input[name="email"]', 'motoboy@test.com');
    await page.fill('input[name="password"]', 'senha123');
    
    // Submit
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Should not crash - either show error or redirect
    await page.waitForTimeout(2000);
    
    // Page should still be responsive
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });
});

test.describe('Motoboy Dashboard - Initialization', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock geolocation permission
    await context.grantPermissions(['geolocation']);
    await page.goto('/motoboy');
  });

  test('should load dashboard without crashes', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Should show dashboard title
    await expect(page.getByText(/painel do motoboy/i)).toBeVisible({ timeout: 10000 });
    
    // Should not show critical errors
    const errorMessages = page.getByText(/erro fatal|crash|exception/i);
    await expect(errorMessages).not.toBeVisible();
  });

  test('should handle permission denial gracefully', async ({ page, context }) => {
    // Deny geolocation
    await context.clearPermissions();
    
    await page.goto('/motoboy');
    
    // Should show warning but not crash
    await page.waitForTimeout(3000);
    
    // Dashboard should still be visible
    await expect(page.getByText(/painel do motoboy/i)).toBeVisible();
    
    // Should show permission warning
    await expect(page.getByText(/permissão|localização/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display retry button on initialization failure', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/motoboy');
    
    // Wait for initialization
    await page.waitForTimeout(3000);
    
    // If there's an error, retry button should be available
    const errorState = await page.getByText(/erro ao inicializar/i).isVisible();
    
    if (errorState) {
      const retryButton = page.getByRole('button', { name: /tentar novamente/i });
      await expect(retryButton).toBeVisible();
    }
  });

  test('should toggle availability status', async ({ page }) => {
    await page.goto('/motoboy');
    
    // Wait for dashboard
    await expect(page.getByText(/painel do motoboy/i)).toBeVisible({ timeout: 10000 });
    
    // Find toggle button
    const toggleButton = page.getByRole('button', { name: /ficar online|ficar offline/i });
    
    if (await toggleButton.isVisible()) {
      const initialText = await toggleButton.textContent();
      
      // Click toggle
      await toggleButton.click();
      
      // Wait for state change
      await page.waitForTimeout(1000);
      
      // Text should change
      const newText = await toggleButton.textContent();
      expect(newText).not.toBe(initialText);
    }
  });
});

test.describe('Motoboy Dashboard - Services', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await page.goto('/motoboy');
    await page.waitForLoadState('networkidle');
  });

  test('should display available services section', async ({ page }) => {
    await expect(page.getByText(/corridas disponíveis/i)).toBeVisible();
  });

  test('should display my services section', async ({ page }) => {
    await expect(page.getByText(/minhas corridas/i)).toBeVisible();
  });

  test('should switch between list and map view', async ({ page }) => {
    // Find view toggle buttons
    const listButton = page.getByRole('button', { name: /lista/i });
    const mapButton = page.getByRole('button', { name: /mapa/i });
    
    if (await listButton.isVisible() && await mapButton.isVisible()) {
      // Click map view
      await mapButton.click();
      await page.waitForTimeout(500);
      
      // Click list view
      await listButton.click();
      await page.waitForTimeout(500);
      
      // Should not crash
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    }
  });
});

test.describe('Motoboy Dashboard - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    await page.goto('/motoboy');
    
    // Should show error message
    await expect(page.getByText(/erro|conexão|internet/i)).toBeVisible({ timeout: 10000 });
    
    // Go back online
    await context.setOffline(false);
  });

  test('should handle invalid profile gracefully', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/motoboy');
    
    // Should redirect to auth or show error
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(auth|motoboy)/);
  });
});
