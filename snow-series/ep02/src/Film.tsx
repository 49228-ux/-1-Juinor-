import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Cam, Cy, Glow, Shot, type V3 } from "./kit/three";
import { BlurIn, DUR, FPS, FadeOut, Flash, Grain, LINE, Vig, fr, io, lin } from "./kit/ui";
import { Char, headCenter, type Look, type Pose } from "./rig/char";
import { JUINOR, ME, ME_S } from "./rig/cast";
import { CROUCH } from "./rig/poses";
import { Dog } from "./rig/pets";
import { BIG_A, BIG_B, BIG_RY, CAR, DIG, HOLE, PATH_RY, PRINT_END, Snow, at, type SnowProps } from "./sets/snow";
import { Captions } from "./ui/captions";
import { Clock, Measure, NextCard, ProofCard, RuleSign, RuleTag } from "./ui/cards";

/** EP2 — "รอยเท้าที่หายไปกลางหิมะ" (16:9, ~64 s, fiction). Picks up exactly where EP1 ended:
 *  me at the end of Juinor's footprints (18 m up the path), Mochi with me, the car far behind.
 *  Beats: hidden gully → flashlight test → 18-minute dig → Juinor alive → giant prints → the headlights switch on.
 *  Planted for the twist: the giant prints are in frame from line 3 on (left of the hole). */

type V = V3;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const faceTo = (from: V, to: V) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const blink = (f: number, s = 0) => ((f + s * 23) % 83 < 4 ? 1 : 0);
const P = (d: number, side: number, y = 0, fwd = 0): V => add(at(d, side, fwd), [0, y, 0]);
const ME_SL: Look = { ...ME_S, holdR: "flashlight" };

/* ─── staging ─── */
const ME_AT = at(PRINT_END - 0.6, 0);              // where EP1 ended
const ME_DIG = add(DIG, [0, 0, 0]) as V;            // pit centre
const ME_KNEEL = at(PRINT_END + 0.1, -1.05);        // kneeling at the pit edge
const DOG_AT = at(PRINT_END - 0.9, -0.7);
const DOG_DIG = at(PRINT_END + 0.95, -2.35);        // Mochi digs on the far side of the pit
const JU_SIT = at(PRINT_END + 0.5, -2.3);           // Juinor after being pulled out
const HC = headCenter(ME), HCJ = headCenter(JUINOR);
const ME_FACE: V = [ME_AT[0], HC + 0.04, ME_AT[2]];

