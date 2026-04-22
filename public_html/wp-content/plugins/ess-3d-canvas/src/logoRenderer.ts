import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import type { Rotation3D } from './geoToRotation.ts';

declare global {
  interface Window {
    ess3dCanvasConfig?: { modelPath: string };
  }
}

const MODEL_PATH = window.ess3dCanvasConfig?.modelPath ?? '/models/logo.glb';

const BASE_ROTATION = { x: 0, y: 0, z: 0 };

const ANIMATION = {
  duration: 1.4,
  ease: 'power3.inOut',
} as const;

const HOVER = {
  maxPitch: 0.26,   // ±15° in radians
  maxYaw: 0.35,     // ±20° in radians
  trackDuration: 0.15,
  returnDuration: 0.6,
  returnEase: 'power2.out',
} as const;

export class LogoRenderer {
  private model: THREE.Group | null = null;
  private pivot: THREE.Group;
  private loader: GLTFLoader;
  private userScale: number;
  private homeRotation: Rotation3D = { x: 0, y: 0, z: 0 };

  constructor(scene: THREE.Scene, scale = 1) {
    this.pivot = new THREE.Group();
    this.userScale = scale;
    scene.add(this.pivot);
    this.loader = new GLTFLoader();
  }

  async load(): Promise<void> {
    try {
      const gltf = await this.loader.loadAsync(MODEL_PATH);
      this.model = gltf.scene;

      // Center the model
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      this.model.position.sub(center);

      // Fit model to a reasonable visual size
      box.setFromObject(this.model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const fitScale = (1.8 * this.userScale) / maxDim;
        this.model.scale.multiplyScalar(fitScale);
      }

      // Base rotation
      this.pivot.rotation.set(BASE_ROTATION.x, BASE_ROTATION.y, BASE_ROTATION.z);

      // Force bright white material
      this.model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.color = new THREE.Color(0xffffff);
            mat.metalness = 0.0;
            mat.roughness = 0.4;
            mat.emissive = new THREE.Color(0x222222);
            mat.emissiveIntensity = 0.3;
          }
        }
      });

      this.pivot.add(this.model);
    } catch (err) {
      console.error('ESS 3D Canvas: Failed to load GLB model:', err);
      this.createFallback();
    }
  }

  private createFallback(): void {
    const geo = new THREE.TorusKnotGeometry(0.7, 0.25, 100, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    this.pivot.add(mesh);
  }

  rotateTo(target: Rotation3D): void {
    this.homeRotation = { ...target };
    gsap.to(this.pivot.rotation, {
      x: BASE_ROTATION.x + target.x,
      y: BASE_ROTATION.y + target.y,
      z: BASE_ROTATION.z + target.z,
      duration: ANIMATION.duration,
      ease: ANIMATION.ease,
      overwrite: true,
    });
  }

  applyHoverOffset(nx: number, ny: number): void {
    gsap.to(this.pivot.rotation, {
      x: BASE_ROTATION.x + this.homeRotation.x + ny * HOVER.maxPitch,
      y: BASE_ROTATION.y + this.homeRotation.y + nx * HOVER.maxYaw,
      z: BASE_ROTATION.z + this.homeRotation.z,
      duration: HOVER.trackDuration,
      overwrite: true,
    });
  }

  returnToHome(): void {
    gsap.to(this.pivot.rotation, {
      x: BASE_ROTATION.x + this.homeRotation.x,
      y: BASE_ROTATION.y + this.homeRotation.y,
      z: BASE_ROTATION.z + this.homeRotation.z,
      duration: HOVER.returnDuration,
      ease: HOVER.returnEase,
      overwrite: true,
    });
  }

  setRotation(target: Rotation3D): void {
    this.pivot.rotation.set(
      BASE_ROTATION.x + target.x,
      BASE_ROTATION.y + target.y,
      BASE_ROTATION.z + target.z,
    );
  }
}
