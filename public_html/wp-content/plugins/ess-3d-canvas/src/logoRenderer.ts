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

export class LogoRenderer {
  private model: THREE.Group | null = null;
  private pivot: THREE.Group;
  private loader: GLTFLoader;

  constructor(scene: THREE.Scene) {
    this.pivot = new THREE.Group();
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
        const fitScale = 1.8 / maxDim;
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
    gsap.to(this.pivot.rotation, {
      x: BASE_ROTATION.x + target.x,
      y: BASE_ROTATION.y + target.y,
      z: BASE_ROTATION.z + target.z,
      duration: ANIMATION.duration,
      ease: ANIMATION.ease,
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
