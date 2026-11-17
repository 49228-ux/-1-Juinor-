import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Cam, Shot, type V3 } from "./kit/three";
import { BlurIn, CREAM, DUR, FPS, FadeOut, Flash, Grain, INK, LINE, PAPER, RED, SANS, Vig, Click, fr, useSpr } from "./kit/ui";
import { Char, type Look, type Pose } from "./rig/char";
import { JUINOR, ME_S, YETI } from "./rig/cast";
import { CROUCH, SIT } from "./rig/poses";
import { Dog } from "./rig/pets";
import { CAR, Snow, TRAIL_Z, type SnowProps } from "./sets/snow";
import { Captions } from "./ui/captions";
import { Clock, NextCard, ProofCard, RuleSign, RuleTag } from "./ui/cards";

/** EP4 — "หนีหิมะถล่ม" (16:9, ~58 s, fiction). Car escape down the road, a hard turn onto the logging trail,
 *  the car jumps a snowbank, the yeti lands on the roof, the avalanche buries the road behind us.
 *  Twist planted on screen: the HUD clock runs BACKWARDS all episode (21:50 → 21:49 → 21:48 → 21:47). */

type V = V3;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sec = (f: number) => f / FPS;
const blink = (f: number, s = 0) => ((f + s * 23) % 83 < 4 ? 1 : 0);

/* ─── the drive: straight up the road, a right-angle turn onto the trail (radius R), then along the trail ─── */
const V_CAR = 12, R = 6, Z0 = 0;
const ZT = TRAIL_Z - R;                       // where the turn starts
const L_STRAIGHT = ZT - Z0, L_ARC = (Math.PI / 2) * R, L_STOP = L_STRAIGHT + L_ARC + 19;
type CarState = { p: V; ry: number };
/** car position + heading after driving for t seconds (eases to a stop on the trail) */
const drive = (t: number): CarState => {
  const sRaw = t * V_CAR;
  const s = sRaw < L_STOP - 8 ? sRaw : L_STOP - 8 * Math.exp(-(sRaw - (L_STOP - 8)) / 8);
  if (s < L_STRAIGHT) return { p: [CAR[0], 0, Z0 + s], ry: 0 };
  if (s < L_STRAIGHT + L_ARC) {
    const th = (s - L_STRAIGHT) / R;
    const jump = th > 0.55 && th < 1.45 ? Math.sin(((th - 0.55) / 0.9) * Math.PI) * 1.1 : 0;
    return { p: [CAR[0] + R - R * Math.cos(th), jump, ZT + R * Math.sin(th)], ry: th };
  }
  return { p: [CAR[0] + R + (s - L_STRAIGHT - L_ARC), 0, TRAIL_Z], ry: Math.PI / 2 };
};
/** avalanche front: faster than the car, stops once it has buried the trail mouth */
const avalAt = (t: number) => Math.min(-58 + t * 17, 72);
/** car-local point → world */
const W = (c: CarState, l: V): V => [c.p[0] + l[0] * Math.cos(c.ry) + l[2] * Math.sin(c.ry), c.p[1] + l[1], c.p[2] - l[0] * Math.sin(c.ry) + l[2] * Math.cos(c.ry)];

