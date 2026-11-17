import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Bx, Cam, Cy, Shot, useTex, type V3 } from "./kit/three";
import { BlurIn, DUR, FPS, FadeOut, Flash, Grain, LINE, Vig, fr, io, lin } from "./kit/ui";
import { Char, headCenter, type Look, type Pose } from "./rig/char";
import { JUINOR, JU_LIGHT, JU_S, ME, ME_S } from "./rig/cast";
import { SIT, WALK_STRIDE, blendPose, reachPose, runPose, walkPose } from "./rig/poses";
import { Dog } from "./rig/pets";
import { Apartment, BED } from "./sets/apartment";
import { CAR, LIE, MOUND, PATH_RY, Snow, onPath } from "./sets/snow";
import { Captions } from "./ui/captions";
import { Checklist, Clock, Knocks, NextCard, ProofCard, RuleSign, RuleTag } from "./ui/cards";

/** EP1 — "ย้อนเวลา 1 เดือน ก่อนจูเนียร์ทิ้งผมไว้ในหิมะ" (16:9, ~76 s, fiction).
 *  Two worlds: the snow road (sets/snow) and "my" room (sets/apartment).
 *  Twist object = the red scarf: on ME in the very first shots, on JUINOR all month, handed over on line 16. */

type V = V3;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const faceTo = (from: V, to: V) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const blink = (f: number, s = 0) => ((f + s * 23) % 83 < 4 ? 1 : 0);
const sec = (f: number) => f / FPS;
/** path direction + its sideways normal (for tracking cameras) */
const DIR: V = [Math.sin(PATH_RY), 0, Math.cos(PATH_RY)];
const SIDE: V = [Math.cos(PATH_RY), 0, -Math.sin(PATH_RY)];
const PRINT_END = 18; // where Juinor's footprints stop

/* ─── staging (fixed for the whole episode) ─── */
const HC_ME = headCenter(ME), HC_JU = headCenter(JUINOR);
// snow: me on the snow bank facing the path, Juinor in front of me, Mochi to the side
const ME_SIT: V = [MOUND[0], 0, MOUND[2]];
const JU_SNOW = onPath(0);
const ME_RY = faceTo(ME_SIT, JU_SNOW), JU_RY = faceTo(JU_SNOW, ME_SIT);
const DOG_SNOW: V = [4.15, 0, 1.05];
const SIT_Y = (SIT.y ?? 0) * 1.38 * ME.height; // hips drop when sitting (leg units)
const ME_FACE_SNOW: V = [ME_SIT[0], HC_ME + SIT_Y + 0.12, ME_SIT[2]];
// room: me on the bed edge, Juinor standing by the desk side, Mochi on the floor, calendar on the right wall
const ME_ROOM: V = [BED[0] + 0.55, 0, BED[2] - 0.1];
const JU_ROOM: V = [0.15, 0, -0.2];
const CAL: V = [2.97, 1.55, -0.7];
const DOG_ROOM: V = [2.0, 0, -0.35];
const BEDLIE: V = [BED[0], 0.6, BED[2] + 0.92];

/** a body lying on its back, head toward -z, face up */
const Lying: React.FC<{ L: Look; p: V; ry?: number; pose?: Pose; seed?: number }> = ({ L, p, ry = 0, pose, seed }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <group rotation={[-Math.PI / 2, 0, 0]}><Char L={L} pose={{ shL: [0, 0, 0.18], shR: [0, 0, -0.18], elL: -0.1, elR: -0.1, ...pose }} seed={seed} /></group>
  </group>
);