/** the whole place; every shot picks act + camera */
type Act = "stand" | "throw" | "crawl" | "dig" | "rescue" | "after";
const Scene: React.FC<{ act?: Act; hole?: number; holeGlow?: number; dig?: number; big?: number; lights?: number; storm?: number; crawlK?: number; throwF?: number; coat?: number; children?: React.ReactNode }> = ({ act = "stand", hole = 0, holeGlow = 0, dig = 0, big = 14, lights = 0, storm = 1.0, crawlK = 0, throwF = -1, coat = 0, children }) => {
  const f = useCurrentFrame();
  const snow: SnowProps = { prints: PRINT_END, hole, holeGlow, dig, big, lights, storm };
  // me
  let me: React.ReactNode;
  if (act === "crawl" || act === "dig" || act === "rescue") {
    const p = act === "crawl" ? ([ME_AT[0] + (ME_KNEEL[0] - ME_AT[0]) * crawlK, 0, ME_AT[2] + (ME_KNEEL[2] - ME_AT[2]) * crawlK] as V) : ME_KNEEL;
    const s = Math.sin(f / (act === "dig" ? 2.2 : 3.5));
    const pose: Pose = act === "dig"
      ? { ...CROUCH, spine: [0.75, 0, 0], shL: [-1.2 + s * 0.6, 0, 0.3], shR: [-1.2 - s * 0.6, 0, -0.3], elL: -0.5, elR: -0.5, head: [0.3, 0, 0], browUp: 1, mouth: 0.25, blink: 0 }
      : act === "rescue"
        ? { ...CROUCH, spine: [0.4, 0, 0], head: [0.1, -0.5, 0], shL: [-1.2, 0, 0.3], shR: [-1.0, 0, -0.3], elL: -0.6, elR: -0.6, browUp: 0.8, mouth: 0.1 }
        : { ...CROUCH, spine: [0.85, 0, 0], shL: [-1.5 + s * 0.4, 0, 0.3], shR: [-1.5 - s * 0.4, 0, -0.3], elL: -0.3, elR: -0.3, head: [-0.3, 0, 0], browUp: 0.9 };
    const ry = act === "crawl" ? faceTo(ME_AT, ME_KNEEL) : faceTo(ME_KNEEL, act === "rescue" ? JU_SIT : ME_DIG);
    me = <Char L={ME_S} p={p} ry={ry} pose={pose} seed={1} />;
  } else if (act === "throw") {
    const k = throwF < 11 ? 1 : io(f, throwF - 10, throwF, 0, 1), back = throwF < 11 ? 1 : io(f, 0, throwF - 10, 0, 1);
    const pose: Pose = { shR: [-1.0 - back * 1.9 + k * 2.2, 0, -0.25], elR: -0.9 + k * 0.8, spine: [0.1 * k, -0.25 + k * 0.4, 0], head: [0, 0, 0], browUp: 0.7, holdOff: f >= throwF, blink: blink(f) };
    me = <Char L={ME_SL} p={ME_AT} ry={PATH_RY} pose={pose} seed={1} />;
  } else {
    me = <Char L={act === "after" ? ME_S : ME_SL} p={ME_AT} ry={act === "after" ? faceTo(ME_AT, CAR) : PATH_RY} pose={{ head: [0.05, 0, 0], browUp: act === "after" ? 1 : 0.6, blink: blink(f), shR: [-0.6, 0, -0.15], elR: -0.9 }} seed={1} />;
  }
  // Mochi
  const digging = act === "dig" || (act === "stand" && dig > 0) || act === "crawl";
  const dog = digging
    ? <Dog p={DOG_DIG} ry={faceTo(DOG_DIG, ME_DIG)} s={1.35} pose={{ head: [0, 0.5], walk: f / 1.3, amp: 0.9, tail: f / 2 }} />
    : act === "after"
      ? <Dog p={DOG_AT} ry={faceTo(DOG_AT, CAR)} s={1.35} pose={{ head: [0, -0.2], tail: 0, whine: 0.6 + 0.4 * Math.sin(f / 5) }} />
      : <Dog p={DOG_AT} ry={PATH_RY} s={1.35} pose={{ head: [0.2, 0], tail: f / 6 }} />;
  // Juinor (buried coat patch, then sitting)
  const ju = act === "rescue" || act === "after"
    ? <Char L={JUINOR} p={JU_SIT} ry={act === "after" ? faceTo(JU_SIT, CAR) : faceTo(JU_SIT, ME_KNEEL)} pose={{ hipL: [-1.35, 0, 0.12], hipR: [-1.3, 0, -0.12], knL: 0.35, knR: 0.5, y: -0.47, spine: [-0.12 + 0.12 * Math.max(0, Math.sin(f / 4)), 0, 0], shL: [0.4, 0, 0.35], shR: [0.4, 0, -0.35], elL: -0.2, elR: -0.2, head: [-0.1 + 0.08 * Math.sin(f / 4), 0, 0], mouth: act === "rescue" ? 0.25 + 0.25 * Math.abs(Math.sin(f / 3)) : 0.05, browUp: act === "after" ? 1 : 0.2, blink: act === "rescue" && f < 20 ? 1 : blink(f, 2) }} seed={2} />
    : null;
  return (
    <Snow {...snow}>
      <pointLight position={add(ME_FACE, [0.3, 0.6, 1.2])} intensity={1.2} distance={4} color="#E6ECFF" />
      <pointLight position={add(DIG, [0.4, 1.4, 0.6])} intensity={1.1} distance={4} color="#FFE6C0" />
      {me}
      {dog}
      {ju}
      {coat > 0 ? <group position={add(DIG, [0, 0.03, 0])}><mesh scale={[0.35 * coat, 0.06, 0.28 * coat]}><sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial color="#6B4A35" roughness={1} /></mesh></group> : null}
      {children}
    </Snow>
  );
};