/* ─── who is in / on the car (car-local) ─── */
type In = "drive" | "point" | "yank" | "lick" | "shock";
const Inside: React.FC<{ act: In; yeti?: number; laugh?: boolean }> = ({ act, yeti = -999, laugh }) => {
  const f = useCurrentFrame();
  const wheel = act === "yank" ? Math.min(1, f / 6) : 0;
  const me: Pose = { ...SIT, y: -0.3, shL: [-1.15, 0, 0.15 + wheel * 0.5], shR: [-1.15, 0, -0.15 + wheel * 0.5], elL: -0.7, elR: -0.7, spine: [0.05, wheel * 0.3, 0], head: [0, act === "lick" ? -0.4 : 0, 0], browUp: act === "shock" || act === "yank" ? 1 : 0.6, mouth: act === "yank" ? 0.4 : act === "lick" ? 0.2 : 0, blink: act === "lick" ? (f % 30 < 15 ? 1 : 0) : blink(f) };
  const ju: Pose = act === "point" ? { ...SIT, y: -0.3, shL: [-1.55, -0.5, 0.2], elL: -0.05, head: [0, 0.35, 0], browUp: 1, mouth: 0.35 } : { ...SIT, y: -0.3, head: [0, act === "lick" ? 0.4 : 0, 0], browUp: 0.8, mouth: act === "lick" ? 0.3 : 0, blink: blink(f, 2) };
  const drop = yeti > -999 ? Math.max(0, 1 - (f - yeti) / 9) : 0;
  return (
    <group>
      <pointLight position={[0, 1.25, 0.6]} intensity={0.9} distance={2.2} color="#FFE8C8" />
      <Char L={ME_S} p={[0.38, 0.2, -0.55]} pose={me} seed={1} scale={0.82} />
      <Char L={JUINOR} p={[-0.38, 0.2, -0.55]} pose={ju} seed={2} scale={0.82} />
      <Dog p={act === "lick" ? [0.12, 0.84, -0.45] : [0, 0.86, -1.05]} ry={act === "lick" ? 1.2 : 0} s={0.75} pose={{ head: [act === "lick" ? 0.2 : 0, 0], lick: act === "lick" ? Math.abs(Math.sin(f / 3)) : 0, tail: f / 3 }} />
      {yeti > -999 && f >= yeti - 9 ? (
        <Char L={{ ...YETI, height: 1.15 } as Look} p={[0, 1.42 + drop * 2.5, -0.35]} pose={{ ...CROUCH, spine: [0.9, 0, 0], shL: [-0.9, 0, 1.1], shR: [-0.9, 0, -1.1], elL: -0.3, elR: -0.3, head: [laugh ? -0.5 : -0.25, 0, 0], mouth: laugh ? 0.6 + 0.4 * Math.abs(Math.sin(f / 2.5)) : 0.3, browUp: 1, blink: laugh ? 1 : 0 }} seed={5} />
      ) : null}
    </group>
  );
};

/** one world for every shot: the car at drive(t), the avalanche at avalAt(t) */
const World: React.FC<SnowProps & { t: number; act?: In; yeti?: number; laugh?: boolean; noAval?: boolean }> = ({ t, act = "drive", yeti = -999, laugh, noAval, children, ...snow }) => {
  const c = drive(t);
  return (
    <Snow lights={1} storm={0.8} crack={1} car={c.p} carRy={c.ry} aval={noAval ? undefined : avalAt(t)} inCar={<Inside act={act} yeti={yeti} laugh={laugh} />} {...snow}>
      <pointLight position={add(c.p, [0, 3.2, 0])} intensity={1.4} distance={7} color="#E6ECFF" />
      {children}
    </Snow>
  );
};

/* ─── shots (t0 = drive time in seconds when the shot starts; k = slow motion factor) ─── */
const useT = (t0: number, k = 1) => t0 + sec(useCurrentFrame()) * k;
const S_Rear = () => { const t = useT(0); const c = drive(t); return <Shot><World t={t} /><Cam p={add(c.p, [-1.4, 1.5, 13])} t={add(c.p, [0.5, 2.2, -30])} fov={40} drift={0.9} /></Shot>; };
const S_Wall = () => { const t = useT(0.9); const a = avalAt(t); return <Shot><World t={t} /><Cam p={[-1.2, 1.4, a + 14]} t={[-3, 3.2, a]} fov={46} drift={2.2} /></Shot>; };
const S_Side = () => { const t = useT(1.5); const c = drive(t); return <Shot><World t={t} /><Cam p={[-3.0, 1.5, c.p[2] + 6]} t={[1.2, 1.6, c.p[2] - 12]} fov={46} drift={1.4} /></Shot>; };
const S_Top = () => { const t = useT(2.4); const c = drive(t); return <Shot><World t={t} /><Cam p={[c.p[0] - 9, 16, c.p[2] - 4]} t={[c.p[0] + 6, 0, c.p[2] + 14]} fov={46} drift={0.6} /></Shot>; };
const S_Shield: React.FC<{ t0: number; act: In; dist?: number; yeti?: number; laugh?: boolean; fov?: number; noAval?: boolean }> = ({ t0, act, dist = 3.2, yeti = -999, laugh, fov = 32, noAval }) => { const t = useT(t0); const c = drive(t); return <Shot><World t={t} act={act} yeti={yeti} laugh={laugh} noAval={noAval} /><Cam p={W(c, [0.05, 1.3, dist])} t={W(c, [0, 1.05, -0.4])} fov={fov} drift={act === "yank" ? 2.5 : 0.8} /></Shot>; };
const S_Jump = () => { const t = useT(3.85, 0.45); const c = drive(t); return <Shot><World t={t} /><Cam p={[15, 2.0, 41]} t={add(c.p, [0, 1.0, 0])} fov={34} drift={0.8} /></Shot>; };
const S_Land = () => { const t = useT(4.75); const c = drive(t); const f = useCurrentFrame(); return <Shot><World t={t} yeti={6} /><Cam p={W(c, [-2.2, 2.6, -7.5])} t={add(c.p, [0, 1.5, 0])} fov={36} drift={f > 6 && f < 18 ? 3.5 : 1} /></Shot>; };
const S_Roof = () => { const t = useT(5.2); const c = drive(t); return <Shot><World t={t} yeti={-30} /><Cam p={W(c, [4.6, 2.7, 2.8])} t={W(c, [0, 1.7, -0.3])} fov={40} drift={1.4} /></Shot>; };
const S_Sweep = () => { const t = useT(5.6); return <Shot><World t={t} yeti={-30} /><Cam p={[18, 2.4, 47]} t={[2, 2.4, 51]} fov={50} drift={2.0} /></Shot>; };
const S_Gone = () => { const t = useT(8.5); return <Shot><World t={t} yeti={-30} /><Cam p={[15, 3.6, 52]} t={[0, 1.5, 47]} fov={46} drift={0.5} /></Shot>; };
const S_Quiet = () => { const t = useT(10); const c = drive(t); return <Shot><World t={t} yeti={-30} storm={0.5} /><Cam p={[c.p[0] - 9, 2.1, TRAIL_Z + 1.2]} t={add(c.p, [0, 1.1, 0])} fov={30} drift={0.4} /></Shot>; };

