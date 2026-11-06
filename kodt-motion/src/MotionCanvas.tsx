import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type Props = { time: number; playing: boolean; started: boolean };

const SEGMENTS = 160;
const SIDES = 20;
const TAU = Math.PI * 2;
const smooth = (start: number, end: number, value: number) => {
  const t = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

function makeGeometry() {
  const geometry = new THREE.BufferGeometry();
  const count = (SEGMENTS + 1) * (SIDES + 1) * 3;
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count), 3));
  const indices: number[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    for (let j = 0; j < SIDES; j++) {
      const a = i * (SIDES + 1) + j;
      const b = (i + 1) * (SIDES + 1) + j;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  geometry.setIndex(indices);
  return geometry;
}

// Both closed circles continuously reshape into the two connected lobes of an infinity curve.
function reshape(geometry: THREE.BufferGeometry, sign: number, morph: number, separation: number) {
  const positions = geometry.attributes.position.array as Float32Array;
  const normals = geometry.attributes.normal.array as Float32Array;
  const point = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const behind = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const surfaceNormal = new THREE.Vector3();
  const sample = (u: number, target: THREE.Vector3) => {
    const circleX = sign * (separation - 1.12 * Math.cos(TAU * u));
    const circleY = 1.12 * Math.sin(TAU * u);
    target.set(
      THREE.MathUtils.lerp(circleX, sign * 2.85 * Math.sin(Math.PI * u), morph),
      THREE.MathUtils.lerp(circleY, 1.24 * Math.sin(TAU * u), morph),
      morph * sign * 0.36 * Math.cos(Math.PI * u),
    );
  };
  let index = 0;
  for (let i = 0; i <= SEGMENTS; i++) {
    const u = i / SEGMENTS;
    sample(u, point);
    sample(u + 0.0001, ahead);
    sample(u - 0.0001, behind);
    tangent.subVectors(ahead, behind).normalize();
    normal.set(-tangent.y, tangent.x, 0).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    for (let j = 0; j <= SIDES; j++) {
      const angle = (j / SIDES) * TAU;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const width = 0.245;
      const depth = 0.3;
      positions[index] = point.x + normal.x * c * width + binormal.x * s * depth;
      positions[index + 1] = point.y + normal.y * c * width + binormal.y * s * depth;
      positions[index + 2] = point.z + normal.z * c * width + binormal.z * s * depth;
      surfaceNormal.copy(normal).multiplyScalar(c / width).addScaledVector(binormal, s / depth).normalize();
      normals[index] = surfaceNormal.x;
      normals[index + 1] = surfaceNormal.y;
      normals[index + 2] = surfaceNormal.z;
      index += 3;
    }
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.normal.needsUpdate = true;
  geometry.computeBoundingSphere();
}

export function MotionCanvas({ time, playing, started }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const values = useRef({ time, playing, started });
  const [failed, setFailed] = useState(false);
  useEffect(() => { values.current = { time, playing, started }; }, [time, playing, started]);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-10, 10, 3.4, -3.4, 0.1, 100);
    camera.position.set(0, 0, 15);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    scene.add(new THREE.HemisphereLight(0xfffcf5, 0x9d8580, 2.2));
    const key = new THREE.DirectionalLight(0xfff8eb, 3.7);
    key.position.set(-4, 7, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1.6);
    fill.position.set(5, 1, 5);
    scene.add(fill);

    const material = new THREE.MeshPhysicalMaterial({
      color: '#cc4a21', metalness: 0.18, roughness: 0.3,
      clearcoat: 0.5, clearcoatRoughness: 0.32, envMapIntensity: 0.65,
      side: THREE.DoubleSide,
    });
    const technologyMaterial = material.clone();
    const geometries = [makeGeometry(), makeGeometry()];
    const human = new THREE.Mesh(geometries[0], material);
    const technology = new THREE.Mesh(geometries[1], technologyMaterial);
    const sculpture = new THREE.Group();
    sculpture.add(human, technology);
    const group = new THREE.Group();
    group.add(sculpture);
    scene.add(group);
    const orbGeometry = new THREE.SphereGeometry(0.24, 40, 32);
    const orb = new THREE.Mesh(orbGeometry, material);
    group.add(orb);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const shadowContext = shadowCanvas.getContext('2d')!;
    const gradient = shadowContext.createRadialGradient(128, 64, 0, 128, 64, 100);
    gradient.addColorStop(0, 'rgba(67, 45, 29, 0.24)');
    gradient.addColorStop(0.45, 'rgba(67, 45, 29, 0.1)');
    gradient.addColorStop(1, 'rgba(67, 45, 29, 0)');
    shadowContext.fillStyle = gradient;
    shadowContext.fillRect(0, 0, 256, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadowGeometry = new THREE.PlaneGeometry(7.3, 1.1);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.position.set(0, -2.5, -1.5);
    scene.add(shadow);

    let compact = false;
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      compact = width <= 650;
      const halfHeight = compact ? 4.25 : 3.4;
      const halfWidth = halfHeight * width / height;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    };
    const resetPointer = () => { pointer.x = 0; pointer.y = 0; };
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', resetPointer);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(container);
    const onContextLost = (event: Event) => { event.preventDefault(); setFailed(true); };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    let frame = 0;
    let previousShape = '';
    const orange = new THREE.Color('#cc4a21');
    const sage = new THREE.Color('#85948a');

    const render = (milliseconds: number) => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      const props = values.current;
      const t = props.started ? props.time : 48;
      const ambientTime = props.started ? props.time * 1000 : milliseconds;
      const morph = smooth(26, 31, t);
      const second = smooth(14, 17.5, t);
      const final = smooth(42.5, 47.5, t);
      let separation = 1.95;
      if (t >= 19 && t < 26) separation = 1.6 + Math.cos((t - 19) * 1.7) * 0.48;
      const shapeKey = `${morph.toFixed(4)}-${separation.toFixed(4)}`;
      if (shapeKey !== previousShape) {
        reshape(geometries[0], -1, morph, separation);
        reshape(geometries[1], 1, morph, separation);
        previousShape = shapeKey;
      }
      human.position.x = separation * (1 - second) * (1 - morph);
      human.scale.setScalar(0.015 + 0.985 * smooth(0.2, 3.7, t));
      technology.visible = t >= 14;
      technology.scale.setScalar(Math.max(0.001, second));
      technologyMaterial.color.copy(sage).lerp(orange, morph);
      const rotation = smooth(36, 42, t) * Math.PI / 4;
      const idle = reducedMotion ? 0 : Math.sin(ambientTime * 0.00055) * 0.025;
      sculpture.rotation.z = rotation + idle;
      sculpture.rotation.x = t >= 9 && t < 14 ? Math.sin((t - 9) * 1.1) * 0.5 : 0;
      sculpture.rotation.y = t >= 9 && t < 14 ? Math.sin((t - 9) * 1.3) * 0.5 : 0;
      group.position.x = compact ? 0 : -2.8 * final;
      group.position.y = compact ? 1.0 * final : 0.12;
      group.scale.setScalar(1 - final * (compact ? 0.2 : 0.07));
      if (!reducedMotion) {
        group.position.y += Math.sin(ambientTime * 0.0008) * 0.065;
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, pointer.x * 0.2, 0.035);
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pointer.y * 0.1, 0.035);
      }
      const orbProgress = smooth(42, 46, t);
      orb.visible = orbProgress > 0;
      orb.scale.setScalar(Math.max(0.001, orbProgress));
      orb.position.set(1.9, 2.38 + orbProgress * 0.1, 0.05);
      shadow.position.x = group.position.x;
      shadow.position.y = compact ? -1.2 : -2.5;
      shadow.scale.x = t < 14 ? 0.6 : 1;
      shadowMaterial.opacity = (t < 3.7 ? smooth(0, 3.7, t) : 1) * 0.85;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', resetPointer);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      geometries.forEach((geometry) => geometry.dispose());
      orbGeometry.dispose();
      shadowGeometry.dispose();
      material.dispose();
      technologyMaterial.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="motion-art" role="img" aria-label="두 원이 만나 무한대가 되고, 45도 회전하여 새로운 가능성을 만드는 KoDT 3D 로고 모션">
      <div ref={host} className={`webgl-host ${failed ? 'is-unavailable' : ''}`} />
      {failed && <FallbackMotion time={started ? time : 48} />}
    </div>
  );
}

