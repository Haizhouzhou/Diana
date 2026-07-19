import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AboutPage } from "./pages/AboutPage";
import { HormonbenchPresetPage } from "./pages/HormonbenchPresetPage";
import { LandingPage } from "./pages/LandingPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProgramReviewPage } from "./pages/ProgramReviewPage";
import { StudioPage } from "./pages/StudioPage";
import { StudioProvider } from "./workspace/StudioContext";
export function App() { return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><StudioProvider><Routes><Route path="/" element={<LandingPage />} /><Route path="/studio" element={<StudioPage />} /><Route path="/preset/hormonbench-mcphases-v1" element={<HormonbenchPresetPage />} /><Route path="/review" element={<ProgramReviewPage />} /><Route path="/methodology" element={<MethodologyPage />} /><Route path="/about" element={<AboutPage />} /><Route path="*" element={<NotFoundPage />} /></Routes></StudioProvider></BrowserRouter>; }