/** the flashlight in flight: hand → hole, lands on local frame `land` */
const Flying: React.FC<{ from: number; land: number }> = ({ from, land }) => {
  const f = useCurrentFrame();
  if (f < from || f > land) return null;
  const k = (f - from) / (land - from);
  const a: V = add(at(PRINT_END - 0.4, -0.2), [0, 1.55, 0]), b: V = add(HOLE, [0, 0.05, 0]);
  const p: V = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 1.4, a[2] + (b[2] - a[2]) * k];
  return <group position={p} rotation={[f * 0.6, 0, f * 0.4]}><Cy r={0.03} h={0.22} c="#E2B54E" e="#FFE8B0" ei={0.4} /><Glow p={[0, 0.12, 0]} s={0.7} o={0.6} /><pointLight intensity={1.4} distance={3} color="#FFE8B0" /></group>;
};

/* ─── shots ─── */
const S_Stop = () => { const f = useCurrentFrame(); return <Shot><Scene /><Cam p={P(22.4 - f * 0.012, 0.9, 1.25)} t={P(17.0, -0.3, 1.32)} fov={30} drift={0.5} /></Shot>; };
const S_Surface = () => { const f = useCurrentFrame(); return <Shot><Scene /><Cam p={P(17.6 + f * 0.012, -0.4, 0.32)} t={P(21.5, 0.2, 0.05)} fov={34} drift={0.4} /></Shot>; };
const S_High: React.FC<{ hole?: number; dig?: number; act?: Act }> = ({ hole = 0, dig = 0, act = "stand" }) => { const f = useCurrentFrame(); return <Shot><Scene hole={hole} dig={dig} act={act} /><Cam p={P(14.6, -2.6, 4.4 + f * 0.01)} t={P(19.2, 0.3, 0)} fov={34} drift={0.4} /></Shot>; };
const S_DogDig = () => { const f = useCurrentFrame(); return <Shot><Scene dig={0.35} /><Cam p={add(DOG_DIG, [-1.0 - f * 0.004, 0.55, 1.3])} t={add(DOG_DIG, [0, 0.25, 0])} fov={30} drift={0.5} /></Shot>; };
const S_Throw = () => { const f = useCurrentFrame(); return <Shot><Scene act="throw" throwF={22}><Flying from={22} land={60} /></Scene><Cam p={P(16.0 - f * 0.006, 3.6, 1.35)} t={P(18.8, 0.2, 1.0)} fov={34} drift={0.5} /></Shot>; };
const S_Collapse = () => { const f = useCurrentFrame(); const h = io(f, 7, 14, 0, 1); return <Shot><Scene act="throw" throwF={-100} hole={h} holeGlow={h}><Flying from={0} land={8} /></Scene><Cam p={P(17.4, 1.6, 1.0)} t={add(HOLE, [0, 0.1, 0])} fov={28} drift={f > 7 && f < 18 ? 3 : 0.4} /></Shot>; };
const S_Down = () => { const f = useCurrentFrame(); return <Shot><Scene hole={1} holeGlow={1} /><Cam p={add(HOLE, [0.35, 3.0 - f * 0.01, 0.9])} t={HOLE} fov={40} drift={0.3} /></Shot>; };
const S_MeFace: React.FC<{ k?: number; act?: Act; dig?: number }> = ({ k = 1.9, act = "stand", dig = 0 }) => { const f = useCurrentFrame(); const r = act === "after" ? faceTo(ME_AT, CAR) : PATH_RY; return <Shot><Scene hole={1} holeGlow={1} act={act} dig={dig} coat={act === "after" ? 0 : 0} /><Cam p={add(ME_FACE, [Math.sin(r) * (k - f * 0.004), 0.05, Math.cos(r) * (k - f * 0.004)])} t={add(ME_FACE, [0, -0.08, 0])} fov={19} drift={0.4} /></Shot>; };
const S_Crawl = () => { const f = useCurrentFrame(); const k = lin(f, 0, 80, 0, 1); const c: V = [ME_AT[0] + (ME_KNEEL[0] - ME_AT[0]) * k, 0, ME_AT[2] + (ME_KNEEL[2] - ME_AT[2]) * k]; return <Shot><Scene act="crawl" crawlK={k} hole={1} holeGlow={0.6} dig={0.4} /><Cam p={add(c, [-2.6, 0.9, 1.4])} t={add(c, [0, 0.4, 0])} fov={30} drift={0.6} /></Shot>; };
const S_DigClose = () => { const f = useCurrentFrame(); return <Shot><Scene act="dig" hole={1} holeGlow={0.5} dig={lin(f, 0, 40, 0.55, 0.8)} /><Cam p={add(ME_KNEEL, [-1.5, 0.95, 1.1 - f * 0.005])} t={add(DIG, [-0.2, 0.35, 0])} fov={30} drift={0.8} /></Shot>; };
const S_DigTop = () => { const f = useCurrentFrame(); return <Shot><Scene act="dig" hole={1} holeGlow={0.5} dig={lin(f, 0, 40, 0.8, 1)} /><Cam p={add(DIG, [0.4, 3.0 - f * 0.01, 0.8])} t={DIG} fov={40} drift={0.6} /></Shot>; };
const S_Pit: React.FC<{ fov?: number }> = ({ fov = 30 }) => { const f = useCurrentFrame(); return <Shot><Scene act="dig" hole={1} holeGlow={0.5} dig={1} coat={io(f, 4, 18, 0.3, 1)} /><Cam p={add(DIG, [-0.5, 1.5 - f * 0.004, 0.7])} t={add(DIG, [0, 0.03, 0])} fov={fov} drift={0.5} /></Shot>; };
const S_Rescue = () => { const f = useCurrentFrame(); return <Shot><Scene act="rescue" hole={1} holeGlow={0.4} dig={1} /><Cam p={add(JU_SIT, [-2.6 + f * 0.004, 1.15, 2.2])} t={add(JU_SIT, [0.3, 0.55, -0.2])} fov={30} drift={0.5} /></Shot>; };
const S_JuFace = () => { const f = useCurrentFrame(); const r = faceTo(JU_SIT, ME_KNEEL) + 0.8; const fc: V = add(JU_SIT, [0, HCJ - 0.47 * 1.38 * JUINOR.height + 0.02, 0]); return <Shot><Scene act="rescue" hole={1} dig={1} /><Cam p={add(fc, [Math.sin(r) * (1.9 - f * 0.004), 0.06, Math.cos(r) * (1.9 - f * 0.004)])} t={add(fc, [0, -0.06, 0])} fov={19} drift={0.4} /></Shot>; };
const S_Big = () => { const f = useCurrentFrame(); const k = 0.05 + f * 0.0016; const p: V = [BIG_A[0] + (BIG_B[0] - BIG_A[0]) * k, 0, BIG_A[2] + (BIG_B[2] - BIG_A[2]) * k]; return <Shot><Scene act="after" hole={1} dig={1} /><Cam p={add(p, [Math.cos(BIG_RY) * 0.9, 0.55, -Math.sin(BIG_RY) * 0.9])} t={add(p, [Math.sin(BIG_RY) * 2.5, 0, Math.cos(BIG_RY) * 2.5])} fov={32} drift={0.4} /></Shot>; };
const S_BigTrack = () => { const f = useCurrentFrame(); const k = 0.2 + f * 0.004; const p: V = [BIG_A[0] + (BIG_B[0] - BIG_A[0]) * k, 0, BIG_A[2] + (BIG_B[2] - BIG_A[2]) * k]; return <Shot><Scene act="after" hole={1} dig={1} storm={0.8} /><Cam p={add(p, [-Math.sin(BIG_RY) * 1.5, 1.3, -Math.cos(BIG_RY) * 1.5])} t={[CAR[0], 0.7, CAR[2]]} fov={30} drift={0.5} /></Shot>; };
const S_Lights: React.FC<{ on?: number }> = ({ on = 20 }) => { const f = useCurrentFrame(); const l = f < on ? 0 : f < on + 6 ? (f % 2 ? 1 : 0.2) : 1; return <Shot><Scene act="after" hole={1} dig={1} lights={l} storm={0.7} /><Cam p={P(20.6 - f * 0.006, 1.6, 1.3, 0)} t={[CAR[0], 0.9, CAR[2]]} fov={28} drift={0.4} /></Shot>; };

