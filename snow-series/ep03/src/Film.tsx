import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Cam, Shot, type V3 } from "./kit/three";
import { BlurIn, DUR, FPS, FadeOut, Flash, Grain, LINE, Vig, fr, io, lin } from "./kit/ui";
import { Char, headCenter, type Look, type Pose } from "./rig/char";
import { JU_LIGHT, ME_S, YETI } from "./rig/cast";
import { CROUCH, RUN_STRIDE, SIT, reachPose, runPose, walkPose, WALK_STRIDE } from "./rig/poses";
import { Dog } from "./rig/pets";
import { CAR, MNT, PRINT_END, Snow, type SnowProps } from "./sets/snow";
import { Captions } from "./ui/captions";
import { Clock, Knocks, Measure, NextCard, ProofCard, RuleSign, RuleTag } from "./ui/cards";

/** EP3 — "ใครอยู่ในรถ" (16:9, ~59 s, fiction). We sneak back to the car whose lights switched on,
 *  find a yeti in the driver's seat, swap places with it, and it chases the car down the road…
 *  except it is not chasing us: it is running from the crack on the mountain (planted from the first shot). */

type V = V3;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const faceTo = (from: V, to: V) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const blink = (f: number, s = 0) => ((f + s * 23) % 83 < 4 ? 1 : 0);
const sec = (f: number) => f / FPS;
void PRINT_END;

/* ─── staging ─── */
const DOOR_OUT: V = [CAR[0] + 1.75, 0, CAR[2] - 0.35];    // standing at the driver door
const ME_FROM: V = [CAR[0] + 6.5, 0, CAR[2] - 5.5];       // where the sneak starts (coming from the hole)
const JU_AT: V = [CAR[0] + 2.7, 0, CAR[2] - 1.5];
const DOG_AT: V = [CAR[0] + 2.4, 0, CAR[2] + 0.5];
const YETI_OUT: V = [CAR[0] + 3.4, 0, CAR[2] + 0.4];
const YETI_CAR: Look = { ...YETI, height: 1.05 };          // folded into the driver seat
const HC_ME = headCenter(ME_S);
const ME_FACE: V = [DOOR_OUT[0], HC_ME + 0.03, DOOR_OUT[2]];
const SPEED = 9; // m/s on screen (the VO says 60 km/h; the picture keeps the trees readable)
const YETI_STRIDE = RUN_STRIDE * (1.15 / 1.38) * (YETI.height / 0.88);

/** yeti sitting in the driver seat (car-local coordinates), hugging the wheel; look = glance back at the mountain */
const YetiInCar: React.FC<{ look?: number; turn?: number }> = ({ look = 0, turn = 0 }) => {
  const f = useCurrentFrame();
  const pose: Pose = { ...SIT, y: -0.42, spine: [0.55, 0, 0], shL: [-1.35, 0, 0.2], shR: [-1.35, 0, -0.2], elL: -1.2, elR: -1.2, head: [0.15, look * 2.4 + turn * -1.4, 0], blink: blink(f, 3), browUp: 0.8 };
  return <Char L={YETI_CAR} p={[0.35, 0.18, -0.45]} ry={0} pose={pose} seed={5} />;
};

