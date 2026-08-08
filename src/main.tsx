import "@/styles/globals.css";

import { LazyMotion, MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";

const loadMotionFeatures = () =>
  import("@/motionFeatures").then((module) => module.default);

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("root element is missing");

createRoot(rootElement).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <App />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
);
