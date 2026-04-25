import './styles.css';
import gsap from 'gsap';
import { initScene, type SceneContext } from './scene.ts';
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

/** Store scene contexts so we can replay animations */
const sceneMap = new WeakMap<HTMLElement, SceneContext>();

function attachHoverListeners(el: HTMLElement, ctx: SceneContext): void {
  // Prevent browser scroll/gestures so touch drag works on the canvas
  el.style.touchAction = 'none';

  let dragging = false;

  const calcOffset = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    ctx.logo.applyHoverOffset(nx, ny);
  };

  // --- Hover (mouse only, no click needed) ---
  el.addEventListener('pointermove', (e: PointerEvent) => {
    if (dragging) return; // click-drag takes priority
    if (e.pointerType !== 'mouse') return;
    calcOffset(e);
  });

  el.addEventListener('pointerleave', (e: PointerEvent) => {
    if (dragging) return;
    if (e.pointerType !== 'mouse') return;
    ctx.logo.returnToHome();
  });

  // --- Click-drag (mouse) / Touch-drag (mobile) ---
  el.addEventListener('pointerdown', (e: PointerEvent) => {
    dragging = true;
    el.setPointerCapture(e.pointerId); // track pointer anywhere on page
  });

  el.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    calcOffset(e);
  });

  const stopDrag = () => {
    if (!dragging) return;
    dragging = false;
    ctx.logo.returnToHome();
  };

  el.addEventListener('pointerup', stopDrag);
  el.addEventListener('pointercancel', stopDrag);
}

/**
 * Update the "YOU ARE HERE" coordinate texts in the header.
 */
function updateHeaderCoords(lat: number, lng: number): void {
  const iconLists = document.querySelectorAll<HTMLElement>(
    '.elementor-icon-list-items',
  );

  if (iconLists.length < 2) return;

  const list1Items = iconLists[0].querySelectorAll<HTMLElement>('.elementor-icon-list-text');
  const list2Items = iconLists[1].querySelectorAll<HTMLElement>('.elementor-icon-list-text');

  const proxy = { lat: 0, lng: 0 };

  gsap.to(proxy, {
    lat,
    lng,
    duration: 1.4,
    ease: 'power2.out',
    onUpdate() {
      if (list1Items[0]) list1Items[0].textContent = `Dec: ${latToDeclination(proxy.lat)}`;
      if (list1Items[1]) list1Items[1].textContent = `AR: ${lngToRA(proxy.lng)}`;
      if (list2Items[0]) list2Items[0].textContent = `Lat: ${decimalToDMS(proxy.lat, true)}`;
      if (list2Items[1]) list2Items[1].textContent = `Long: ${decimalToDMS(proxy.lng, false)}`;
    },
  });
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
  sceneMap.set(el, ctx);
  attachHoverListeners(el, ctx);
  await ctx.logo.load();

  let rot: import('./geoToRotation.ts').Rotation3D;

  if (mode === 'manual') {
    const lat = parseFloat(el.dataset.lat || '0');
    const lng = parseFloat(el.dataset.lng || '0');
    rot = latLngToRotation(lat, lng);
  } else {
    const loc = await getAutoLocation();
    rot = latLngToRotation(loc.lat, loc.lng);

    if (shouldUpdateCoords) {
      updateHeaderCoords(loc.lat, loc.lng);
    }
  }

  // Animate when the canvas scrolls into view (not before)
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        ctx.logo.rotateTo(rot);
        observer.disconnect();
      }
    },
    { threshold: 0 },
  );
  observer.observe(el);
}

/** Replay the rotation animation on an already-initialized canvas */
function replayAnimation(el: HTMLElement): void {
  const ctx = sceneMap.get(el);
  if (!ctx) return;

  const lat = parseFloat(el.dataset.lat || '0');
  const lng = parseFloat(el.dataset.lng || '0');
  const rot = latLngToRotation(lat, lng);

  // Reset to zero first, then animate to target
  ctx.logo.setRotation({ x: 0, y: 0, z: 0 });
  ctx.logo.rotateTo(rot);
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
 * When a <details> opens:
 *  - If canvas not yet initialized → init it (first open)
 *  - If already initialized → replay the rotation animation
 */
function watchAccordions(): void {
  document.addEventListener('toggle', (e) => {
    const details = e.target as HTMLDetailsElement;
    if (!details || details.tagName !== 'DETAILS' || !details.open) return;

    setTimeout(() => {
      const canvases = details.querySelectorAll<HTMLElement>('.ess-3d-canvas');
      canvases.forEach((el) => {
        if (el.dataset.essInit === '1') {
          // Already initialized — replay the animation
          replayAnimation(el);
        } else {
          // First time opening — initialize
          initCanvas(el).catch((err) => {
            console.error('ESS 3D Canvas: init failed', err);
          });
        }
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