type Act = "sneak" | "door" | "roar" | "gone";
const Scene: React.FC<SnowProps & { act?: Act; sneakK?: number; juLight?: number; growl?: boolean; yetiIn?: boolean; yetiLook?: number; yetiTurn?: number; roar?: number; reach?: number }> = ({ act = "sneak", sneakK = 1, juLight = 1, growl, yetiIn = true, yetiLook = 0, yetiTurn = 0, roar = 0, reach = 0, children, ...snow }) => {
  const f = useCurrentFrame();
  const meP: V = [ME_FROM[0] + (DOOR_OUT[0] - ME_FROM[0]) * sneakK, 0, ME_FROM[2] + (DOOR_OUT[2] - ME_FROM[2]) * sneakK];
  const sneaking = act === "sneak" && sneakK < 1;
  const mePose: Pose = sneaking
    ? { ...walkPose((sneakK * 7.2 / WALK_STRIDE) * Math.PI * 2, 0.6), spine: [0.45, 0, 0], y: -0.08, shL: [-2.3, -0.2, -0.55], elL: -2.1, head: [0.1, 0, 0], browUp: 0.8 }
    : act === "roar"
      ? { ...CROUCH, spine: [-0.2, 0, 0], shL: [-1.4, 0, 0.6], shR: [-1.4, 0, -0.6], elL: -0.3, elR: -0.3, head: [-0.2, 0, 0], browUp: 1, mouth: 0.4, blink: 0 }
      : { ...reachPose(reach), shL: [-2.3, -0.2, -0.55], elL: -2.1, head: [0.05, 0, 0], browUp: 0.9, blink: blink(f) };
  const meRy = sneaking ? faceTo(ME_FROM, DOOR_OUT) : faceTo(DOOR_OUT, [CAR[0], 0, DOOR_OUT[2]]);
  const juP: V = sneaking ? add(meP, [1.1, 0, -1.0]) : JU_AT;
  const juPose: Pose = act === "roar" ? { ...CROUCH, spine: [-0.1, 0, 0], shL: [-1.5, 0, 0.5], shR: [-1.5, 0, -0.5], browUp: 1, mouth: 0.4 } : sneaking ? { ...walkPose((sneakK * 7.2 / WALK_STRIDE) * Math.PI * 2 + 1.5, 0.6), spine: [0.45, 0, 0], y: -0.08 } : { ...CROUCH, y: -0.25, spine: [0.3, 0, 0], head: [-0.1, 0, 0], browUp: 0.7, blink: blink(f, 2) };
  return (
    <Snow lights={1} storm={0.9} {...snow} inCar={yetiIn ? <YetiInCar look={yetiLook} turn={yetiTurn} /> : null}>
      <pointLight position={add(ME_FACE, [0.8, 0.5, 1.2])} intensity={1.3} distance={4} color="#E6ECFF" />
      {act !== "gone" ? <>
        <Char L={ME_S} p={meP} ry={meRy} pose={mePose} seed={1} />
        <Char L={JU_LIGHT} p={juP} ry={faceTo(juP, CAR)} pose={juPose} seed={2} />
        {juLight > 0 ? <pointLight position={add(juP, [-0.4, 1.0, 0.3])} intensity={1.4 * juLight} distance={4} color="#FFF0C8" /> : null}
        <Dog p={sneaking ? add(meP, [-0.3, 0, 0.9]) : DOG_AT} ry={faceTo(DOG_AT, CAR)} s={1.35} pose={{ head: [0, growl ? 0.25 : 0], whine: growl ? 0.5 + 0.5 * Math.abs(Math.sin(f / 2.5)) : 0, tail: growl ? 0 : f / 6, walk: sneaking ? f / 2 : growl ? f * 1.4 : 0, amp: sneaking ? 0.6 : growl ? 0.06 : 0 }} />
      </> : null}
      {roar > 0 ? <>
        <Char L={YETI} p={YETI_OUT} ry={faceTo(YETI_OUT, DOOR_OUT) + 0.6} pose={{ shL: [-2.7 * roar, 0, 0.7], shR: [-2.7 * roar, 0, -0.7], elL: -0.6, elR: -0.6, spine: [-0.25 * roar, 0, 0], head: [-0.35 * roar, 0, 0], mouth: roar, browUp: 0, blink: 0 }} seed={5} />
        <pointLight position={add(YETI_OUT, [1.2, 2.4, 1.6])} intensity={1.6} distance={6} color="#E6ECFF" />
      </> : null}
      {children}
    </Snow>
  );
};

