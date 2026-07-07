import "@/styles/globals.css";

import { LazyMotion, MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";

const loadMotionFeatures = () =>
  import("@/motionFeatures").then((module) => module.default);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <App />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
);
