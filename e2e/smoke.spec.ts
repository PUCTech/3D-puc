import { test, expect } from '@playwright/test';
import campus from '../data/campus.json';

const first = campus.buildings[0];

for (const locale of ['pt', 'en'] as const) {
  test(`${locale}: loads with search and locale switch`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-BR' : 'en');
    await expect(page.getByRole('searchbox')).toBeVisible();
    await expect(page.getByRole('link', { name: locale === 'pt' ? 'Ver em inglês' : 'Ver em português' })).toBeVisible();
  });
}

test('?b=<id> opens that building sheet', async ({ page }) => {
  await page.goto(`/pt?b=${first.id}`);
  await expect(page.getByTestId('building-sheet').getByRole('heading', { level: 2 })).toHaveText(first.name.pt);
});

test('unknown ?b= shows the overview without a sheet', async ({ page }) => {
  await page.goto('/pt?b=does-not-exist');
  await expect(page.getByRole('searchbox')).toBeVisible();
  await expect(page.getByTestId('building-sheet')).toHaveCount(0);
});

test('building list shows every building and selecting one opens its sheet', async ({ page }) => {
  await page.goto('/pt');
  await page.getByRole('button', { name: 'Lista de prédios' }).click();
  await expect(page.getByTestId('building-list-item')).toHaveCount(campus.buildings.length);
  await page.getByTestId('building-list-item').filter({ hasText: new RegExp(`^${first.name.pt}$`) }).click();
  await expect(page).toHaveURL(new RegExp(`b=${first.id}$`));
  await expect(page.getByTestId('building-sheet')).toBeVisible();
});

test('closing the sheet clears the selection', async ({ page }) => {
  await page.goto(`/pt?b=${first.id}`);
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByTestId('building-sheet')).toHaveCount(0);
  await expect(page).not.toHaveURL(/b=/);
});

test('locale switch keeps the selected building', async ({ page }) => {
  await page.goto(`/pt?b=${first.id}`);
  await page.getByRole('link', { name: 'Ver em inglês' }).click();
  await expect(page).toHaveURL(new RegExp(`/en\\?b=${first.id}$`));
  await expect(page.getByTestId('building-sheet').getByRole('heading', { level: 2 })).toHaveText(first.name.en);
});

test('without WebGL the building list is shown', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test stub
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      return type.startsWith('webgl') ? null : orig.call(this, type, ...rest);
    };
  });
  await page.goto('/pt');
  await expect(page.getByTestId('building-list')).toBeVisible();
  await expect(page.getByTestId('building-list-item')).toHaveCount(campus.buildings.length);
});

test('search ignores accents', async ({ page }) => {
  await page.goto('/pt');
  await page.getByRole('searchbox').fill('predio');
  await expect(page.getByRole('button', { name: first.name.pt, exact: true })).toBeVisible();
});

test('if the 3D scene fails after the WebGL check, the building list still works', async ({ page }) => {
  await page.addInitScript(() => {
    // The first WebGL request (the support check) succeeds; the renderer's own request fails.
    let calls = 0;
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test stub
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl') && calls++ > 0) return null;
      return orig.call(this, type, ...rest);
    };
  });
  await page.goto('/pt');
  await expect(page.getByTestId('building-list')).toBeVisible();
  await page.getByTestId('building-list-item').filter({ hasText: new RegExp(`^${first.name.pt}$`) }).click();
  await expect(page.getByTestId('building-sheet')).toBeVisible();
});

test('picking a building moves focus to its sheet and Escape closes it', async ({ page }) => {
  await page.goto('/pt');
  await page.getByRole('button', { name: 'Lista de prédios' }).click();
  await page.getByTestId('building-list-item').filter({ hasText: new RegExp(`^${first.name.pt}$`) }).click();
  await expect(page.getByTestId('building-sheet').getByRole('heading', { level: 2 })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('building-sheet')).toHaveCount(0);
});

test('Escape closes the building list', async ({ page }) => {
  await page.goto('/pt');
  await page.getByRole('button', { name: 'Lista de prédios' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('building-list')).toHaveCount(0);
});

test('search results are announced to screen readers', async ({ page }) => {
  await page.goto('/pt');
  await page.getByRole('searchbox').fill('xyz');
  await expect(page.getByRole('status')).toHaveText('Nenhum prédio encontrado');
});

test('picking a search result dismisses the keyboard', async ({ page }) => {
  await page.goto('/pt');
  // Enter keeps focus in the input, like a tap on iOS (where buttons don't take focus).
  await page.getByRole('searchbox').fill(first.name.pt);
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByTestId('building-sheet')).toBeVisible();
  await expect(page.getByRole('searchbox')).not.toBeFocused();
});

test('map labels follow the page language', async ({ page }) => {
  const tall = campus.buildings.find((b) => b.floors.reduce((s, f) => s + f.height, 0) >= 10)!;
  await page.goto(`/en?b=${tall.id}`);
  await expect(page.getByTestId('building-label').filter({ hasText: new RegExp(`^${tall.name.en}$`) })).toHaveCount(1);
});
