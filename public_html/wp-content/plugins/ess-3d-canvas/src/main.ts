import './styles.css';
import { initScene } from './scene.ts';
import { latLngToRotation } from './geoToRotation.ts';
import { fetchUserLocation } from './geoDetect.ts';
import { latToDeclination, lngToRA, decimalToDMS } from './formatters.ts';

declare global {
  interface Window {
    elementorFrontend?: {
      hooks: {
        addAction: (hook: string, callback: (...args: unknown[]) => void) => void;
      };
    };
  }
}

/** Cached auto-detected location so we only call the API once */
let autoLocationPromise: Promise<{ lat: number; lng: number }> | null = null;

function getAutoLocation(): Promise<{ lat: number; lng: number }> {
  if (!autoLocationPromise) {
    autoLocationPromise = fetchUserLocation();
  }
  return autoLocationPromise;
}

/**
 * Update the "YOU ARE HERE" coordinate texts in the header.
 * Finds Elementor icon-list widgets near the canvas and updates their text.
 */
function updateHeaderCoords(lat: number, lng: number): void {
  // The header has two icon-list widgets with items like "Dec: −3°" and "Lat: 2°54'02" S"
  // We find all icon-list items in the header and match by label prefix
  const iconListItems = document.querySelectorAll<HTMLElement>(
    '.elementor-icon-list-text',
  );

  for (const item of iconListItems) {
    const text = item.textContent?.trim() ?? '';

    if (text.startsWith('Dec:')) {
      item.textContent = `Dec: ${latToDeclination(lat)}`;
    } else if (text.startsWith('AR:')) {
      item.textContent = `AR: ${lngToRA(lng)}`;
    } else if (text.startsWith('Lat:')) {
      item.textContent = `Lat: ${decimalToDMS(lat, true)}`;
    } else if (text.startsWith('Long:')) {
      item.textContent = `Long: ${decimalToDMS(lng, false)}`;
    }
  }
}

async function initCanvas(el: HTMLElement): Promise<void> {
  if (el.dataset.essInit === '1') return;
  el.dataset.essInit = '1';

  const mode = el.dataset.mode || 'auto';
  const shouldUpdateCoords = el.dataset.updateCoords === 'true';

  const ctx = initScene(el);
  await ctx.logo.load();

  if (mode === 'manual') {
    const lat = parseFloat(el.dataset.lat || '0');
    const lng = parseFloat(el.dataset.lng || '0');
    const rot = latLngToRotation(lat, lng);
    ctx.logo.setRotation(rot);
  } else {
    const loc = await getAutoLocation();
    const rot = latLngToRotation(loc.lat, loc.lng);
    ctx.logo.rotateTo(rot);

    if (shouldUpdateCoords) {
      updateHeaderCoords(loc.lat, loc.lng);
    }
  }
}

function initAll(): void {
  const elements = document.querySelectorAll<HTMLElement>('.ess-3d-canvas');
  elements.forEach((el) => {
    initCanvas(el).catch((err) => {
      console.error('ESS 3D Canvas: init failed', err);
    });
  });
}

// Normal page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

// Elementor editor live preview
window.addEventListener('elementor/frontend/init', () => {
  if (window.elementorFrontend) {
    window.elementorFrontend.hooks.addAction(
      'frontend/element_ready/ess_3d_canvas.default',
      () => {
        const elements = document.querySelectorAll<HTMLElement>('.ess-3d-canvas');
        elements.forEach((el) => {
          el.dataset.essInit = '';
        });
        initAll();
      },
    );
  }
});
