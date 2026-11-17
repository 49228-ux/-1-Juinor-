import type { Look } from "./char";

/* Cast for "ย้อนเวลาก่อนหิมะ" (fiction). Keep every value here; never edit a character inside a shot.
   ME      = the narrator "ผม": navy hoodie, messy black hair, dark jeans.
   JUINOR  = best friend: long brown coat, spiky hair, a RED SCARF (the twist object — only these two ever wear it).
   Mochi   = cream dog with a brown eye patch (rig/pets Dog). */
export const SCARF = "#C8323A";
export const ME: Look = { skin: "#E0B48F", hair: "messy", hairC: "#1B1715", iris: "#2A211C", eyeW: 1, eyeH: 1, outfit: "hoodie", top: "#3D4F6E", pants: "#34394A", shoes: "#2A2A2E", sole: "#E4E1DA", brow: "#2A2420", height: 0.9 };
export const JUINOR: Look = { skin: "#D6A27C", hair: "spiky", hairC: "#2A1E18", iris: "#2A211C", eyeW: 1, eyeH: 1, outfit: "coat", top: "#6B4A35", pants: "#3B3530", shoes: "#2A2420", sole: "#141210", brow: "#2A2420", height: 0.94 };
/** the same people with the scarf on */
export const ME_S: Look = { ...ME, scarf: SCARF };
export const JU_S: Look = { ...JUINOR, scarf: SCARF };
export const JU_LIGHT: Look = { ...JUINOR, holdR: "flashlight" };

/** characters shown by the Turn-<id> QA comps (4 views + face). */
/** the yeti (fiction): white fur everywhere, huge build, big pale-blue eyes, small fangs. ≈2.5 m standing */
export const YETI: Look = { skin: "#E3E9F0", hair: "messy", hairC: "#D2DBE6", iris: "#5A86B8", eyeW: 1.1, eyeH: 1.0, face: "big", outfit: "coat", top: "#DCE3EC", pants: "#DCE3EC", shoes: "#9AA5B4", sole: "#7C8696", brow: "#A9B4C3", fangs: true, height: 1.45,
  build: { leg: 1.15, arm: 1.6, torso: 1.25, girth: 1.75, limb: 1.7, neck: 0.8 }, headS: 1.2 };

export const CAST: Record<string, Look> = { me: ME_S, juinor: JU_S, yeti: YETI };