/* ─── 2D overlays for the twist ─── */
const chip: React.CSSProperties = { background: "rgba(246,242,234,0.94)", color: INK, fontFamily: SANS, fontWeight: 700, borderRadius: 12, padding: "8px 22px 12px", boxShadow: "0 6px 16px rgba(0,0,0,0.35)", fontSize: 54, fontVariantNumeric: "tabular-nums" };
/** the four clock readings of this episode, popping in a row, with a red "backwards" arrow */
const ClockReplay: React.FC = () => {
  const f = useCurrentFrame();
  const times = ["21:50", "21:49", "21:48", "21:47"];
  const arrow = useSpr(4 * 9 + 4, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26, top: -120 }}>
      <div style={{ display: "flex", gap: 26 }}>
        {times.map((t, i) => { const k = Math.min(1, Math.max(0, (f - i * 9) / 6)); return <div key={t} style={{ ...chip, opacity: k, translate: `0 ${(1 - k) * 30}px` }}><Click at={i * 9} v={0.3} kind="tick" />{t}</div>; })}
      </div>
      <div style={{ opacity: arrow, fontFamily: SANS, fontWeight: 700, fontSize: 48, color: "#FFF6EE", background: RED, borderRadius: 12, padding: "4px 26px 10px", scale: String(0.8 + 0.2 * arrow) }}>◀ เดินถอยหลัง</div>
    </AbsoluteFill>
  );
};
/** the date flips back day by day: 24 ธ.ค. → 24 พ.ย. */
const DateSpin: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const k = Math.min(1, f / Math.max(1, len - 12));
  const back = Math.floor(k * 30); // days back
  const day = back <= 23 ? 24 - back : 30 - (back - 24);
  const month = back <= 23 ? "ธ.ค." : "พ.ย.";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: -80 }}>
      <div style={{ ...chip, fontSize: 130, padding: "10px 46px 22px", color: back >= 30 ? RED : INK }}>{`${day} ${month}`}</div>
      <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 600, fontSize: 36, color: CREAM, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{`ย้อนไปแล้ว ${back} วัน`}</div>
      {back % 2 === 0 && f < len ? <Click at={f} v={0.12} kind="tick" /> : null}
    </AbsoluteFill>
  );
};
/** 10 → 0, one beat per step, then a white-out */
const Countdown: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const step = len / 11, n = Math.max(0, 10 - Math.floor(f / step)), local = (f % step) / step;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: -70 }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 260, color: n <= 3 ? RED : PAPER, opacity: 1 - local * 0.6, scale: String(1.25 - local * 0.25), textShadow: "0 8px 30px rgba(0,0,0,0.7)" }}>{n}</div>
      {Array.from({ length: 11 }, (_, i) => <Click key={i} at={Math.round(i * step)} v={0.35} kind="tick" />)}
    </AbsoluteFill>
  );
};

