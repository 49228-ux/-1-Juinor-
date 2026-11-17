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
/** EP4: the logging trail leaves the road to the right (+x) at this z */
export const TRAIL_Z = 50;
const PINES: { p: V3; s: number }[] = (() => {
  const out: { p: V3; s: number }[] = [];
  for (let i = 0; i < 300; i++) {
    const x = (rnd(i * 3.1) - 0.5) * 90, z = -70 + rnd(i * 7.7) * 150;
    if (Math.abs(x) < 4.2) continue;
    // distance to the path segment
    const ax = PATH_A[0], az = PATH_A[2], bx = PATH_B[0] - ax, bz = PATH_B[2] - az;
    const k = Math.max(0, Math.min(1.3, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
    if (Math.hypot(x - (ax + bx * k), z - (az + bz * k)) < 3.2) continue;
    if (Math.hypot(x - MOUND[0], z - MOUND[2]) < 5) continue;
    if (x > 0 && x < 60 && Math.abs(z - TRAIL_Z) < 4) continue; // EP4 logging trail
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

export const Car: React.FC<{ p?: V3; lights?: number; door?: number; ry?: number; children?: React.ReactNode }> = ({ p = CAR, lights = 1, door = 0, ry = 0, children }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Bx p={[0, 0.55, 0]} s={[1.8, 0.62, 4.2]} c={CARC} r={0.6} />
    {/* cabin = roof + pillars + tinted glass (see-through, so whoever sits inside reads as a silhouette) */}
    <Bx p={[0, 1.37, -0.25]} s={[1.6, 0.07, 2.2]} c={CARC} r={0.6} />
    {[[-0.77, 0.83], [0.77, 0.83], [-0.77, -1.33], [0.77, -1.33], [-0.77, -0.2], [0.77, -0.2]].map(([x, z], i) => <Bx key={i} p={[x, 1.12, z]} s={[0.07, 0.5, 0.07]} c={CARC} />)}
    <Bx p={[0, 1.12, 0.84]} s={[1.48, 0.46, 0.02]} c="#3A4A62" o={0.35} />
    <Bx p={[0, 1.12, -1.34]} s={[1.48, 0.46, 0.02]} c="#3A4A62" o={0.45} />
    <Bx p={[-0.79, 1.12, -0.25]} s={[0.02, 0.46, 2.1]} c="#3A4A62" o={0.4} />
    <Bx p={[0.79, 1.12, -0.77]} s={[0.02, 0.46, 1.1]} c="#3A4A62" o={0.4} />
    {/* seats + steering wheel */}
    {[-0.38, 0.38].map((x) => <group key={x}><Bx p={[x, 0.9, -0.55]} s={[0.55, 0.12, 0.55]} c="#2A2622" /><Bx p={[x, 1.15, -0.85]} s={[0.55, 0.6, 0.1]} c="#2A2622" /></group>)}
    <mesh position={[0.38, 1.05, 0.25]} rotation={[-0.9, 0, 0]}><torusGeometry args={[0.16, 0.02, 8, 24]} /><meshStandardMaterial color="#141414" /></mesh>
    {/* driver door on the +x side, hinged at its front edge (z=+0.3); the window in it is see-through */}
    <group position={[0.9, 0, 0.3]} rotation={[0, -door * 1.15, 0]}>
      <Bx p={[0, 0.6, -0.5]} s={[0.05, 0.6, 1.0]} c={CARC} r={0.6} />
      <Bx p={[-0.04, 1.13, -0.5]} s={[0.02, 0.4, 0.95]} c="#2A3A50" o={0.35} />
      <Bx p={[0.04, 0.78, -0.85]} s={[0.04, 0.03, 0.14]} c="#C9C9C9" />
    </group>
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
    {children}
    {/* tail lights */}
    {[-0.7, 0.7].map((x) => <Bx key={x} p={[x, 0.66, -2.11]} s={[0.3, 0.12, 0.03]} c="#7A1218" e="#D0202C" ei={0.9 * lights} />)}
  </group>
);

/* ─── EP2 additions: where Juinor's prints stop (18 m), the hidden gully, the dig spot, the giant prints ─── */
export const PRINT_END = 18;
const PDIR: V3 = [Math.sin(PATH_RY), 0, Math.cos(PATH_RY)];
/** the walker's left (character's left = +x when facing +z) */
const PLEFT: V3 = [Math.cos(PATH_RY), 0, -Math.sin(PATH_RY)];
export const at = (d: number, side: number, fwd = 0): V3 => { const c = onPath(d); return [c[0] + PLEFT[0] * side + PDIR[0] * fwd, 0, c[2] + PLEFT[2] * side + PDIR[2] * fwd]; };
/** the gully opening, just past the last print */
export const HOLE: V3 = at(PRINT_END + 1.2, 0);
/** where Mochi digs and Juinor is buried: on my right, beside the hole */
export const DIG: V3 = at(PRINT_END + 0.6, -1.7);
/** giant prints: start on the hole's left edge and walk back toward the car */
export const BIG_A: V3 = at(PRINT_END + 1.0, 1.6);
export const BIG_B: V3 = [CAR[0] + 1.6, 0, CAR[2] - 1.0];
export const BIG_RY = Math.atan2(BIG_B[0] - BIG_A[0], BIG_B[2] - BIG_A[2]);
const BigPrints: React.FC<{ n: number }> = ({ n }) => {
  const L = Math.hypot(BIG_B[0] - BIG_A[0], BIG_B[2] - BIG_A[2]), step = 0.95;
  const nx = Math.cos(BIG_RY), nz = -Math.sin(BIG_RY);
  const out: React.ReactNode[] = [];
  for (let i = 0; i * step < L && i < n; i++) {
    const k = (i * step) / L, sd = i % 2 ? 1 : -1;
    out.push(
      <group key={i} position={[BIG_A[0] + (BIG_B[0] - BIG_A[0]) * k + nx * 0.22 * sd, 0.012, BIG_A[2] + (BIG_B[2] - BIG_A[2]) * k + nz * 0.22 * sd]} rotation={[0, BIG_RY, 0]}>
        <Sp r={0.25} c="#7F8DA6" sc={[0.75, 0.1, 1]} />
        {[-0.1, 0, 0.1].map((x) => <Sp key={x} p={[x, 0, 0.3]} r={0.05} c="#7F8DA6" sc={[1, 0.15, 1.3]} />)}
      </group>,
    );
  }
  return <group>{out}</group>;
};

/* ─── EP3: the mountain behind the forest (no fog on it, so it reads as a far silhouette) + its crack + the avalanche ─── */
export const MNT: V3 = [-6, 0, -95];
const MNT_R = 70, MNT_H = 52;
/** a point on the mountain's face that looks toward +z, at height y and sideways offset dx */
const face = (y: number, dx: number): V3 => { const r = MNT_R * (1 - y / MNT_H); return [MNT[0] + dx, y, MNT[2] + Math.sqrt(Math.max(0, r * r - dx * dx)) + 0.6]; };
const NoFog: React.FC<{ c: string; o?: number }> = ({ c, o = 1 }) => <meshStandardMaterial color={c} roughness={1} fog={false} transparent={o < 1} opacity={o} />;
export const Mountain: React.FC<{ crack?: number; slide?: number }> = ({ crack = 0.45, slide = 0 }) => {
  const f = useCurrentFrame();
  const yC = 30, W = 6 + crack * 34;
  const pts: V3[] = [];
  for (let i = 0; i <= 24; i++) { const dx = -W + (2 * W * i) / 24; pts.push(face(yC + Math.sin(i * 1.7) * 1.2 + (rnd(i) - 0.5) * 1.4, dx)); }
  return (
    <group>
      <mesh position={[MNT[0], MNT_H / 2, MNT[2]]}><coneGeometry args={[MNT_R, MNT_H, 48, 1, true]} /><NoFog c="#B9C6D8" /></mesh>
      {/* rock bands */}
      {[[-14, 18], [12, 22], [-4, 40]].map(([dx, y], i) => <mesh key={i} position={face(y, dx)}><sphereGeometry args={[5, 10, 8]} /><NoFog c="#6F7C90" /></mesh>)}
      {/* the crack: a jagged dark line across the snow slab */}
      {pts.slice(1).map((q, i) => { const a = pts[i]; const mx: V3 = [(a[0] + q[0]) / 2, (a[1] + q[1]) / 2, (a[2] + q[2]) / 2]; const len = Math.hypot(q[0] - a[0], q[1] - a[1]); return <mesh key={i} position={mx} rotation={[0, 0, Math.atan2(q[1] - a[1], q[0] - a[0])]}><boxGeometry args={[len + 0.2, 0.55 + crack * 0.5, 0.3]} /><NoFog c="#1A2130" /></mesh>; })}
      {/* the avalanche: the slab below the crack slides down and throws up a snow cloud */}
      {slide > 0 ? <group>
        {Array.from({ length: 40 }, (_, i) => {
          const dx = -W + rnd(i * 3.3) * 2 * W, y = yC - 2 - slide * (yC - 4) * (0.7 + rnd(i) * 0.3) - rnd(i * 1.9) * 6;
          const p = face(Math.max(1, y), dx);
          const r = 3 + rnd(i * 7.1) * 4 + slide * 4 + Math.sin(f / 4 + i) * 0.3;
          return <mesh key={i} position={[p[0], p[1], p[2] + 2]}><sphereGeometry args={[r, 12, 10]} /><NoFog c={i % 3 ? "#EEF2F8" : "#D5DEEA"} o={0.92} /></mesh>;
        })}
      </group> : null}
    </group>
  );
};

/** EP4: the avalanche front sweeping down the road toward +z. front = z of its leading edge */
export const Avalanche: React.FC<{ front: number }> = ({ front }) => {
  const f = useCurrentFrame();
  return (
    <group>
      {Array.from({ length: 70 }, (_, i) => {
        const x = -34 + rnd(i * 2.7) * 41, back = rnd(i * 4.1) * 26, r = 2.2 + rnd(i * 6.3) * 2.8;
        const y = r * 0.55 + Math.sin(f / 5 + i) * 0.25 + (back > 8 ? 1.5 : 0);
        return <mesh key={i} position={[x, y, front - back]}><sphereGeometry args={[r, 12, 10]} /><meshStandardMaterial color={i % 4 ? "#EEF2F8" : "#D3DCE8"} roughness={1} transparent opacity={0.95} /></mesh>;
      })}
      {Array.from({ length: 24 }, (_, i) => <Glow key={`c${i}`} p={[-30 + rnd(i * 9.1) * 36, 3 + rnd(i) * 6, front - 4 - rnd(i * 5.5) * 20]} s={9} c="#F4F7FB" o={0.35} />)}
    </group>
  );
};

export type SnowProps = {
  /** headlights 0..1 */ lights?: number;
  /** car position (it moves only in the driving shot) */ car?: V3;
  /** footprints drawn up to this distance along the path (0 = none) */ prints?: number;
  /** new snow filling the prints 0..1 */ fill?: number;
  /** storm strength: more fog + sideways snow */ storm?: number;
  /** the gully opening 0 (hidden under smooth snow) .. 1 (collapsed, black) */ hole?: number;
  /** light down in the gully (the dropped flashlight) 0..1 */ holeGlow?: number;
  /** dug pit at DIG 0..1 */ dig?: number;
  /** how many giant prints are visible (0 = none) */ big?: number;
  /** driver door open 0..1 */ door?: number;
  /** car heading (0 = nose toward +z) */ carRy?: number;
  /** whoever sits in the car (local car coordinates) */ inCar?: React.ReactNode;
  /** the crack on the mountain 0..1, the avalanche sliding 0..1 */ crack?: number; slide?: number;
  /** EP4: avalanche front z on the road (undefined = none) */ aval?: number;
  /** EP4: show the logging trail + the snowbank at its mouth */ trail?: boolean;
  children?: React.ReactNode;
};

export const Snow: React.FC<SnowProps> = ({ lights = 0, car = CAR, prints = 0, fill = 0, storm = 1, hole = 0, holeGlow = 0, dig = 0, big = 0, door = 0, carRy = 0, inCar, crack = 0.45, slide = 0, aval, trail = true, children }) => (
  <group>
    <color attach="background" args={["#2E3A52"]} />
    <fog attach="fog" args={["#4A5873", 5 - storm * 1.5, 34 - storm * 10]} />
    {/* cold night: blue moon key + a soft sky fill, so faces stay readable */}
    <ambientLight intensity={0.55} color="#B9C8E6" />
    <hemisphereLight args={["#AFC2E6", "#5A6478", 0.6]} />
    <directionalLight position={[-8, 12, 6]} intensity={0.75} color="#C9D8F6" />
    {/* ground: snow field, the road a slightly darker band */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[200, 220]} /><meshStandardMaterial color={SNOW} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}><planeGeometry args={[4, 220]} /><meshStandardMaterial color={ROAD} roughness={1} /></mesh>
    {/* tyre tracks */}
    {[-0.82, 0.82].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[CAR[0] + x, 0.006, -30]}><planeGeometry args={[0.28, 60]} /><meshStandardMaterial color="#98A3B4" roughness={1} /></mesh>)}
    {/* the snow bank you sit on + soft drifts */}
    <Sp p={[MOUND[0], 0, MOUND[2]]} r={0.75} c={SNOW2} sc={[1, 0.6, 0.9]} />
    {[[5, 0, 4], [-4.6, 0, 2], [6.5, 0, -6], [-5.5, 0, -10], [2.2, 0, 6]].map((q, i) => <Sp key={i} p={q as V3} r={1.4} c={SNOW2} sc={[1.6, 0.25, 1]} />)}
    {/* road posts with reflectors */}
    {[-12, -4, 4, 12].map((z) => <group key={z} position={[-2.3, 0, z]}><Bx p={[0, 0.5, 0]} s={[0.08, 1.0, 0.08]} c="#E8E8E0" /><Bx p={[0, 0.85, 0.045]} s={[0.06, 0.12, 0.01]} c="#C03030" e="#C03030" ei={0.3} /></group>)}
    {PINES.map((t, i) => <Pine key={i} p={t.p} s={t.s} />)}
    <Car p={car} lights={lights} door={door} ry={carRy}>{inCar}</Car>
    <Mountain crack={crack} slide={slide} />
    {trail ? <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, 0.004, TRAIL_Z]}><planeGeometry args={[56, 3.4]} /><meshStandardMaterial color="#B6C0CD" roughness={1} /></mesh>
      <Sp p={[3.4, 0, TRAIL_Z]} r={1.4} c="#D5DEE9" sc={[0.8, 0.45, 2.2]} />
      <group position={[4.6, 0, TRAIL_Z - 2.4]}><Bx p={[0, 0.7, 0]} s={[0.1, 1.4, 0.1]} c="#6B4A35" /><Bx p={[0.35, 1.25, 0]} s={[0.8, 0.28, 0.04]} c="#D9C08A" /></group>
    </group> : null}
    {aval !== undefined ? <Avalanche front={aval} /> : null}
    {prints > 0 ? <Prints d1={prints} fill={fill} /> : null}
    {hole > 0 ? <group position={HOLE}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[1.1, 0.95, 1]}><torusGeometry args={[1.12 * hole, 0.13, 10, 40]} /><meshStandardMaterial color="#E4EAF2" roughness={1} /></mesh>
      <Sp p={[0, 0.03, 0]} r={1.12 * hole} c="#04060B" sc={[1.1, 0.015, 0.95]} />
      {holeGlow > 0 ? <><Glow p={[0.25, 0.08, 0.15]} s={0.45} c="#FFE8B0" o={0.3 * holeGlow} /><pointLight position={[0.25, 0.12, 0.15]} intensity={0.35 * holeGlow} distance={1.2} color="#FFE8B0" /></> : null}
    </group> : null}
    {dig > 0 ? <group position={DIG}>
      <Sp p={[0, 0.01, 0]} r={0.6 * dig} c="#3E4A63" sc={[1, 0.08, 0.8]} />
      {[0, 1, 2, 3, 4].map((i) => <Sp key={i} p={[Math.cos(i * 1.3) * 0.75, 0, Math.sin(i * 1.3) * 0.65]} r={0.28 * dig} c="#E8EDF4" sc={[1, 0.6, 1]} />)}
    </group> : null}
    {big > 0 ? <BigPrints n={big} /> : null}
    <Flakes wind={0.6 + storm} />
    {children}
  </group>
);
