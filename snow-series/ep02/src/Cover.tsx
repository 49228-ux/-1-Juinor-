import React from "react";
import { AbsoluteFill } from "remotion";
import { Film } from "./Film";
import { EP, RED, SANS } from "./kit/ui";

/** YouTube thumbnail (16:9): the film frame without captions, title block on the left over a dark gradient.
 *  Render ONE frame: npx remotion still src/index.ts Cover out/cover.png --frame=<episode.json coverFrame> */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Film noCaps />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,8,16,0.9) 0%, rgba(5,8,16,0.6) 34%, transparent 58%)" }} />
    <div style={{ position: "absolute", top: 150, left: 90, width: 900, fontFamily: SANS }}>
      <div style={{ color: "#F6F4EE", fontSize: 46, fontWeight: 600, opacity: 0.85 }}>{`ตอนที่ ${EP.ep}`}</div>
      <div style={{ color: "#F6F4EE", fontSize: 92, fontWeight: 700, lineHeight: 1.18, marginTop: 6, textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>รอยเท้า<br />ที่หายไป<br />กลางหิมะ</div>
      <div style={{ display: "inline-block", marginTop: 26, background: RED, color: "#FFF6EE", fontSize: 64, fontWeight: 700, padding: "4px 30px 10px", borderRadius: 14 }}>มีอีกคู่ ใหญ่กว่า 2 เท่า</div>
    </div>
  </AbsoluteFill>
);