function FallbackMotion({ time }: { time: number }) {
  const morph = smooth(26, 31, time);
  const final = smooth(42.5, 47.5, time);
  return (
    <svg viewBox="0 0 1200 430" className="motion-fallback" aria-hidden="true">
      <defs>
        <linearGradient id="fallback-copper" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fa945e" /><stop offset=".4" stopColor="#d65a2e" /><stop offset=".75" stopColor="#a93918" /><stop offset="1" stopColor="#e57a47" /></linearGradient>
        <filter id="fallback-shadow"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <g className="fallback-sculpture" transform={`translate(${600 - 170 * final} 210)`}>
        <ellipse cy="148" rx="145" ry="9" fill="#80634c" opacity=".13" filter="url(#fallback-shadow)" />
        <g transform={`rotate(${-45 * smooth(36, 42, time)})`} fill="none" stroke="url(#fallback-copper)" strokeWidth="27">
          {morph < 0.9 ? <><circle cx={time >= 14 ? -93 : 0} r="65" opacity={smooth(0, 3.7, time)} /><circle cx="93" r={65 * smooth(14, 18, time)} /></> : <path d="M0 0 C-65 -105 -180 -100 -180 0 C-180 100 -65 105 0 0 C65 -105 180 -100 180 0 C180 100 65 105 0 0Z" />}
        </g>
        <circle cx="112" cy="-157" r={14 * smooth(42, 46, time)} fill="url(#fallback-copper)" />
      </g>
    </svg>
  );
}