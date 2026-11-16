import React from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { Bx, Cy, Glow, Sp, rnd, useTex, type V3 } from "../kit/three";

/** Set: a mountain road at night in a snow storm.
 *  Plan (metres): road runs along z at x=0 (width 4, mostly snowed over), ground y=0.
 *    CAR parked on the road at x=1.0, z=0, nose toward +z (headlights at z≈+2.1).
 *    MOUND (a snow bank you can sit on, seat 0.45 m) at x=3.2, z=1.5, right of the car.
 *    LIE = where "ผม" lies in the first timeline, x=4.3, z=1.9 (beside the mound, head toward -z).
 *    PATH = Juinor's footprints: from (3.4, 0.4) out to (9.5, -24) and they STOP there (EP2 hook).
 *    Pines everywhere except the road and the path. Fog + falling snow make depth. */
export const CAR: V3 = [1.0, 0, 0];
export const MOUND: V3 = [3.2, 0, 1.5];
export const LIE: V3 = [4.3, 0, 1.9];
export const PATH_A: V3 = [3.4, 0, 0.4];
export const PATH_B: V3 = [9.5, 0, -24];
export const PATH_LEN = Math.hypot(PATH_B[0] - PATH_A[0], PATH_B[2] - PATH_A[2]);
/** point on the path at distance d (metres) from its start */
export const onPath = (d: number): V3 => {
  const k = d / PATH_LEN;
  return [PATH_A[0] + (PATH_B[0] - PATH_A[0]) * k, 0, PATH_A[2] + (PATH_B[2] - PATH_A[2]) * k];
};
export const PATH_RY = Math.atan2(PATH_B[0] - PATH_A[0], PATH_B[2] - PATH_A[2]);

const SNOW = "#DCE4EE", SNOW2 = "#C9D3E0", ROAD = "#AEB8C6", PINE = "#1F3A36", PINE2 = "#264640", BARK = "#3A2A22", CARC = "#2F4A44";

const Pine: React.FC<{ p: V3; s: number }> = ({ p, s }) => (
  <group position={p} scale={s}>
    <Cy p={[0, 0.3, 0]} r={0.09} h={0.6} c={BARK} />
    {[0, 1, 2, 3].map((i) => (
      <group key={i}>
        <mesh position={[0, 0.9 + i * 0.62, 0]}><coneGeometry args={[1.05 - i * 0.22, 1.2, 9]} /><meshStandardMaterial color={i % 2 ? PINE2 : PINE} roughness={1} /></mesh>
        {/* snow sitting on each layer */}
        <mesh position={[0, 0.98 + i * 0.62, 0]}><coneGeometry args={[0.9 - i * 0.2, 0.75, 9]} /><meshStandardMaterial color={SNOW} roughness={1} transparent opacity={0.85} /></mesh>
      </group>
    ))}
  </group>
);

