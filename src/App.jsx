import { Route, Routes } from "react-router-dom";
import { AppProviders } from "@/app/providers/AppProviders";
import { pagesConfig } from "./pages.config";
import PageNotFound from "./lib/PageNotFound";
import { useAuth } from "@/lib/AuthContext";
import Profile from "@/pages/Profile";
import Billing from "@/pages/Billing";
import SyncDevices from "@/pages/SyncDevices";
import BusinessAnalytics from "@/pages/BusinessAnalytics";
import Progress from "@/pages/Progress";
import Schedule from "@/pages/Schedule";
import AdvancedBiomarkers from "@/pages/AdvancedBiomarkers.jsx";
import MyTreatments from "@/pages/MyTreatments.jsx";
import Referral from "@/pages/Referral.jsx";
import Rewards from "@/pages/Rewards.jsx";
import Sleep from "@/pages/Sleep.jsx";
import AdminMarketplace from "@/pages/AdminMarketplace.jsx";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } =
    useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    }
    if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        }
      />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route
        path="/Profile"
        element={
          <LayoutWrapper currentPageName="Profile">
            <Profile />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Billing"
        element={
          <LayoutWrapper currentPageName="Billing">
            <Billing />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SyncDevices"
        element={
          <LayoutWrapper currentPageName="SyncDevices">
            <SyncDevices />
          </LayoutWrapper>
        }
      />
      <Route
        path="/BusinessAnalytics"
        element={
          <LayoutWrapper currentPageName="BusinessAnalytics">
            <BusinessAnalytics />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Progress"
        element={
          <LayoutWrapper currentPageName="Progress">
            <Progress />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Schedule"
        element={
          <LayoutWrapper currentPageName="Schedule">
            <Schedule />
          </LayoutWrapper>
        }
      />
      <Route
        path="/AdvancedBiomarkers"
        element={
          <LayoutWrapper currentPageName="AdvancedBiomarkers">
            <AdvancedBiomarkers />
          </LayoutWrapper>
        }
      />
      <Route
        path="/MyTreatments"
        element={
          <LayoutWrapper currentPageName="MyTreatments">
            <MyTreatments />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Referral"
        element={
          <LayoutWrapper currentPageName="Referral">
            <Referral />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Rewards"
        element={
          <LayoutWrapper currentPageName="Rewards">
            <Rewards />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Sleep"
        element={
          <LayoutWrapper currentPageName="Sleep">
            <Sleep />
          </LayoutWrapper>
        }
      />
      <Route
        path="/AdminMarketplace"
        element={
          <LayoutWrapper currentPageName="AdminMarketplace">
            <AdminMarketplace />
          </LayoutWrapper>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProviders>
      <AuthenticatedApp />
    </AppProviders>
  );
}
