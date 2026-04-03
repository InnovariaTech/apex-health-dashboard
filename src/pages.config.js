/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Workouts from './pages/Workouts.jsx';
import Marketplace from './pages/Marketplace';
import Chat from './pages/Chat.jsx';
import AdminChat from './pages/AdminChat.jsx';
import Programs from './pages/Programs.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Affiliates from './pages/Affiliates.jsx';
import Clients from './pages/Clients.jsx';
import Nutrition from './pages/Nutrition';
import Health from './pages/Health';
import Biomarkers from './pages/Biomarkers';
import Documents from './pages/Documents';
import __Layout from './layouts/AppLayout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Exercises": Exercises,
    "Workouts": Workouts,
    "Marketplace": Marketplace,
    "Chat": Chat,
    "AdminChat": AdminChat,
    "Programs": Programs,
    "AdminDashboard": AdminDashboard,
    "Affiliates": Affiliates,
    "Clients": Clients,
    "Nutrition": Nutrition,
    "Health": Health,
    "Biomarkers": Biomarkers,
    "Documents": Documents,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};