/* ─── SNOW scenes ─── */
/** first timeline: me in the snow, scarf on, Juinor's footprints walking away */
const SnowLie: React.FC<{ eyes?: number; juD?: number; prints?: number; children?: React.ReactNode }> = ({ eyes = 1, juD, prints = PRINT_END, children }) => (
    <Snow prints={prints} storm={1.2}>
      <pointLight position={[LIE[0] + 0.6, 1.4, LIE[2] - 1.0]} intensity={1.2} distance={4} color="#DDE6FF" />
      <Lying L={ME_S} p={[LIE[0], 0.12, LIE[2]]} pose={{ blink: eyes, browUp: 0.5, head: [0, 0.25, 0] }} seed={1} />
      {juD !== undefined ? <Char L={JU_LIGHT} p={onPath(juD)} ry={PATH_RY} pose={walkPose((juD / WALK_STRIDE) * Math.PI * 2)} seed={2} /> : null}
      {juD !== undefined ? <pointLight position={add(onPath(juD + 0.6), [0, 1.0, 0])} intensity={1.6} distance={5} color="#FFF0C8" /> : null}
      {children}
    </Snow>
);
const LIE_FACE: V = [LIE[0], 0.24, LIE[2] - HC_ME];
const S_LieHigh = () => { const f = useCurrentFrame(); return <Shot><SnowLie /><Cam p={[LIE[0] + 1.6, 3.4 - f * 0.006, LIE[2] + 0.4]} t={[LIE[0], 0.1, LIE[2] - 0.75]} fov={34} drift={0.4} /></Shot>; };
const S_LieFace: React.FC<{ eyes?: number }> = ({ eyes = 1 }) => { const f = useCurrentFrame(); return <Shot><SnowLie eyes={eyes} /><Cam p={[LIE_FACE[0] + 0.55, 1.55 - f * 0.004, LIE_FACE[2] + 0.5]} t={add(LIE_FACE, [0, -0.05, 0.12])} fov={24} drift={0.3} /></Shot>; };
const S_LieSide = () => { const f = useCurrentFrame(); return <Shot><SnowLie /><Cam p={[LIE[0] + 4.2 - f * 0.006, 1.5, LIE[2] + 3.4]} t={[LIE[0] - 0.6, 0.4, LIE[2] - 0.6]} fov={28} drift={0.4} /></Shot>; };
/** behind me lying, Juinor walking away up the path (first timeline) */
const S_AwayLow = () => { const f = useCurrentFrame(); const d = 8 + sec(f) * 1.2; return <Shot><SnowLie juD={d} prints={d} /><Cam p={[LIE[0] + 1.6, 1.5, LIE[2] + 2.2 - f * 0.004]} t={add(onPath(10), [0, 0.8, 0])} fov={26} drift={0.4} /></Shot>; };
const S_PrintsLow = () => { const f = useCurrentFrame(); const d = 12 + sec(f) * 1.2; return <Shot><SnowLie juD={d} prints={d} /><Cam p={add(onPath(1.2 + sec(f) * 0.4), [SIDE[0] * 0.5, 0.32, SIDE[2] * 0.5])} t={add(onPath(7), [0, 0.1, 0])} fov={30} drift={0.3} /></Shot>; };

