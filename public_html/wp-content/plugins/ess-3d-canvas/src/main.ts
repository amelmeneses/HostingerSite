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
 */
function updateHeaderCoords(lat: number, lng: number): void {
  const iconLists = document.querySelectorAll<HTMLElement>(
    '.elementor-icon-list-items',
  );

  if (iconLists.length >= 2) {
    const list1Items = iconLists[0].querySelectorAll<HTMLElement>('.elementor-icon-list-text');
    if (list1Items[0]) list1Items[0].textContent = `Dec: ${latToDeclination(lat)}`;
    if (list1Items[1]) list1Items[1].textContent = `AR: ${lngToRA(lng)}`;

    const list2Items = iconLists[1].querySelectorAll<HTMLElement>('.elementor-icon-list-text');
    if (list2Items[0]) list2Items[0].textContent = `Lat: ${decimalToDMS(lat, true)}`;
    if (list2Items[1]) list2Items[1].textContent = `Long: ${decimalToDMS(lng, false)}`;
  }
}

async function initCanvas(el: HTMLElement): Promise<void> {
  if (el.dataset.essInit === '1') return;

  // Skip if container has no dimensions (hidden in accordion)
  if (el.clientWidth === 0 || el.clientHeight === 0) return;

  el.dataset.essInit = '1';

  const mode = el.dataset.mode || 'auto';
  const shouldUpdateCoords = el.dataset.updateCoords === 'true';
  const scale = parseFloat(el.dataset.scale || '1') || 1;

  const ctx = initScene(el, scale);
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

function initVisible(): void {
  const elements = document.querySelectorAll<HTMLElement>('.ess-3d-canvas');
  elements.forEach((el) => {
    initCanvas(el).catch((err) => {
      console.error('ESS 3D Canvas: init failed', err);
    });
  });
}

/**
 * Watch for accordion items being opened (Elementor nested accordion uses <details>).
 * When a <details> opens, init any uninitialized canvases inside it.
 */
function watchAccordions(): void {
  document.addEventListener('toggle', (e) => {
    const details = e.target as HTMLDetailsElement;
    if (!details || details.tagName !== 'DETAILS' || !details.open) return;

    // Small delay to let the accordion animate and get dimensions
    setTimeout(() => {
      const canvases = details.querySelectorAll<HTMLElement>('.ess-3d-canvas');
      canvases.forEach((el) => {
        initCanvas(el).catch((err) => {
          console.error('ESS 3D Canvas: init failed', err);
        });
      });
    }, 100);
  }, true);
}

// Normal page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initVisible();
    watchAccordions();
  });
} else {
  initVisible();
  watchAccordions();
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
        initVisible();
      },
    );
  }
});