/* ─── shots ─── */
const S_Front = () => { const f = useCurrentFrame(); return <Shot><Scene act="gone" crack={0.45} /><Cam p={[CAR[0] + 2.6, 1.2, CAR[2] + 12 - f * 0.02]} t={[CAR[0] - 15, 8, CAR[2] - 30]} fov={40} drift={0.4} /></Shot>; };
const S_Glare = () => { const f = useCurrentFrame(); return <Shot><Scene act="gone" crack={0.45} /><Cam p={[CAR[0] + 0.4, 0.75, CAR[2] + 5.0 - f * 0.02]} t={[CAR[0], 0.7, CAR[2]]} fov={30} drift={0.6} /></Shot>; };
const S_Face: React.FC<{ act?: Act; k?: number }> = ({ act = "door", k = 1.9 }) => { const f = useCurrentFrame(); const r = faceTo(DOOR_OUT, [CAR[0], 0, DOOR_OUT[2]]) - 0.5; return <Shot><Scene act={act} /><Cam p={add(ME_FACE, [Math.sin(r) * (k - f * 0.004), 0.05, Math.cos(r) * (k - f * 0.004)])} t={add(ME_FACE, [0, -0.08, 0])} fov={20} drift={0.4} /></Shot>; };
const S_Sneak = () => { const f = useCurrentFrame(); const k = lin(f, 0, 75, 0.1, 0.85); const c: V = [ME_FROM[0] + (DOOR_OUT[0] - ME_FROM[0]) * k, 0, ME_FROM[2] + (DOOR_OUT[2] - ME_FROM[2]) * k]; return <Shot><Scene sneakK={k} /><Cam p={add(c, [3.2, 1.2, 2.0])} t={add(c, [-0.8, 0.7, -0.3])} fov={32} drift={0.5} /></Shot>; };
const S_JuLight = () => { const f = useCurrentFrame(); const off = f < 18 ? 1 : 0; return <Shot><Scene juLight={off} /><Cam p={add(JU_AT, [2.0, 1.1, 1.1])} t={add(JU_AT, [0, 0.75, 0])} fov={24} drift={0.4} /></Shot>; };
const S_Growl = () => { const f = useCurrentFrame(); return <Shot><Scene juLight={0} growl /><Cam p={add(DOG_AT, [1.3 - f * 0.004, 0.45, 0.9])} t={add(DOG_AT, [0, 0.3, 0])} fov={28} drift={0.6} /></Shot>; };
const S_Window = () => { const f = useCurrentFrame(); return <Shot><Scene juLight={0} yetiLook={io(f, 20, 40, 0, 1) - io(f, 50, 62, 0, 1)} /><Cam p={[CAR[0] + 2.9 - f * 0.005, 1.3, CAR[2] + 2.6]} t={[CAR[0] + 0.5, 1.08, CAR[2] - 0.45]} fov={26} drift={0.4} /></Shot>; };
const S_Count: React.FC<{ open: number }> = ({ open }) => { const f = useCurrentFrame(); return <Shot><Scene juLight={0} reach={io(f, 0, 12, 0, 0.85)} door={io(f, open, open + 6, 0, 1)} /><Cam p={[CAR[0] + 4.4 - f * 0.005, 1.5, CAR[2] + 2.9]} t={[CAR[0] + 1.5, 1.0, CAR[2] - 0.5]} fov={30} drift={0.5} /></Shot>; };
const S_Reveal = () => { const f = useCurrentFrame(); return <Shot><Scene juLight={0} door={1} reach={0.3} yetiTurn={io(f, 6, 18, 0, 1)} /><Cam p={[CAR[0] + 2.4 - f * 0.004, 1.35, CAR[2] + 1.9]} t={[CAR[0] + 0.45, 1.0, CAR[2] - 0.5]} fov={28} drift={0.4} /></Shot>; };
const S_Roar = () => { const f = useCurrentFrame(); const r = io(f, 0, 10, 0.3, 1); return <Shot><Scene act="roar" juLight={0} door={1} yetiIn={false} roar={r} /><Cam p={add(YETI_OUT, [3.6, 0.6, 4.2 - f * 0.01])} t={add(YETI_OUT, [-0.3, 1.9, 0])} fov={32} drift={f < 20 ? 3.5 : 1} /></Shot>; };
const S_Slam = () => { const f = useCurrentFrame(); return <Shot><Scene act="gone" door={1 - io(f, 18, 26, 0, 1)} yetiIn={false} roar={0.5}>{null}</Scene><Cam p={[CAR[0] + 7.5, 1.6, CAR[2] - 4.5 + f * 0.01]} t={[CAR[0] + 1.2, 1.0, CAR[2]]} fov={30} drift={f > 18 && f < 30 ? 3 : 0.6} /></Shot>; };
const carAt = (f: number, f0: number): V => [CAR[0], 0, CAR[2] + Math.max(0, sec(f - f0)) ** 2 * 2.5];
const S_Start = () => { const f = useCurrentFrame(); const c = carAt(f, 22); const l = f < 10 ? 1 : f < 18 ? (f % 2 ? 1.2 : 0.4) : 1.25; return <Shot><Scene act="gone" lights={l} yetiIn={false} car={c} /><Cam p={[CAR[0] + 1.6, 0.55, CAR[2] + 9 + f * 0.01]} t={add(c, [0, 0.8, 0])} fov={30} drift={f > 18 && f < 30 ? 2 : 0.5} /></Shot>; };
/** the chase: car and yeti both moving +z; t0 = seconds already driven when the shot starts */
const chase = (f: number, t0: number) => { const t = t0 + sec(f); const z = CAR[2] + 6 + t * SPEED; return { car: [CAR[0], 0, z] as V, yeti: [CAR[0] - 2.0, 0, z - 6 + Math.sin(t * 1.3) * 0.6] as V, d: t * SPEED }; };
const Chase: React.FC<{ t0: number; look?: number; crack?: number; slide?: number }> = ({ t0, look = 0, crack = 0.4, slide = 0 }) => {
  const f = useCurrentFrame(); const c = chase(f, t0);
  return (
    <Scene act="gone" yetiIn={false} car={c.car} crack={crack} slide={slide}>
      <Char L={YETI} p={c.yeti} ry={0} pose={{ ...runPose(c.d * (RUN_STRIDE / YETI_STRIDE), 0.4, 1), head: [-0.1, look * -2.6, 0], mouth: 0.5, browUp: look > 0.5 ? 1 : 0.2 }} seed={5} />
      <pointLight position={add(c.yeti, [2, 2.6, 2])} intensity={1.6} distance={7} color="#E6ECFF" />
    </Scene>
  );
};
const S_ChaseSide: React.FC<{ t0: number; k?: number; fov?: number }> = ({ t0, k = 9, fov = 34 }) => { const f = useCurrentFrame(); const c = chase(f, t0); return <Shot><Chase t0={t0} /><Cam p={[c.car[0] - k * 0.8, 1.5, c.car[2] + 3.2]} t={[c.car[0] - 1.3, 1.4, c.car[2] - 5.5]} fov={fov} drift={1.2} /></Shot>; };
const S_ChaseHigh: React.FC<{ t0: number }> = ({ t0 }) => { const f = useCurrentFrame(); const c = chase(f, t0); return <Shot><Chase t0={t0} crack={0.5} /><Cam p={[c.car[0] - 0.4, 3.6, c.car[2] + 6]} t={[c.car[0] - 1.2, 1.4, c.car[2] - 16]} fov={46} drift={0.8} /></Shot>; };
const S_YetiLook: React.FC<{ t0: number }> = ({ t0 }) => { const f = useCurrentFrame(); const c = chase(f, t0); const hc = headCenter(YETI); return <Shot><Chase t0={t0} look={io(f, 4, 14, 0, 1)} crack={0.6} /><Cam p={[c.yeti[0] + 0.9, hc + 0.25, c.yeti[2] - 4.4]} t={[c.yeti[0], hc - 0.05, c.yeti[2]]} fov={22} drift={1.2} /></Shot>; };
const S_Mountain: React.FC<{ crack?: [number, number]; slide?: [number, number] }> = ({ crack = [0.4, 1], slide = [0, 0] }) => { const f = useCurrentFrame(); const k = io(f, 0, 50, 0, 1); return <Shot tilt={false}><Scene act="gone" yetiIn={false} crack={crack[0] + (crack[1] - crack[0]) * k} slide={slide[0] + (slide[1] - slide[0]) * k} storm={0.6} /><Cam p={[CAR[0] + 0.5, 3.0, CAR[2] + 40 - f * 0.05]} t={[MNT[0], 26, MNT[2]]} fov={24} drift={slide[1] > 0 ? 1.6 : 0.4} /></Shot>; };