/** second timeline, Dec 24: the car, me on the snow bank, Juinor, Mochi */
type SnowAct = "talk" | "bark" | "wrap" | "after";
const Night: React.FC<{ act?: SnowAct; lights?: number; juD?: number; meRun?: number; children?: React.ReactNode }> = ({ act = "talk", lights = 0, juD, meRun, children }) => {
  const f = useCurrentFrame();
  const wrapK = act === "wrap" ? io(f, 4, 26, 0, 1) - io(f, 40, 58, 0, 1) : 0;
  const scarfOnMe = act === "after" || (act === "wrap" && f >= 36);
  const juLook: Look = scarfOnMe ? JU_LIGHT : JU_S;
  const mePose: Pose = { ...SIT, head: [act === "wrap" ? 0.2 : 0.05, 0, 0], browUp: act === "after" ? 0.9 : 0.5, blink: blink(f, 1), shL: [-0.5, 0, 0.3], shR: [-0.5, 0, -0.3], elL: -1.4, elR: -1.4 };
  const juPose: Pose = juD !== undefined
    ? walkPose((juD / WALK_STRIDE) * Math.PI * 2)
    : blendPose({ head: [0.25, 0, 0], blink: blink(f, 2), browUp: 0.3 }, { ...reachPose(1), shL: [-1.4, 0, 0.1], elL: -0.4, spine: [0.45, 0, 0], head: [0.35, 0, 0], browUp: 0.6 }, wrapK);
  const juP = juD !== undefined ? onPath(juD) : JU_SNOW;
  const bark = act === "bark" ? Math.max(0, Math.sin(f / 3.2)) : 0;
  return (
    <Snow lights={lights} prints={juD !== undefined ? Math.min(juD, PRINT_END) : 0} storm={1.1}>
      <pointLight position={add(ME_FACE_SNOW, [0.2, 0.5, -1.2])} intensity={1.3} distance={4} color="#E6ECFF" />
      {meRun === undefined
        ? <Char L={scarfOnMe ? ME_S : ME} p={ME_SIT} ry={ME_RY} pose={mePose} seed={1} />
        : <Char L={ME_S} p={onPath(meRun)} ry={PATH_RY} pose={runPose(meRun, 0, Math.max(0.15, 1 - Math.max(0, meRun - (PRINT_END - 2.5)) / 2.5))} seed={1} />}
      {juD === undefined || juD < 40 ? <Char L={juLook} p={juP} ry={juD !== undefined ? PATH_RY : JU_RY} pose={juPose} seed={2} /> : null}
      {juD !== undefined ? <pointLight position={add(onPath(juD + 0.7), [0, 1.0, 0])} intensity={1.8} distance={6} color="#FFF0C8" /> : null}
      {meRun === undefined ? <Dog p={DOG_SNOW} ry={faceTo(DOG_SNOW, JU_SNOW)} s={1.35} pose={{ head: [0, -0.25 - bark * 0.25], tail: f / 4, whine: bark, walk: f / 2, amp: bark * 0.15 }} /> : null}
      {children}
    </Snow>
  );
};
const dirMe = (k: number, dy = 0): V => [ME_FACE_SNOW[0] + Math.sin(ME_RY) * k, ME_FACE_SNOW[1] + dy, ME_FACE_SNOW[2] + Math.cos(ME_RY) * k];
const S_Drive = () => { const f = useCurrentFrame(); const z = -26 + sec(f) * 6; const car: V = [CAR[0], 0, z]; return <Shot><Snow lights={1} car={car} storm={1.3} /><Cam p={[8.5, 2.4, z + 9]} t={[CAR[0], 0.9, z + 1]} fov={30} drift={0.6} /></Shot>; };
const S_Stall = () => { const f = useCurrentFrame(); const l = f < 12 ? 1 : f < 40 ? (Math.sin(f * 1.7) > 0 ? 0.9 : 0.15) * (1 - (f - 12) / 28) : 0; return <Shot><Snow lights={l} storm={1.2} /><Cam p={[4.8, 1.25, 8.6 - f * 0.01]} t={[CAR[0], 0.8, CAR[2]]} fov={26} drift={0.5} /></Shot>; };
const S_Bark = () => { const f = useCurrentFrame(); return <Shot><Night act="bark" /><Cam p={[8.2 - f * 0.006, 1.45, 1.5]} t={[3.45, 0.95, 0.95]} fov={27} drift={0.5} /></Shot>; };
const S_Wrap = () => { const f = useCurrentFrame(); return <Shot><Night act="wrap" /><Cam p={[7.0 - f * 0.004, 1.45, 0.7]} t={[3.3, 1.08, 0.95]} fov={25} drift={0.4} /></Shot>; };
const S_WalkOff = () => { const f = useCurrentFrame(); const d = 0.6 + sec(f) * 1.1; return <Shot><Night act="after" juD={d} /><Cam p={[ME_SIT[0] + 1.0, 1.3, ME_SIT[2] + 1.9]} t={add(onPath(5), [-0.6, 0.8, 0])} fov={28} drift={0.4} /></Shot>; };
const S_MeFace: React.FC<{ k?: number; dy?: number; fov?: number }> = ({ k = 1.9, dy = 0, fov = 19 }) => { const f = useCurrentFrame(); return <Shot><Night act="after" juD={30} /><Cam p={dirMe(k - f * 0.003, 0.05)} t={add(ME_FACE_SNOW, [0, dy - 0.06, 0])} fov={fov} drift={0.3} /></Shot>; };
const S_JuStorm = () => { const f = useCurrentFrame(); const d = 9 + sec(f) * 1.1; const p = onPath(d); return <Shot><Night act="after" juD={d} /><Cam p={add(p, [SIDE[0] * -6.5 + DIR[0] * 1.5, 1.4, SIDE[2] * -6.5 + DIR[2] * 1.5])} t={add(p, [0, 0.95, 0])} fov={17} drift={0.6} /></Shot>; };
const S_Empty = () => { const f = useCurrentFrame(); return <Shot><Night act="after" juD={60} /><Cam p={add(onPath(1.5 + sec(f) * 0.3), [SIDE[0] * -0.7, 0.55, SIDE[2] * -0.7])} t={add(onPath(10), [0, 0.2, 0])} fov={30} drift={0.3} /></Shot>; };
/** I run up the footprints; tracking from the front-side */
const S_Run = () => { const f = useCurrentFrame(); const d = 3 + sec(f) * 4.2; return <Shot><Night act="after" juD={60} meRun={d} /><Cam p={add(onPath(d + 3.2), [SIDE[0] * -2.2, 1.05, SIDE[2] * -2.2])} t={add(onPath(d), [0, 1.05, 0])} fov={30} drift={0.6} /></Shot>; };
/** the prints stop in open snow; I stand at the end */
const S_PrintsEnd = () => { const f = useCurrentFrame(); return <Shot><Night act="after" juD={60} meRun={PRINT_END - 0.6} /><Cam p={add(onPath(PRINT_END - 5.5), [SIDE[0] * 1.2, 2.6 - f * 0.004, SIDE[2] * 1.2])} t={add(onPath(PRINT_END + 0.8), [0, 0.2, 0])} fov={30} drift={0.4} /></Shot>; };