/* ─── the edit ─── */
type Cut = { a: number; b: number; el: React.ReactNode };
const T = (n: number) => LINE[n - 1].t;
const E = (n: number) => LINE[n - 1].end;
const END = E(LINE.length) + 3.9; // the 3.5 s pause after the last line holds the 10→0 countdown
const mid = (n: number) => (T(n) + E(n)) / 2;
const len = (a: number, b: number) => fr(b) - fr(a);
const CD_A = E(17) + 0.1; // countdown after the last line
export const CUTS: Cut[] = [
  { a: 0, b: mid(1) + 0.3, el: <><S_Rear /><RuleSign /></> },
  { a: mid(1) + 0.3, b: T(3) - 0.1, el: <S_Wall /> },
  { a: T(3) - 0.1, b: T(4) - 0.1, el: <><S_Side /><ProofCard title="หิมะถล่ม วิ่งเร็วได้ถึง" big="130" unit="กม./ชม." note="เร็วกว่ารถบนถนนหิมะ · ทางรอดคือออกด้านข้าง" source="คำแนะนำความปลอดภัยหิมะถล่ม (avalanche safety)" /></> },
  { a: T(4) - 0.1, b: T(5) - 0.1, el: <><S_Top /><RuleTag text="หนีออกด้านข้าง" /></> },
  { a: T(5) - 0.1, b: T(6) - 0.1, el: <><S_Shield t0={3.0} act="point" /><Clock t="21:50" label="24 ธ.ค." /></> },
  { a: T(6) - 0.1, b: T(7) - 0.1, el: <S_Shield t0={3.55} act="yank" dist={2.6} /> },
  { a: T(7) - 0.1, b: T(8) - 0.1, el: <S_Jump /> },
  { a: T(8) - 0.1, b: T(9) - 0.1, el: <S_Land /> },
  { a: T(9) - 0.1, b: T(10) - 0.1, el: <><S_Roof /><Clock t="21:49" label="24 ธ.ค." /></> },
  { a: T(10) - 0.1, b: T(11) - 0.1, el: <><S_Sweep /><Clock t="21:48" label="24 ธ.ค." /></> },
  { a: T(11) - 0.1, b: T(12) - 0.1, el: <S_Gone /> },
  { a: T(12) - 0.1, b: T(13) - 0.1, el: <S_Quiet /> },
  { a: T(13) - 0.1, b: T(14) - 0.1, el: <><S_Shield t0={10} act="lick" yeti={-30} laugh noAval /><Clock t="21:47" label="24 ธ.ค." /></> },
  { a: T(14) - 0.1, b: T(15) - 0.1, el: <S_Shield t0={10} act="shock" dist={2.0} fov={24} yeti={-30} noAval /> },
  { a: T(15) - 0.1, b: T(16) - 0.1, el: <><BlurIn px={8}><S_Shield t0={10} act="shock" dist={2.0} fov={24} yeti={-30} noAval /></BlurIn><ClockReplay /></> },
  { a: T(16) - 0.1, b: T(17) - 0.1, el: <><BlurIn px={10}><S_Quiet /></BlurIn><DateSpin len={len(T(16) - 0.1, T(17) - 0.1)} /></> },
  { a: T(17) - 0.1, b: CD_A, el: <S_Shield t0={10} act="shock" dist={2.3} fov={28} yeti={-30} noAval /> },
  { a: CD_A, b: END, el: <><BlurIn px={6} len={8}><S_Shield t0={10} act="shock" dist={2.3} fov={28} yeti={-30} noAval /></BlurIn><Countdown len={len(CD_A, END)} /></> },
  { a: END, b: DUR / FPS, el: <><AbsoluteFill style={{ background: "#0B0E16" }} /><NextCard /></> },
];

export const Film: React.FC<{ noCaps?: boolean }> = ({ noCaps }) => (
  <AbsoluteFill style={{ background: "#07090F" }}>
    {CUTS.map((c, i) => (
      <Sequence key={i} from={fr(c.a)} durationInFrames={fr(c.b) - fr(c.a)}>
        <AbsoluteFill>{c.el}</AbsoluteFill>
      </Sequence>
    ))}
    <Flash at={fr(T(7) - 0.1)} c="rgba(255,255,255,0.8)" />
    <Flash at={fr(T(8) - 0.1) + 6} c="rgba(255,255,255,0.7)" />
    <Flash at={fr(T(10) - 0.1) + 8} c="rgba(255,255,255,0.95)" />
    <Flash at={fr(T(15) - 0.1)} c="rgba(170,200,255,0.9)" />
    <Flash at={fr(END) - 2} c="rgba(255,255,255,1)" />
    <Vig a={0.34} />
    <FadeOut from={DUR - 24} />
    <Grain amount={0.045} />
    {noCaps ? null : <Captions hideFrom={CD_A} />}
  </AbsoluteFill>
);