/** pine positions: deterministic, kept off the road (|x|<3.5) and off the footprint path */
const PINES: { p: V3; s: number }[] = (() => {
  const out: { p: V3; s: number }[] = [];
  for (let i = 0; i < 170; i++) {
    const x = (rnd(i * 3.1) - 0.5) * 90, z = -70 + rnd(i * 7.7) * 85;
    if (Math.abs(x) < 4.2) continue;
    // distance to the path segment
    const ax = PATH_A[0], az = PATH_A[2], bx = PATH_B[0] - ax, bz = PATH_B[2] - az;
    const k = Math.max(0, Math.min(1.3, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
    if (Math.hypot(x - (ax + bx * k), z - (az + bz * k)) < 3.2) continue;
    if (Math.hypot(x - MOUND[0], z - MOUND[2]) < 5) continue;
    out.push({ p: [x, 0, z], s: 1.1 + rnd(i * 1.3) * 1.4 });
  }
  return out;
})();

/** falling snow: one Points cloud, positions are a pure function of the frame (wind = sideways drift) */
const Flakes: React.FC<{ n?: number; wind?: number; centre?: V3 }> = ({ n = 2600, wind = 1, centre = [2, 0, -4] }) => {
  const f = useCurrentFrame();
  const tex = useTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }, "flake");
  const geo = React.useMemo(() => new THREE.BufferGeometry(), []);
  const pos = React.useMemo(() => new Float32Array(n * 3), [n]);
  const W = 34, H = 9, D = 40;
  for (let i = 0; i < n; i++) {
    const sp = 0.035 + rnd(i * 1.7) * 0.03;
    const y = (((rnd(i * 2.3) * H - f * sp) % H) + H) % H;
    const x = ((rnd(i * 5.1) * W + f * 0.05 * wind + Math.sin(f / 20 + i) * 0.15) % W) - W / 2;
    pos[i * 3] = centre[0] + x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = centre[2] + rnd(i * 9.3) * D - D * 0.6;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.attributes.position.needsUpdate = true;
  return (
    <points geometry={geo}>
      <pointsMaterial map={tex} color="#FFFFFF" size={0.075} sizeAttenuation transparent depthWrite={false} opacity={0.9} />
    </points>
  );
};

/** footprints along the path from distance d0 to d1 (metres). fill 0..1 = new snow filling them in */
const Prints: React.FC<{ d0?: number; d1: number; fill?: number }> = ({ d0 = 0.4, d1, fill = 0 }) => {
  const out: React.ReactNode[] = [];
  const step = 0.42;
  const nx = Math.cos(PATH_RY), nz = -Math.sin(PATH_RY); // sideways
  for (let d = d0, i = 0; d < d1; d += step, i++) {
    const c = onPath(d), sd = i % 2 ? 1 : -1;
    out.push(<Sp key={i} p={[c[0] + nx * 0.11 * sd, 0.012, c[2] + nz * 0.11 * sd]} r={0.09} c={fill > 0.5 ? "#B8C4D4" : "#8E9DB4"} sc={[0.55, 0.12 * (1 - fill * 0.7), 1]} />);
  }
  return <group>{out}</group>;
};

export const Car: React.FC<{ p?: V3; lights?: number }> = ({ p = CAR, lights = 1 }) => (
  <group position={p}>
    <Bx p={[0, 0.55, 0]} s={[1.8, 0.62, 4.2]} c={CARC} r={0.6} />
    <Bx p={[0, 1.12, -0.25]} s={[1.6, 0.56, 2.2]} c={CARC} r={0.6} />
    {/* windows */}
    <Bx p={[0, 1.13, 0.87]} s={[1.48, 0.42, 0.03]} c="#1B2430" e="#2A3A50" ei={0.2} rx={-0.35} />
    {[-1, 1].map((sd) => <Bx key={sd} p={[sd * 0.805, 1.13, -0.25]} s={[0.02, 0.4, 1.9]} c="#1B2430" e="#2A3A50" ei={0.15} />)}
    {/* snow on roof and bonnet */}
    <Bx p={[0, 1.44, -0.25]} s={[1.5, 0.08, 2.05]} c={SNOW} r={1} />
    <Bx p={[0, 0.89, 1.4]} s={[1.6, 0.06, 1.2]} c={SNOW} r={1} />
    {[[-0.82, -1.35], [0.82, -1.35], [-0.82, 1.35], [0.82, 1.35]].map(([x, z], i) => <Cy key={i} p={[x, 0.33, z]} r={0.33} h={0.24} c="#16181C" rz={Math.PI / 2} />)}
    {/* headlights + halos */}
    {[-0.6, 0.6].map((x) => (
      <group key={x}>
        <Bx p={[x, 0.62, 2.11]} s={[0.36, 0.16, 0.03]} c="#F4F0E0" e="#FFF4D8" ei={1.6 * lights} />
        {lights > 0.05 ? <Glow p={[x, 0.62, 2.2]} s={1.6} c="#FFF1D0" o={0.6 * lights} /> : null}
      </group>
    ))}
    {lights > 0.05 ? <pointLight position={[0, 0.8, 3.6]} intensity={5 * lights} distance={11} color="#FFF0D0" /> : null}
    {/* tail lights */}
    {[-0.7, 0.7].map((x) => <Bx key={x} p={[x, 0.66, -2.11]} s={[0.3, 0.12, 0.03]} c="#7A1218" e="#D0202C" ei={0.9 * lights} />)}
  </group>
);

export type SnowProps = {
  /** headlights 0..1 */ lights?: number;
  /** car position (it moves only in the driving shot) */ car?: V3;
  /** footprints drawn up to this distance along the path (0 = none) */ prints?: number;
  /** new snow filling the prints 0..1 */ fill?: number;
  /** storm strength: more fog + sideways snow */ storm?: number;
  children?: React.ReactNode;
};

export const Snow: React.FC<SnowProps> = ({ lights = 0, car = CAR, prints = 0, fill = 0, storm = 1, children }) => (
  <group>
    <color attach="background" args={["#2E3A52"]} />
    <fog attach="fog" args={["#4A5873", 5 - storm * 1.5, 34 - storm * 10]} />
    {/* cold night: blue moon key + a soft sky fill, so faces stay readable */}
    <ambientLight intensity={0.55} color="#B9C8E6" />
    <hemisphereLight args={["#AFC2E6", "#5A6478", 0.6]} />
    <directionalLight position={[-8, 12, 6]} intensity={0.75} color="#C9D8F6" />
    {/* ground: snow field, the road a slightly darker band */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}><planeGeometry args={[160, 160]} /><meshStandardMaterial color={SNOW} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -20]}><planeGeometry args={[4, 160]} /><meshStandardMaterial color={ROAD} roughness={1} /></mesh>
    {/* tyre tracks */}
    {[-0.82, 0.82].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[CAR[0] + x, 0.006, -30]}><planeGeometry args={[0.28, 60]} /><meshStandardMaterial color="#98A3B4" roughness={1} /></mesh>)}
    {/* the snow bank you sit on + soft drifts */}
    <Sp p={[MOUND[0], 0, MOUND[2]]} r={0.75} c={SNOW2} sc={[1, 0.6, 0.9]} />
    {[[5, 0, 4], [-4.6, 0, 2], [6.5, 0, -6], [-5.5, 0, -10], [2.2, 0, 6]].map((q, i) => <Sp key={i} p={q as V3} r={1.4} c={SNOW2} sc={[1.6, 0.25, 1]} />)}
    {/* road posts with reflectors */}
    {[-12, -4, 4, 12].map((z) => <group key={z} position={[-2.3, 0, z]}><Bx p={[0, 0.5, 0]} s={[0.08, 1.0, 0.08]} c="#E8E8E0" /><Bx p={[0, 0.85, 0.045]} s={[0.06, 0.12, 0.01]} c="#C03030" e="#C03030" ei={0.3} /></group>)}
    {PINES.map((t, i) => <Pine key={i} p={t.p} s={t.s} />)}
    <Car p={car} lights={lights} />
    {prints > 0 ? <Prints d1={prints} fill={fill} /> : null}
    <Flakes wind={0.6 + storm} />
    {children}
  </group>
);