/** dig timer chip: counts game time a → b (seconds) across the cut */
const Timer: React.FC<{ a: number; b: number; len: number; label?: string }> = ({ a, b, len, label = "ถูกฝังมาแล้ว" }) => {
  const f = useCurrentFrame();
  const s = Math.floor(a + (b - a) * Math.min(1, f / len));
  return <Clock t={`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`} label={label} />;
};

/* ─── the edit ─── */
type Cut = { a: number; b: number; el: React.ReactNode };
const T = (n: number) => LINE[n - 1].t;
const E = (n: number) => LINE[n - 1].end;
const END = E(LINE.length) + 0.4;
const mid = (n: number) => (T(n) + E(n)) / 2;
const len = (a: number, b: number) => fr(b) - fr(a);
export const CUTS: Cut[] = [
  { a: 0, b: mid(1) + 0.3, el: <><S_Stop /><RuleSign /></> },
  { a: mid(1) + 0.3, b: T(3) - 0.1, el: <><S_Surface /><RuleTag /></> },
  { a: T(3) - 0.1, b: T(4) - 0.1, el: <><S_High /><Clock t="21:20" label="24 ธ.ค. · 18 เมตรจากรถ" /></> },
  { a: T(4) - 0.1, b: T(5) - 0.6, el: <S_DogDig /> },
  { a: T(5) - 0.6, b: T(6) - 0.1, el: <S_Throw /> },
  { a: T(6) - 0.1, b: T(7) - 0.1, el: <S_Collapse /> },
  { a: T(7) - 0.1, b: T(8) - 0.1, el: <><S_Down /><Measure value="3 ม." label="ความลึกของร่องเขา" x={960} y={120} w={420} /></> },
  { a: T(8) - 0.1, b: T(9) - 0.1, el: <><S_MeFace /><ProofCard title="ถูกหิมะฝัง แล้วขุดเจอภายใน 18 นาที" big="91" unit="% รอด" note="หลังจากนั้น โอกาสรอดดิ่งลงเร็วมาก" source="Brugger et al. 2001 · ข้อมูลหิมะถล่มสวิตเซอร์แลนด์" /></> },
  { a: T(9) - 0.1, b: T(10) - 0.1, el: <><S_Crawl /><Timer a={20} b={95} len={len(T(9), T(10))} /></> },
  { a: T(10) - 0.1, b: mid(10), el: <><S_DigClose /><Timer a={360} b={400} len={len(T(10), mid(10))} /></> },
  { a: mid(10), b: T(11) - 0.1, el: <><S_DigTop /><Timer a={600} b={640} len={len(mid(10), T(11))} /></> },
  { a: T(11) - 0.1, b: T(12) - 0.1, el: <><S_Pit /><Timer a={690} b={722} len={len(T(11), T(12))} /></> },
  { a: T(12) - 0.1, b: T(13) - 0.1, el: <><S_Pit fov={17} /><Clock t="12:04" label="เจอแล้ว" /></> },
  { a: T(13) - 0.1, b: T(14) - 0.1, el: <S_Rescue /> },
  { a: T(14) - 0.1, b: E(14) + 0.3, el: <S_JuFace /> },
  { a: E(14) + 0.3, b: T(16) - 0.1, el: <S_MeFace k={1.6} act="rescue" dig={1} /> },
  { a: T(16) - 0.1, b: T(17) - 0.1, el: <S_High hole={1} dig={1} act="after" /> },
  { a: T(17) - 0.1, b: T(18) - 0.1, el: <><S_Big /><Measure value="× 2" label="ใหญ่กว่าเท้าคน" x={1420} y={120} w={380} /></> },
  { a: T(18) - 0.1, b: T(19) - 0.1, el: <S_BigTrack /> },
  { a: T(19) - 0.1, b: END, el: <S_Lights on={fr(mid(19) - T(19))} /> },
  { a: END, b: DUR / FPS, el: <><BlurIn><S_Lights on={-100} /></BlurIn><NextCard /></> },
];

export const HERO_S = T(17) + 0.2;
export const Film: React.FC<{ noCaps?: boolean }> = ({ noCaps }) => (
  <AbsoluteFill style={{ background: "#07090F" }}>
    {CUTS.map((c, i) => (
      <Sequence key={i} from={fr(c.a)} durationInFrames={fr(c.b) - fr(c.a)}>
        <AbsoluteFill>{c.el}</AbsoluteFill>
      </Sequence>
    ))}
    <Flash at={fr(T(6) - 0.1) + 8} c="rgba(10,14,24,0.95)" />
    <Flash at={fr(HERO_S)} c="rgba(170,200,255,0.9)" />
    <Flash at={fr(mid(19))} c="rgba(255,244,214,0.9)" />
    <Vig a={0.36} />
    <FadeOut from={DUR - 24} />
    <Grain amount={0.045} />
    {noCaps ? null : <Captions hideFrom={END} />}
  </AbsoluteFill>
);