/* ─── ROOM scenes (Nov 24 → Dec 23) ─── */
const Calendar: React.FC = () => {
  const tex = useTex(320, 440, (g) => {
    g.fillStyle = "#F4F0E6"; g.fillRect(0, 0, 320, 440);
    g.fillStyle = "#C8323A"; g.fillRect(0, 0, 320, 86);
    g.fillStyle = "#FFF6EE"; g.font = "bold 48px sans-serif"; g.textAlign = "center"; g.fillText("NOV", 160, 62);
    g.fillStyle = "#2A2622"; g.font = "bold 150px sans-serif"; g.fillText("24", 160, 250);
    g.font = "bold 22px sans-serif";
    for (let d = 1; d <= 30; d++) { const c = (d + 5) % 7, r = Math.floor((d + 5) / 7); g.fillStyle = d === 24 ? "#C8323A" : "#5A544C"; g.fillText(String(d), 30 + c * 43, 300 + r * 30); }
    g.strokeStyle = "#C8323A"; g.lineWidth = 4; g.beginPath(); g.arc(30 + ((24 + 5) % 7) * 43, 292 + Math.floor((24 + 5) / 7) * 30, 17, 0, Math.PI * 2); g.stroke();
  }, "calendar-nov24");
  return (
    <group position={CAL} rotation={[0, -Math.PI / 2, 0]}>
      <mesh><planeGeometry args={[0.46, 0.63]} /><meshStandardMaterial map={tex} roughness={0.9} /></mesh>
      <Bx p={[0, 0.33, 0.005]} s={[0.5, 0.03, 0.02]} c="#3A2E24" />
    </group>
  );
};
/** packing for the trip on the blanket: 3 pairs of dry socks, 2 power banks, 1 flashlight, a backpack */
const Gear: React.FC<{ show?: number }> = ({ show = 3 }) => (
  <group position={[BED[0], 0.62, BED[2]]}>
    <Bx p={[-0.25, 0.14, 0.15]} s={[0.36, 0.42, 0.2]} c="#7A3A30" />
    {show >= 1 ? [0, 1, 2].map((i) => <group key={i} position={[0.12, 0.012, 0.35 + i * 0.16]}>{[-0.04, 0.04].map((x) => <Bx key={x} p={[x, 0, 0]} s={[0.07, 0.025, 0.13]} c={["#D8D2C4", "#8C9AB0", "#C9A455"][i]} />)}</group>) : null}
    {show >= 2 ? [0, 1].map((i) => <Bx key={i} p={[-0.2 + i * 0.13, 0.016, 0.62]} s={[0.08, 0.03, 0.14]} c="#2A2D33" e="#3A8AF0" ei={0} />) : null}
    {show >= 3 ? <Cy p={[-0.15, 0.025, 0.86]} r={0.025} h={0.2} c="#E2B54E" rx={Math.PI / 2} /> : null}
  </group>
);
type RoomAct = "wake" | "sit" | "smile" | "pack";
const Room: React.FC<{ act?: RoomAct; ju?: boolean; dog?: "look" | "sit"; gear?: number }> = ({ act = "sit", ju, dog, gear }) => {
  const f = useCurrentFrame();
  const mePose: Pose = act === "pack" ? { ...SIT, head: [0.45, 0.2, 0], shR: [-0.9, 0, -0.1], elR: -0.6, blink: blink(f) } : { ...SIT, head: [0.0, 0, 0], browUp: act === "smile" ? 0.2 : 0.5, mouth: act === "smile" ? 0.12 : 0, blink: blink(f) };
  return (
    <Apartment lamp={1} hall={0.6}>
      <Calendar />
      <pointLight position={[ME_ROOM[0] + 1.0, 1.7, ME_ROOM[2] + 0.8]} intensity={1.1} distance={3.5} color="#FFD8B0" />
      {act === "wake"
        ? <Lying L={ME} p={BEDLIE} pose={{ blink: lin(f, 8, 16, 1, 0), browUp: io(f, 14, 30, 0, 0.9), head: [0, 0.2, 0] }} seed={1} />
        : <Char L={ME} p={ME_ROOM} ry={faceTo(ME_ROOM, JU_ROOM)} pose={mePose} seed={1} />}
      {ju ? <Char L={JU_S} p={JU_ROOM} ry={faceTo(JU_ROOM, ME_ROOM)} pose={{ head: [0.08, 0, 0], blink: blink(f, 2), browUp: 0.3, shL: [-0.2, 0, 0.15], shR: [-0.2, 0, -0.15], elL: -0.6, elR: -0.6 }} seed={2} /> : null}
      {dog ? <Dog p={DOG_ROOM} ry={faceTo(DOG_ROOM, [CAL[0], 0, CAL[2]])} s={1.35} pose={{ head: [0, dog === "look" ? -0.55 : 0], tail: f / 12, whine: dog === "look" ? 0.5 + 0.5 * Math.sin(f / 9) : 0 }} /> : null}
      {gear ? <Gear show={gear} /> : null}
    </Apartment>
  );
};
const FACE_ROOM_Y = HC_ME + SIT_Y;
const S_Wake = () => { const f = useCurrentFrame(); const h: V = [BEDLIE[0], BEDLIE[1] + 0.12, BEDLIE[2] - HC_ME]; return <Shot><Room act="wake" /><Cam p={[h[0] + 0.45, 1.75 - f * 0.003, h[2] + 0.45]} t={add(h, [0, 0, 0.1])} fov={24} drift={0.3} /></Shot>; };
const S_Cal = () => { const f = useCurrentFrame(); return <Shot><Room dog="sit" /><Cam p={[0.9 + f * 0.004, 1.45, -0.25]} t={[CAL[0], CAL[1] - 0.05, CAL[2] + 0.1]} fov={26} drift={0.3} /></Shot>; };
const S_Dog = () => { const f = useCurrentFrame(); return <Shot><Room dog="look" /><Cam p={[0.3, 0.7, 1.2 - f * 0.003]} t={[2.4, 0.85, -0.5]} fov={40} drift={0.3} /></Shot>; };
const S_Two = () => { const f = useCurrentFrame(); return <Shot><Room act="smile" ju dog="sit" /><Cam p={[-0.3, 1.35, 2.75 - f * 0.004]} t={[-0.8, 0.95, 0.1]} fov={34} drift={0.4} /></Shot>; };
const S_JuClose = () => { const f = useCurrentFrame(); const r = faceTo(JU_ROOM, ME_ROOM) + 0.35; const fc: V = [JU_ROOM[0], HC_JU - 0.12, JU_ROOM[2]]; return <Shot><Room act="smile" ju /><Cam p={[fc[0] + Math.sin(r) * (2.0 - f * 0.004), fc[1] + 0.05, fc[2] + Math.cos(r) * (2.0 - f * 0.004)]} t={fc} fov={18} drift={0.3} /></Shot>; };
const S_Pack = () => { const f = useCurrentFrame(); return <Shot><Room act="pack" gear={3} dog="sit" /><Cam p={[BED[0] + 2.1, 1.75, BED[2] + 2.0 - f * 0.004]} t={[BED[0] + 0.25, 0.75, BED[2] + 0.2]} fov={28} drift={0.4} /></Shot>; };
const S_MeRoom = () => { const f = useCurrentFrame(); const r = faceTo(ME_ROOM, JU_ROOM) - 0.3; return <Shot><Room act="sit" gear={3} /><Cam p={[ME_ROOM[0] + Math.sin(r) * (2.1 - f * 0.003), FACE_ROOM_Y + 0.08, ME_ROOM[2] + Math.cos(r) * (2.1 - f * 0.003)]} t={[ME_ROOM[0] - 0.25, FACE_ROOM_Y - 0.12, ME_ROOM[2]]} fov={22} drift={0.3} /></Shot>; };
const S_Socks = () => { const f = useCurrentFrame(); return <Shot><Room act="pack" gear={1} /><Cam p={[BED[0] + 0.75, 1.25 - f * 0.002, BED[2] + 0.95]} t={[BED[0] + 0.1, 0.64, BED[2] + 0.55]} fov={22} drift={0.3} /></Shot>; };
const S_Gear = () => { const f = useCurrentFrame(); return <Shot><Room act="pack" gear={3} /><Cam p={[BED[0] + 0.95, 1.3 - f * 0.002, BED[2] + 1.25]} t={[BED[0] - 0.05, 0.64, BED[2] + 0.7]} fov={24} drift={0.3} /></Shot>; };

