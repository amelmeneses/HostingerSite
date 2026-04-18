import * as THREE from 'three';

export function createLights(): THREE.Group {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  group.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2, 3, 5);
  group.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 1.0);
  fill.position.set(-4, 2, 3);
  group.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(0, -2, -4);
  group.add(rim);

  return group;
}
