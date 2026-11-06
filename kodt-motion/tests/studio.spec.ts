import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function seek(page: Page, time: number) {
  await page.getByRole('slider', { name: '모션 재생 위치' }).evaluate((element, value) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, time);
}

test('brand, 3D artwork, and responsive layouts render without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('KoDT.');
  await expect(page.locator('.webgl-host canvas')).toHaveCount(1);
  await expect(page.locator('.scene-button')).toHaveCount(9);
  for (const width of [1440, 1024, 768, 650, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(180);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeVisible();
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('link', { name: '음악 레퍼런스', exact: true }).click();
  await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('motion playback, pause, seeking, mute, repeat, and fullscreen work', async ({ page }) => {
  await page.goto('/');
  const slider = page.getByRole('slider', { name: '모션 재생 위치' });
  await page.getByRole('button', { name: '모션 재생', exact: true }).click();
  await expect(page.getByRole('button', { name: '모션 일시 정지', exact: true })).toBeVisible();
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(0.7);
  await page.getByRole('button', { name: '모션 일시 정지', exact: true }).click();
  const paused = Number(await slider.inputValue());
  await page.waitForTimeout(400);
  expect(Number(await slider.inputValue())).toBeCloseTo(paused, 1);
  await seek(page, 28);
  await expect(slider).toHaveValue('28');
  await expect(page.locator('.play-description')).toContainText('06. 무한한 연결');
  await page.getByRole('button', { name: '소리 끄기', exact: true }).click();
  await expect(page.getByRole('button', { name: '소리 켜기', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '반복 재생', exact: true }).click();
  await seek(page, 47.5);
  await page.getByRole('button', { name: '모션 재생', exact: true }).click();
  await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(2);
  await expect(page.getByRole('button', { name: '모션 일시 정지', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '반복 재생', exact: true }).click();
  await page.waitForTimeout(300);
  await expect(page.getByRole('button', { name: '모션 일시 정지', exact: true })).toBeVisible();
  expect(Number(await slider.inputValue())).toBeLessThan(3);
  await page.getByRole('button', { name: '모션 일시 정지', exact: true }).click();
  await page.getByRole('button', { name: '전체 화면', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.evaluate(() => document.exitFullscreen());
});

test('storyboard navigation, focus-safe notes, scene jumps, and guide download work', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '다음 장면 보기' }).click();
  await expect.poll(() => page.locator('.storyboard-track').evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
  const scene = page.getByRole('button', { name: /^6번 장면/ });
  await scene.click();
  await expect(scene).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('slider')).toHaveValue('26.35');
  await page.getByRole('button', { name: '모션 재생', exact: true }).click();
  await page.getByRole('button', { name: '프로젝트 노트', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('tab', { name: '사운드 노트' }).click();
  await page.waitForTimeout(300);
  await expect(page.getByRole('tab', { name: '사운드 노트' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('69 BPM');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: '프로젝트 가이드' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('KoDT-motion-sound-guide.txt');
  const guidePath = testInfo.outputPath('guide.txt');
  await download.saveAs(guidePath);
  const guide = await readFile(guidePath, 'utf8');
  expect(guide).toContain('09. 가능성의 시작');
  expect(guide).toContain('69 BPM');
  await page.getByRole('tab', { name: '모션 디렉션' }).click();
  await page.locator('.notes-scenes button').nth(7).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('slider')).toHaveValue('36.35');
  await page.getByRole('button', { name: '프로젝트 노트', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('all sound previews play and a complete non-silent WAV can be downloaded', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const name of ['A Quiet Beginning', 'A New Connection', 'Beyond Together']) {
    await page.getByRole('button', { name: `${name} 미리 듣기`, exact: true }).click();
    const pause = page.getByRole('button', { name: `${name} 일시 정지`, exact: true });
    await expect(pause).toBeVisible();
    await expect.poll(() => page.locator('.sound-track.is-playing .waveform .is-filled').count()).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: `${name} 선택됨`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await pause.click();
  }
  await page.getByRole('button', { name: 'A Quiet Beginning 사운드 선택', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '사운드 다운로드', exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('KoDT-piano-sound-sketch.wav');
  const filePath = testInfo.outputPath('sound.wav');
  await download.saveAs(filePath);
  const buffer = await readFile(filePath);
  expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buffer.toString('ascii', 8, 12)).toBe('WAVE');
  const sampleRate = buffer.readUInt32LE(24);
  const channels = buffer.readUInt16LE(22);
  expect((buffer.length - 44) / (sampleRate * channels * 2)).toBe(48);
  let peak = 0;
  for (let i = 44; i < buffer.length; i += 2) peak = Math.max(peak, Math.abs(buffer.readInt16LE(i)) / 32768);
  expect(peak).toBeGreaterThan(0.05);
  expect(peak).toBeLessThan(0.98);
});

test('vector fallback preserves the preview when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.motion-fallback')).toBeVisible();
  await seek(page, 31);
  await expect(page.locator('.play-description')).toContainText('07. 함께하는 진화');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.motion-fallback')).toBeVisible();
});