/* ─── the edit (by line number, so a new voice take re-times the picture) ─── */
type Cut = { a: number; b: number; el: React.ReactNode };
const T = (n: number) => LINE[n - 1].t;
const E = (n: number) => LINE[n - 1].end;
const END = E(LINE.length) + 0.4;
const mid = (n: number) => (T(n) + E(n)) / 2;
export const CUTS: Cut[] = [
  { a: 0, b: mid(1) + 0.4, el: <><S_LieHigh /><RuleSign /></> },
  { a: mid(1) + 0.4, b: T(2) - 0.1, el: <><S_LieFace /><RuleTag /></> },
  { a: T(2) - 0.1, b: T(3) - 0.1, el: <S_AwayLow /> },
  { a: T(3) - 0.1, b: T(4) - 0.1, el: <><S_LieSide /><Clock t="−12°C" label="คืนวันที่ 24 ธ.ค." /></> },
  { a: T(4) - 0.1, b: T(5) - 0.15, el: <S_PrintsLow /> },
  { a: T(5) - 0.15, b: T(6) - 0.1, el: <S_Wake /> },
  { a: T(6) - 0.1, b: T(7) - 0.1, el: <><S_Cal /><Clock t="07:12" label="24 พ.ย. · อีก 30 วัน" /></> },
  { a: T(7) - 0.1, b: T(8) - 0.1, el: <S_Dog /> },
  { a: T(8) - 0.1, b: mid(8) + 0.2, el: <S_Two /> },
  { a: mid(8) + 0.2, b: T(9) - 0.1, el: <S_JuClose /> },
  { a: T(9) - 0.1, b: T(10) - 0.1, el: <S_Pack /> },
  { a: T(10) - 0.1, b: T(11) - 0.1, el: <><S_MeRoom /><ProofCard title="น้ำดึงความร้อนออกจากตัว" big="25" unit="เท่า" note="เร็วกว่าอากาศ (เสื้อผ้าเปียก = หนาวเร็วมาก)" source="ค่าการนำความร้อน: น้ำ ≈ 0.6 · อากาศ ≈ 0.024 W/m·K" /></> },
  { a: T(11) - 0.1, b: T(12) - 0.1, el: <S_Socks /> },
  { a: T(12) - 0.1, b: T(13) - 0.1, el: <><S_Gear /><Checklist title="ของที่ต้องมี" rows={[{ text: "ถุงเท้าแห้ง 3 คู่", ok: true }, { text: "พาวเวอร์แบงก์ 2 ก้อน", ok: true }, { text: "ไฟฉาย 1 อัน", ok: true }]} every={11} /></> },
  { a: T(13) - 0.1, b: T(14) - 0.1, el: <><S_Drive /><Clock t="21:00" label="24 ธ.ค. · ทางขึ้นเขา" /></> },
  { a: T(14) - 0.1, b: T(15) - 0.1, el: <S_Stall /> },
  { a: T(15) - 0.1, b: T(16) - 0.1, el: <><S_Bark /><Knocks at={[6, 18, 30]} word="โฮ่ง" x={1050} y={330} /></> },
  { a: T(16) - 0.1, b: mid(16) + 0.5, el: <S_Wrap /> },
  { a: mid(16) + 0.5, b: T(17) - 0.1, el: <S_WalkOff /> },
  { a: T(17) - 0.1, b: T(18) - 0.1, el: <S_MeFace /> },
  { a: T(18) - 0.1, b: mid(18), el: <S_MeFace k={1.15} dy={-0.24} fov={17} /> },
  { a: mid(18), b: T(19) - 0.1, el: <S_LieFace eyes={1} /> },
  { a: T(19) - 0.1, b: T(20) - 0.1, el: <S_JuStorm /> },
  { a: T(20) - 0.1, b: T(21) - 0.1, el: <S_Empty /> },
  { a: T(21) - 0.1, b: mid(21) + 0.3, el: <S_Run /> },
  { a: mid(21) + 0.3, b: END, el: <S_PrintsEnd /> },
  { a: END, b: DUR / FPS, el: <><BlurIn><S_PrintsEnd /></BlurIn><NextCard /></> },
];

export const HERO_S = mid(18);
export const Film: React.FC<{ noCaps?: boolean }> = ({ noCaps }) => (
  <AbsoluteFill style={{ background: "#07090F" }}>
    {CUTS.map((c, i) => (
      <Sequence key={i} from={fr(c.a)} durationInFrames={fr(c.b) - fr(c.a)}>
        <AbsoluteFill>{c.el}</AbsoluteFill>
      </Sequence>
    ))}
    <Flash at={fr(T(5) - 0.15)} c="rgba(255,250,240,0.95)" />
    <Flash at={fr(HERO_S)} c="rgba(170,200,255,0.9)" />
    <Vig a={0.36} />
    <FadeOut from={DUR - 24} />
    <Grain amount={0.045} />
    {noCaps ? null : <Captions hideFrom={END} />}
  </AbsoluteFill>
);
