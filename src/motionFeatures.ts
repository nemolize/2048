import { domMax } from "motion/react";

// Loaded lazily by <LazyMotion> in main.tsx so the animation feature
// implementation is code-split out of the initial bundle. domMax (not
// domAnimation) because the app uses `layout` (tile slides) and `drag`
// (swipe input) — both are domMax-only features.
export default domMax;
