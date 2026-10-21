import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Layers,
  ClipboardList,
  MessageSquare,
  Trophy,
  Settings,
  LifeBuoy,
} from "lucide-react";

export const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    key: "organizations",
    label: "Organizations",
    icon: Calendar,
    // href: "/schedule",
    children: [
      { label: "Create organization", href: "/create/organization" },
      { label: "Organization tree list", href: "/list/organizations" },
    ],
  },
];

export const BOTTOM_NAV = [
  //   { key: "settings", label: "Settings", icon: Settings, href: "/settings" },
  //   { key: "support", label: "Support", icon: LifeBuoy, href: "/support" },
];
