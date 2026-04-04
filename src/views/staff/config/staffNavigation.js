/**
 * Staff / admin dashboard — sidebar for clinic or gym operator workflows.
 */
import {
  Users,
  Dumbbell,
  MessageSquare,
  ShoppingBag,
  FolderOpen,
  Activity,
  BarChart3,
} from "lucide-react";
import { createPageUrl } from "@/utils";

export const apexStaffNavItems = [
  { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: Activity },
  { title: "Clients", url: createPageUrl("Clients"), icon: Users },
  { title: "Programs", url: createPageUrl("Programs"), icon: Dumbbell },
  { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
  { title: "Store", url: createPageUrl("Marketplace"), icon: ShoppingBag },
  { title: "Messages", url: createPageUrl("AdminChat"), icon: MessageSquare },
  { title: "Business Analytics", url: createPageUrl("BusinessAnalytics"), icon: BarChart3 },
];

export const gymStaffNavItems = [
  { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: Activity },
  { title: "Clients", url: createPageUrl("Clients"), icon: Users },
  { title: "Programs", url: createPageUrl("Programs"), icon: Dumbbell },
  { title: "Store", url: createPageUrl("AdminMarketplace"), icon: ShoppingBag },
  { title: "Business Analytics", url: createPageUrl("BusinessAnalytics"), icon: BarChart3 },
];

export function getStaffNavItems(isGymEnv) {
  return isGymEnv ? gymStaffNavItems : apexStaffNavItems;
}
