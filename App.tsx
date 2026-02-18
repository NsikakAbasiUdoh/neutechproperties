import React, {
  useState,
  useEffect,
  Suspense,
  lazy,
  ErrorInfo,
  ReactNode,
  Component,
} from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RequestModal from "./components/RequestModal";
import WhatsAppButton from "./components/WhatsAppButton";
import {
  ViewState,
  Property,
  PropertyContextType,
  User,
  UserStatus,
  PropertyStatus,
  ClientRequest,
} from "./types";
import { supabase, isConnected, logVisit } from "./services/supabaseClient";
import { MAINTENANCE_MODE } from "./constants";
import { AlertTriangle, WifiOff, Loader2, RefreshCw } from "lucide-react";

// Lazy Load Pages for Performance Optimization
const Home = lazy(() => import("./pages/Home"));
const Properties = lazy(() => import("./pages/Properties"));
const Upload = lazy(() => import("./pages/Upload"));
const Contact = lazy(() => import("./pages/Contact"));
const Admin = lazy(() => import("./pages/Admin"));
const AgentAuth = lazy(() => import("./pages/AgentAuth"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6 text-sm">
              The application encountered an unexpected error.
            </p>
            <div className="bg-black/30 p-4 rounded-lg text-left mb-6 overflow-auto max-h-32">
              <code className="text-xs text-red-300 font-mono">
                {this.state.error?.message || "Unknown Error"}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-secondary hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto"
            >
              <RefreshCw size={18} className="mr-2" /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("HOME");

  // Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("neutech_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Access Codes State
  const [adminAccessCode, setAdminAccessCode] = useState(() => {
    return localStorage.getItem("neutech_admin_code") || "admin123";
  });

  const [publisherAccessCode, setPublisherAccessCode] = useState(() => {
    return localStorage.getItem("neutech_publisher_code") || "agent123";
  });

  // Global filter state
  const [filterState, setFilterState] = useState("");
  const [filterLGA, setFilterLGA] = useState("");

  // Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [currentRequestProperty, setCurrentRequestProperty] =
    useState<Property | null>(null);

  // --- Maintenance Check ---
  if (MAINTENANCE_MODE) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Loader2 className="text-white animate-spin" />
          </div>
        }
      >
        <Maintenance />
      </Suspense>
    );
  }

  // --- Supabase Data Fetching ---
  const fetchData = async () => {
    if (!isConnected) return;

    try {
      // Fetch Properties
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .order("dateAdded", { ascending: false });

      if (propsData) {
        // Sanitize data and normalize IDs to strings
        const safeProperties = propsData.map((p: any) => ({
          ...p,
          id: String(p.id),
          // Handle schema evolution: support 'images' (array) OR 'imageUrl' (string)
          images: Array.isArray(p.images)
            ? p.images
            : p.imageUrl
              ? [p.imageUrl]
              : [],
          features: Array.isArray(p.features) ? p.features : [],
          location: p.location || {
            state: "Unknown",
            lga: "Unknown",
            address: "Unknown",
          },
        }));
        setProperties(safeProperties);
      }
      if (propsError) console.error("Error fetching properties:", propsError);

      // Fetch Users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("dateRequested", { ascending: false });

      if (usersData) {
        const safeUsers = usersData.map((u: any) => ({
          ...u,
          id: String(u.id),
        }));
        setUsers(safeUsers);
      }
      if (usersError) console.error("Error fetching users:", usersError);

      // Fetch Requests
      const { data: reqData, error: reqError } = await supabase
        .from("requests")
        .select("*")
        .order("dateRequested", { ascending: false });

      if (reqData) {
        const safeRequests = reqData.map((r: any) => ({
          ...r,
          id: String(r.id),
          propertyId: String(r.propertyId),
        }));
        setRequests(safeRequests);
      }
      if (reqError) console.error("Error fetching requests:", reqError);
    } catch (err) {
      console.error("Unexpected error fetching data:", err);
    }
  };

  useEffect(() => {
    // 1. Fetch Application Data
    fetchData();

    // 2. Log Visitor Analytics (Once per session)
    logVisit();

    if (isConnected) {
      // Setup Realtime Subscription
      const subscription = supabase
        .channel("public:all")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "properties" },
          fetchData,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "users" },
          fetchData,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "requests" },
          fetchData,
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, []);

  // Sync Current User Status
  useEffect(() => {
    if (currentUser) {
      const syncedUser = users.find((u) => u.id === currentUser.id);
      if (syncedUser) {
        if (JSON.stringify(syncedUser) !== JSON.stringify(currentUser)) {
          setCurrentUser(syncedUser);
          localStorage.setItem(
            "neutech_current_user",
            JSON.stringify(syncedUser),
          );
        }
      }
    } else {
      localStorage.removeItem("neutech_current_user");
    }
  }, [users, currentUser]);

  useEffect(() => {
    localStorage.setItem("neutech_admin_code", adminAccessCode);
  }, [adminAccessCode]);

  useEffect(() => {
    localStorage.setItem("neutech_publisher_code", publisherAccessCode);
  }, [publisherAccessCode]);

  // --- Actions ---

  const addProperty = async (
    newProperty: Property,
  ): Promise<{ success: boolean; error?: string }> => {
    if (isConnected) {
      try {
        // Strategy 1: Attempt standard insert (Frontend Schema)
        let { error } = await supabase.from("properties").insert([newProperty]);

        // Strategy 2: Fallback for Schema Mismatch
        // If the DB is older/different (e.g. created via the Mongoose schema provided), it might:
        // 1. Lack 'agentId'
        // 2. Expect 'imageUrl' (string) instead of 'images' (array)
        if (
          error &&
          (error.code === "42703" || error.message.includes("Could not find"))
        ) {
          console.warn(
            "Schema mismatch detected (Missing columns). Attempting fallback insert compatible with legacy schema...",
          );

          const fallbackProperty: any = { ...newProperty };

          // Fix 1: Remove 'agentId' if DB doesn't have it
          delete fallbackProperty.agentId;

          // Fix 2: Handle 'images' -> 'imageUrl' conversion
          if (newProperty.images && newProperty.images.length > 0) {
            // DB likely expects 'imageUrl' as a single string
            fallbackProperty.imageUrl = newProperty.images[0];
            // Remove the plural array field which causes the error
            delete fallbackProperty.images;
          }

          // Retry insert with sanitized object
          const retry = await supabase
            .from("properties")
            .insert([fallbackProperty]);

          if (!retry.error) {
            console.log("Fallback insert successful!");
            error = null; // Clear error to proceed to success block
          } else {
            console.error("Fallback insert also failed:", retry.error);
            // If retry fails, we assume the initial error was the cause and fall through
          }
        }

        if (error) {
          console.error("Supabase insert failed:", error);

          let helpfulMessage = error.message;
          if (error.code === "42501")
            helpfulMessage =
              "Permission Denied: You don't have permission to save properties.";
          if (
            error.code === "42703" ||
            error.message.includes("Could not find")
          )
            helpfulMessage =
              "Database Error: The database schema is outdated (Missing columns). Please check 'agentId' or 'images' columns.";

          return { success: false, error: helpfulMessage };
        } else {
          // Success! Update local state
          // Note: We use newProperty here (with array images) for local state so the UI updates immediately
          setProperties((prev) => [newProperty, ...prev]);
          return { success: true };
        }
      } catch (err: any) {
        console.error("Unexpected error during addProperty:", err);
        return {
          success: false,
          error: err.message || "A network error occurred while saving.",
        };
      }
    } else {
      console.warn("Offline/Demo mode: Property saved to local state only.");
      setProperties((prev) => [newProperty, ...prev]);
      return { success: true };
    }
  };

  const updateProperty = async (
    id: string,
    updates: Partial<Property>,
  ): Promise<boolean> => {
    // Optimistic Update
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );

    if (isConnected) {
      try {
        const { error } = await supabase
          .from("properties")
          .update(updates)
          .eq("id", id);
        if (error) {
          console.error("Supabase update failed:", error);
          alert("Failed to update property in database: " + error.message);
          return false;
        }
        return true;
      } catch (err: any) {
        console.error("Update exception:", err);
        return false;
      }
    }
    return true;
  };

  const deleteProperty = async (id: string): Promise<boolean> => {
    console.log("App.tsx: Attempting to delete property:", id);
    // Optimistic Update with String comparison to be safe
    const previousProperties = [...properties];
    setProperties((prev) => prev.filter((p) => String(p.id) !== String(id)));

    if (isConnected) {
      try {
        const { error } = await supabase
          .from("properties")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Supabase delete failed:", error);
          setProperties(previousProperties);
          alert(`Failed to delete property from database: ${error.message}`);
          return false;
        } else {
          console.log("Property deleted successfully from DB");
          return true;
        }
      } catch (err: any) {
        console.error("Unexpected error during delete:", err);
        setProperties(previousProperties);
        alert(`An unexpected error occurred: ${err.message}`);
        return false;
      }
    }
    // Offline/Demo success
    return true;
  };

  const updatePropertyStatus = async (id: string, status: PropertyStatus) => {
    if (isConnected) {
      const { error } = await supabase
        .from("properties")
        .update({ status })
        .eq("id", id);
      if (error) console.error("Supabase update failed:", error);
    }
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  };

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    if (isConnected) {
      const { error } = await supabase
        .from("users")
        .update({ status })
        .eq("id", userId);
      if (error) console.error("Supabase update failed:", error);
    }
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, status } : user)),
    );
  };

  const registerUser = async (userData: Partial<User>) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      businessName: userData.businessName,
      state: userData.state,
      password: userData.password,
      passportUrl: userData.passportUrl,
      status: UserStatus.PENDING,
      dateRequested: Date.now(),
    };

    if (isConnected) {
      const { error } = await supabase.from("users").insert([newUser]);
      if (error) {
        console.error("Registration DB error:", error);
        alert("Database Error: Registration saved locally only.");
      }
    }

    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    if (isConnected) {
      const { error } = await supabase
        .from("users")
        .update(data)
        .eq("id", userId);
      if (error) console.error("Update error:", error);
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...data } : u)),
    );
  };

  const loginUser = (email: string, pass: string): boolean => {
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === pass,
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("neutech_current_user", JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem("neutech_current_user");
    setCurrentView("HOME");
  };

  const addRequest = async (request: ClientRequest) => {
    if (isConnected) {
      const { error } = await supabase.from("requests").insert([request]);
      if (error) console.error("Error adding request:", error);
    }
    setRequests((prev) => [request, ...prev]);
  };

  const deleteRequest = async (id: string): Promise<boolean> => {
    console.log("App.tsx: Attempting to delete request:", id);
    // Optimistic Update with String comparison
    const previousRequests = [...requests];
    setRequests((prev) => prev.filter((r) => String(r.id) !== String(id)));

    if (isConnected) {
      try {
        const { error } = await supabase.from("requests").delete().eq("id", id);

        if (error) {
          console.error("Error deleting request:", error);
          setRequests(previousRequests);
          alert(`Failed to delete request from database: ${error.message}`);
          return false;
        } else {
          console.log("Request deleted successfully from DB");
          return true;
        }
      } catch (err: any) {
        console.error("Unexpected error during request delete:", err);
        setRequests(previousRequests);
        alert("An error occurred while deleting request.");
        return false;
      }
    }
    // Offline/Demo success
    return true;
  };

  const openRequestModal = (property: Property) => {
    setCurrentRequestProperty(property);
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setCurrentRequestProperty(null);
  };

  const propertyContext: PropertyContextType = {
    properties,
    addProperty,
    updateProperty,
    deleteProperty,
    updatePropertyStatus,
    filterState,
    filterLGA,
    setFilterState,
    setFilterLGA,
    users,
    updateUserStatus,
    currentUser,
    loginUser,
    registerUser,
    updateUser,
    logoutUser,
    requests,
    addRequest,
    deleteRequest,
    openRequestModal,
    closeRequestModal,
    isRequestModalOpen,
    currentRequestProperty,
    adminAccessCode,
    setAdminAccessCode,
    publisherAccessCode,
    setPublisherAccessCode,
  };

  const renderView = () => {
    switch (currentView) {
      case "HOME":
        return (
          <Home propertyContext={propertyContext} onNavigate={setCurrentView} />
        );
      case "PROPERTIES":
        return <Properties propertyContext={propertyContext} />;
      case "UPLOAD":
        return (
          <Upload
            propertyContext={propertyContext}
            onNavigate={setCurrentView}
          />
        );
      case "AGENTS":
        return (
          <AgentAuth
            propertyContext={propertyContext}
            onNavigate={setCurrentView}
          />
        );
      case "CONTACT":
        return <Contact />;
      case "ADMIN":
        return <Admin propertyContext={propertyContext} />;
      default:
        return (
          <Home propertyContext={propertyContext} onNavigate={setCurrentView} />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen font-sans relative">
        {!isConnected && (
          <div className="bg-red-600 text-white text-xs font-bold text-center py-2 px-4 z-[100] flex items-center justify-center shadow-md">
            <WifiOff size={14} className="mr-2" />
            <span>
              DISCONNECTED: Application is running in Demo Mode. Data will not
              be saved to Supabase.
            </span>
          </div>
        )}
        <Navbar currentView={currentView} onNavigate={setCurrentView} />

        <main className="flex-grow">
          <Suspense
            fallback={
              <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 text-secondary animate-spin mb-4" />
                <p className="text-gray-500 text-sm font-medium animate-pulse">
                  Loading NEUTECH...
                </p>
              </div>
            }
          >
            {renderView()}
          </Suspense>
        </main>

        <Footer />
        <WhatsAppButton />

        {/* Global Request Modal */}
        <RequestModal
          isOpen={isRequestModalOpen}
          onClose={closeRequestModal}
          property={currentRequestProperty}
          onSubmit={addRequest}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
