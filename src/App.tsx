import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppProviders } from "@/app/providers/AppProviders";
import { pagesConfig } from "./pages.config";
import PageNotFound from "./lib/PageNotFound";
import { useAuth } from "@/lib/AuthContext";
import Login from "@/views/auth/pages/Login";
import Signup from "@/views/auth/pages/Signup";
import Profile from "@/views/patient/pages/Profile";
import Billing from "@/views/patient/pages/Billing";
import SyncDevices from "@/views/patient/pages/SyncDevices";
import Progress from "@/views/patient/pages/Progress";
import Schedule from "@/views/patient/pages/Schedule";
import AdvancedBiomarkers from "@/views/patient/pages/AdvancedBiomarkers";
import MyTreatments from "@/views/patient/pages/MyTreatments";
import Referral from "@/views/patient/pages/Referral";
import Rewards from "@/views/patient/pages/Rewards";
import Sleep from "@/views/patient/pages/Sleep";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : null;

const LayoutWrapper = ({ children }: { children: ReactNode }) =>
  Layout ? <Layout>{children}</Layout> : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError } =
    useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === "auth_required" || !isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route
        path="/"
        element={
          <LayoutWrapper>
            {MainPage ? <MainPage /> : null}
          </LayoutWrapper>
        }
      />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route
        path="/Profile"
        element={
          <LayoutWrapper>
            <Profile />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Billing"
        element={
          <LayoutWrapper>
            <Billing />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SyncDevices"
        element={
          <LayoutWrapper>
            <SyncDevices />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Progress"
        element={
          <LayoutWrapper>
            <Progress />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Schedule"
        element={
          <LayoutWrapper>
            <Schedule />
          </LayoutWrapper>
        }
      />
      <Route
        path="/AdvancedBiomarkers"
        element={
          <LayoutWrapper>
            <AdvancedBiomarkers />
          </LayoutWrapper>
        }
      />
      <Route
        path="/MyTreatments"
        element={
          <LayoutWrapper>
            <MyTreatments />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Referral"
        element={
          <LayoutWrapper>
            <Referral />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Rewards"
        element={
          <LayoutWrapper>
            <Rewards />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Sleep"
        element={
          <LayoutWrapper>
            <Sleep />
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
