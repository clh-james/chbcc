import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Page =
  | "dashboard"
  | "appointments"
  | "pos"
  | "customers"
  | "staff"
  | "inventory"
  | "services"
  | "memberships"
  | "reports"
  | "analytics"
  | "sms"
  | "branches"
  | "settings";

export type UserRole =
  | "Admin"
  | "Manager"
  | "Staff"
  | "Cashier"
  | "Senior Stylist"
  | "Stylist"
  | "Senior Nail Technician"
  | "Nail Technician"
  | "Massage Therapist"
  | "Esthetician"
  | "Receptionist";

interface BusinessProfile {
  id: string;
  business_name: string;
  currency: string;
  tax_rate: number;
  branch_id: string;
  address?: string;
  phone?: string;
}

interface AppContextType {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: User | null;
  session: Session | null;
  businessProfile: BusinessProfile | null;
  loading: boolean;
  userRole: UserRole | null;
  userPermissions: Page[];
  canAccess: (page: Page) => boolean;
  signOut: () => Promise<void>;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ✅ UPDATED: Explicit permission mapping
const ROLE_PERMISSIONS: Record<string, Page[]> = {
  Admin: [
    "dashboard",
    "appointments",
    "pos",
    "customers",
    "staff",
    "inventory",
    "services",
    "memberships",
    "reports",
    "analytics",
    "sms",
    "branches",
    "settings",
  ],
  Manager: [
    "dashboard",
    "appointments",
    "customers",
    "staff",
    "inventory",
    "services",
    "reports",
    "analytics",
    "settings",
  ],
  Staff: ["dashboard", "appointments", "customers", "memberships"],
  Cashier: ["pos", "customers"],
  "Senior Stylist": ["dashboard", "appointments", "customers", "memberships"],
  Stylist: ["dashboard", "appointments", "customers", "memberships"],
  "Senior Nail Technician": [
    "dashboard",
    "appointments",
    "customers",
    "memberships",
  ],
  "Nail Technician": ["dashboard", "appointments", "customers", "memberships"],
  "Massage Therapist": [
    "dashboard",
    "appointments",
    "customers",
    "memberships",
  ],
  Esthetician: ["dashboard", "appointments", "customers", "memberships"],
  Receptionist: [
    "dashboard",
    "appointments",
    "pos",
    "customers",
    "memberships",
  ],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    "00000000-0000-0000-0000-000000000001",
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", String(isDarkMode));
  }, [isDarkMode]);

  // ✅ FIX: Centralized profile fetching with guaranteed loading reset
  const fetchBusinessProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, branch_id, role")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.warn("Profile fetch warning:", error.message);
      }

      const rawRole = (profile?.role as string) || "Admin";
      const permissions =
        ROLE_PERMISSIONS[rawRole] || ROLE_PERMISSIONS["Admin"];

      setUserRole(rawRole as UserRole);
      setUserPermissions(permissions);

      // Auto-fix profiles missing roles (non-blocking)
      if (profile && !profile.role) {
        supabase
          .from("profiles")
          .update({ role: "Admin" })
          .eq("id", userId)
          .then((res) => {
            if (res.error)
              console.warn("Auto-fix role failed:", res.error.message);
          });
      }

      // Create profile if missing (non-blocking)
      if (!profile) {
        supabase
          .from("profiles")
          .upsert({
            id: userId,
            role: "Admin",
            branch_id: "00000000-0000-0000-0000-000000000001",
          })
          .then((res) => {
            if (res.error)
              console.warn("Profile creation failed:", res.error.message);
          });
      }

      // Load branch/business info
      const branchId =
        profile?.branch_id || "00000000-0000-0000-0000-000000000001";
      const { data: branch } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .maybeSingle();

      if (branch) {
        setSelectedBranchId(branch.id);
        setBusinessProfile({
          id: branch.id,
          business_name: branch.name || "Chloe House of Beauty",
          currency: "PHP",
          tax_rate: 8,
          branch_id: branch.id,
          address: branch.address || undefined,
          phone: branch.phone || undefined,
        });
      }
    } catch (err) {
      console.error("Critical error in fetchBusinessProfile:", err);
      // Fail-safe: Grant admin access on DB error to prevent lockout
      setUserRole("Admin");
      setUserPermissions(ROLE_PERMISSIONS["Admin"]);
    } finally {
      // ✅ CRITICAL FIX: Always stop loading after profile fetch completes/fails
      setLoading(false);
    }
  }, []);

  // Auth initialization & listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchBusinessProfile(currentSession.user.id);
        } else {
          setUserRole(null);
          setUserPermissions([]);
          setLoading(false); // ✅ Stop loading for unauthenticated users
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        setLoading(false); // ✅ Stop loading even if init fails
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // ✅ Loading will be stopped inside fetchBusinessProfile's finally block
        await fetchBusinessProfile(newSession.user.id);
      } else {
        setBusinessProfile(null);
        setUserRole(null);
        setUserPermissions([]);
        setLoading(false); // ✅ Stop loading immediately on sign out
      }
    });

    return () => subscription?.unsubscribe();
  }, [fetchBusinessProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // State cleanup handled by onAuthStateChange listener
  };

  const updateBusinessProfile = async (updates: Partial<BusinessProfile>) => {
    if (!businessProfile || !user) return;
    try {
      if (updates.business_name) {
        await supabase
          .from("branches")
          .update({ name: updates.business_name })
          .eq("id", businessProfile.branch_id);
      }
      setBusinessProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error("Error updating business profile:", err);
    }
  };

  const updateUserRole = async (newRole: UserRole) => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);

      setUserRole(newRole);
      setUserPermissions(
        ROLE_PERMISSIONS[newRole] || ROLE_PERMISSIONS["Admin"],
      );
      console.log(`Role updated to ${newRole}. Local permissions refreshed.`);
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  };

  const canAccess = useCallback(
    (page: Page): boolean => {
      if (!userPermissions || userPermissions.length === 0) return false;
      return userPermissions.includes(page);
    },
    [userPermissions],
  );

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        isDarkMode,
        toggleDarkMode,
        selectedBranchId,
        setSelectedBranchId,
        sidebarOpen,
        setSidebarOpen,
        user,
        session,
        businessProfile,
        loading,
        userRole,
        userPermissions,
        canAccess,
        signOut: handleSignOut,
        updateBusinessProfile,
        updateUserRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
