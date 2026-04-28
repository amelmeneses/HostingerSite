import * as THREE from 'three';
import { createLights } from './lights.ts';
import { LogoRenderer } from './logoRenderer.ts';

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  logo: LogoRenderer;
  dispose: () => void;
}

export function initScene(container: HTMLElement, scale = 1): SceneContext {
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) existingCanvas.remove();

  const w = container.clientWidth || 100;
  const h = container.clientHeight || 100;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
  camera.position.set(0, 0, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  container.appendChild(renderer.domElement);

  scene.add(createLights());

  const logo = new LogoRenderer(scene, scale);

  let rafId: number;
  function animate() {
    rafId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  const onResize = () => {
    const cw = container.clientWidth || 100;
    const ch = container.clientHeight || 100;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch);
  };
  window.addEventListener('resize', onResize);

  const dispose = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { renderer, scene, camera, logo, dispose };
}