/* ─── the edit ─── */
type Cut = { a: number; b: number; el: React.ReactNode };
const T = (n: number) => LINE[n - 1].t;
const E = (n: number) => LINE[n - 1].end;
const END = E(LINE.length) + 0.4;
const mid = (n: number) => (T(n) + E(n)) / 2;
const at = (base: number, s: number) => fr(s) - fr(base);
const L8 = T(8) - 0.1;
export const CUTS: Cut[] = [
  { a: 0, b: mid(1) + 0.3, el: <><S_Front /><RuleSign /></> },
  { a: mid(1) + 0.3, b: T(3) - 0.1, el: <><S_Glare /><RuleTag /></> },
  { a: T(3) - 0.1, b: T(4) - 0.1, el: <><S_Face act="door" /><ProofCard title="ตาแต่ละข้าง ปรับความมืดแยกกัน" big="20" unit="นาที" note="กว่าจะมองในที่มืดได้เต็มที่ · ปิดตาไว้ 1 ข้าง = เก็บตานั้นไว้ใช้" source="ข้อมูลการปรับตัวในที่มืดของจอประสาทตา (dark adaptation) ≈ 20–30 นาที" /></> },
  { a: T(4) - 0.1, b: T(5) - 0.1, el: <S_Sneak /> },
  { a: T(5) - 0.1, b: T(6) - 0.1, el: <><S_JuLight /><Clock t="21:40" label="24 ธ.ค. · ข้างรถ" /></> },
  { a: T(6) - 0.1, b: T(7) - 0.1, el: <S_Growl /> },
  { a: T(7) - 0.1, b: L8, el: <S_Window /> },
  { a: L8, b: T(9) - 0.1, el: <><S_Count open={at(L8, E(8) - 0.35)} /><Knocks at={[at(L8, T(8) + 0.4)]} word="หนึ่ง" x={1250} y={300} /><Knocks at={[at(L8, T(8) + 0.75)]} word="สอง" x={1420} y={260} /><Knocks at={[at(L8, T(8) + 1.1)]} word="สาม" x={1590} y={220} /></> },
  { a: T(9) - 0.1, b: T(10) - 0.1, el: <><S_Reveal /><Measure value="2.5 ม." label="ความสูง" x={1500} y={110} w={380} /></> },
  { a: T(10) - 0.1, b: T(11) - 0.1, el: <S_Roar /> },
  { a: T(11) - 0.1, b: T(12) - 0.1, el: <S_Slam /> },
  { a: T(12) - 0.1, b: T(13) - 0.1, el: <S_Start /> },
  { a: T(13) - 0.1, b: T(14) - 0.1, el: <S_ChaseSide t0={0} k={4.4} fov={44} /> },
  { a: T(14) - 0.1, b: T(15) - 0.1, el: <><S_ChaseSide t0={2} k={4.0} fov={40} /><Measure value="60 กม./ชม." label="ความเร็วรถ" x={960} y={90} w={640} /></> },
  { a: T(15) - 0.1, b: T(16) - 0.1, el: <S_ChaseHigh t0={4} /> },
  { a: T(16) - 0.1, b: T(17) - 0.1, el: <S_YetiLook t0={6} /> },
  { a: T(17) - 0.1, b: T(18) - 0.1, el: <S_Mountain crack={[0.4, 1]} /> },
  { a: T(18) - 0.1, b: END, el: <S_Mountain crack={[1, 1]} slide={[0, 0.75]} /> },
  { a: END, b: DUR / FPS, el: <><BlurIn><S_Mountain crack={[1, 1]} slide={[0.75, 0.9]} /></BlurIn><NextCard /></> },
];

export const HERO_S = T(16) + 0.4;
export const Film: React.FC<{ noCaps?: boolean }> = ({ noCaps }) => (
  <AbsoluteFill style={{ background: "#07090F" }}>
    {CUTS.map((c, i) => (
      <Sequence key={i} from={fr(c.a)} durationInFrames={fr(c.b) - fr(c.a)}>
        <AbsoluteFill>{c.el}</AbsoluteFill>
      </Sequence>
    ))}
    <Flash at={fr(mid(1) + 0.3)} c="rgba(255,250,235,1)" />
    <Flash at={fr(T(10) - 0.1)} c="rgba(255,255,255,0.9)" />
    <Flash at={fr(HERO_S)} c="rgba(170,200,255,0.9)" />
    <Flash at={fr(T(18) + 0.3)} c="rgba(255,255,255,0.95)" />
    <Vig a={0.36} />
    <FadeOut from={DUR - 24} />
    <Grain amount={0.045} />
    {noCaps ? null : <Captions hideFrom={END} />}
  </AbsoluteFill>
);
