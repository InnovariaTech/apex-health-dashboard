/**
 * Route registration — patient portal only (`src/views/patient/pages`).
 * Editable: `mainPage` (must match a key in `PAGES`).
 */
import Dashboard from "./views/patient/pages/Dashboard";
import Exercises from "./views/patient/pages/Exercises";
import Workouts from "./views/patient/pages/Workouts.jsx";
import Marketplace from "./views/patient/pages/Marketplace";
import Chat from "./views/patient/pages/Chat.jsx";
import Affiliates from "./views/patient/pages/Affiliates.jsx";
import Nutrition from "./views/patient/pages/Nutrition";
import Health from "./views/patient/pages/Health";
import Biomarkers from "./views/patient/pages/Biomarkers";
import Documents from "./views/patient/pages/Documents";
import __Layout from "./layouts/AppLayout.jsx";

export const PAGES = {
  Dashboard,
  Exercises,
  Workouts,
  Marketplace,
  Chat,
  Affiliates,
  Nutrition,
  Health,
  Biomarkers,
  Documents,
};

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
  Layout: __Layout,
};
