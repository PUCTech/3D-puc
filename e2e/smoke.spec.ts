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
