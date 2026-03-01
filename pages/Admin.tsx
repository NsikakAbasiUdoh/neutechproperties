import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  UserStatus,
  PropertyContextType,
  PropertyStatus,
  Visit,
  Property,
  PropertyCategory,
  PropertyType,
} from "../types";
import { supabase, isConnected } from "../services/supabaseClient";
import { NIGERIAN_STATES } from "../constants";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User as UserIcon,
  Building,
  Lock,
  LogIn,
  Key,
  Mail,
  Smartphone,
  ArrowLeft,
  Send,
  AlertTriangle,
  LayoutList,
  Trash2,
  MapPin,
  Eye,
  Settings,
  Info,
  Briefcase,
  Users,
  RefreshCw,
  Database,
  Globe,
  Edit,
  Save,
  X,
} from "lucide-react";

interface AdminProps {
  propertyContext: PropertyContextType;
}

const Admin: React.FC<AdminProps> = ({ propertyContext }) => {
  // ... (Keep existing view state logic same as before, no changes needed to logic, only render)
  type AdminView =
    | "LOGIN"
    | "DASHBOARD"
    | "SET_NEW_CODE"
    | "RECOVERY_OPTIONS"
    | "VERIFY_OTP";
  const [view, setView] = useState<AdminView>("LOGIN");

  // Dashboard Tab State
  type DashboardTab = "DASHBOARD" | "PROPERTIES" | "REQUESTS" | "AGENTS";
  const [activeTab, setActiveTab] = useState<DashboardTab>("DASHBOARD");

  // Access Code Management State
  type CodeType = "ADMIN" | "PUBLISHER";
  const [targetCodeType, setTargetCodeType] = useState<CodeType>("ADMIN");

  // Auth/Reset State
  const [loginInput, setLoginInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [newCodeInput, setNewCodeInput] = useState("");
  const [confirmCodeInput, setConfirmCodeInput] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState("");

  // Connection Checker State
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">(
    "checking",
  );
  const [dbErrorMessage, setDbErrorMessage] = useState("");

  // Analytics State
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsError, setVisitsError] = useState("");

  // Edit State
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Property> & { featuresString: string }
  >({ featuresString: "" });

  // Data State from Context
  const {
    properties,
    deleteProperty,
    updateProperty,
    updatePropertyStatus,
    adminAccessCode,
    setAdminAccessCode,
    publisherAccessCode,
    setPublisherAccessCode,
    requests,
    deleteRequest,
    users,
    updateUserStatus,
  } = propertyContext;

  // --- Effects ---
  useEffect(() => {
    if (view === "DASHBOARD" && activeTab === "DASHBOARD") {
      checkDbConnection();
      fetchVisits();
    }
  }, [view, activeTab]);

  // --- Actions ---

  const checkDbConnection = async () => {
    setDbStatus("checking");
    setDbErrorMessage("");

    if (!isConnected) {
      setDbStatus("error");
      setDbErrorMessage(
        "Environment variables missing (VITE_SUPABASE_URL not found).",
      );
      return;
    }

    try {
      // Attempt a lightweight query to verify connection
      const { error, count } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true });

      if (error) {
        setDbStatus("error");
        setDbErrorMessage(error.message);
      } else {
        setDbStatus("connected");
      }
    } catch (err: any) {
      setDbStatus("error");
      setDbErrorMessage(err.message || "Unknown connection error");
    }
  };

  const fetchVisits = async () => {
    if (!isConnected) return;

    try {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .order("visited_at", { ascending: false });

      if (error) {
        // This often happens if the 'visits' table doesn't exist yet
        if (error.code === "42P01") {
          setVisitsError(
            'Analytics table missing. Please create "visits" table in Supabase.',
          );
        } else {
          console.error("Error fetching visits:", error);
        }
      } else if (data) {
        setVisits(data);
        setVisitsError("");
      }
    } catch (e) {
      console.error("Analytics fetch error:", e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput === adminAccessCode) {
      setView("DASHBOARD");
      setAuthError("");
      setLoginInput("");
    } else {
      setAuthError("Invalid access code. Please try again.");
    }
  };

  const handleLogout = () => {
    setView("LOGIN");
    setLoginInput("");
  };

  const handleDeleteProperty = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this property? This action implies the property has been sold or removed.",
      )
    ) {
      const success = await deleteProperty(id);
      if (success) {
        alert("Property deleted successfully!");
      }
    }
  };

  const handleEditClick = (property: Property) => {
    setEditingProperty(property);
    setEditForm({
      ...property,
      featuresString: property.features ? property.features.join(", ") : "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    const updates = {
      title: editForm.title,
      price: Number(editForm.price),
      description: editForm.description,
      type: editForm.type,
      category: editForm.category,
      location: editForm.location, // Assuming full object is updated
      features: editForm.featuresString
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f !== ""),
      status: editForm.status,
    };

    const success = await updateProperty(editingProperty.id, updates);
    if (success) {
      alert("Property updated successfully!");
      setEditingProperty(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm("Mark this request as handled and remove it?")) {
      const success = await deleteRequest(id);
      if (success) {
        alert("Request deleted successfully!");
      }
    }
  };

  const handleApproveProperty = (id: string) => {
    updatePropertyStatus(id, PropertyStatus.APPROVED);
  };

  // ... (Keep existing methods: handleRejectProperty, handleApproveUser, handleRejectUser, startRecovery, sendOtp, handleVerifyOtp, handleUpdateCode, cancelUpdateCode)
  const handleRejectProperty = (id: string) => {
    updatePropertyStatus(id, PropertyStatus.REJECTED);
  };

  const handleApproveUser = (id: string) => {
    updateUserStatus(id, UserStatus.APPROVED);
  };

  const handleRejectUser = (id: string) => {
    updateUserStatus(id, UserStatus.REJECTED);
  };

  const startRecovery = () => {
    setView("RECOVERY_OPTIONS");
    setResetError("");
    setResetSuccess("");
  };

  const sendOtp = (method: string, contact: string) => {
    setIsSending(true);
    setRecoveryMethod(`${method}: ${contact}`);
    setTimeout(() => {
      setIsSending(false);
      setResetSuccess(`OTP sent to ${contact}`);
      setTimeout(() => {
        setView("VERIFY_OTP");
        setResetSuccess("");
      }, 1000);
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === "123456") {
      setTargetCodeType("ADMIN");
      setView("SET_NEW_CODE");
      setOtpInput("");
      setResetError("");
    } else {
      setResetError("Invalid OTP. Please try again.");
    }
  };

  const handleUpdateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCodeInput.length < 6) {
      setResetError("Code must be at least 6 characters.");
      return;
    }
    if (newCodeInput !== confirmCodeInput) {
      setResetError("Codes do not match.");
      return;
    }
    if (targetCodeType === "ADMIN") {
      setAdminAccessCode(newCodeInput);
      setResetSuccess("Admin access code updated successfully!");
    } else {
      setPublisherAccessCode(newCodeInput);
      setResetSuccess("Publisher request code updated successfully!");
    }
    setTimeout(() => {
      if (view === "SET_NEW_CODE") {
        setView("LOGIN");
      }
      setResetSuccess("");
      setNewCodeInput("");
      setConfirmCodeInput("");
      setResetError("");
    }, 2000);
  };

  const cancelUpdateCode = () => {
    if (view === "RECOVERY_OPTIONS" || view === "VERIFY_OTP") {
      setView("LOGIN");
    } else {
      setView("LOGIN");
    }
    setResetError("");
    setResetSuccess("");
    setNewCodeInput("");
    setConfirmCodeInput("");
    setOtpInput("");
    setTargetCodeType("ADMIN");
  };

  // --- Derived State ---
  const pendingProperties = properties.filter(
    (p) => p.status === PropertyStatus.PENDING,
  );
  const approvedProperties = properties.filter(
    (p) => p.status === PropertyStatus.APPROVED,
  );
  const rejectedProperties = properties.filter(
    (p) => p.status === PropertyStatus.REJECTED,
  );

  const pendingUsers = users.filter((u) => u.status === UserStatus.PENDING);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group visits by country/region
  const locationStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    visits.forEach((v) => {
      const loc = v.city ? `${v.city}, ${v.country}` : v.country || "Unknown";
      stats[loc] = (stats[loc] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [visits]);

  // Available LGAs for Edit Form
  const editAvailableLgas = useMemo(() => {
    if (!editForm.location?.state) return [];
    const state = NIGERIAN_STATES.find(
      (s) => s.name === editForm.location?.state,
    );
    return state ? state.lgas : [];
  }, [editForm.location?.state]);

  // ... (Keep existing View Renders (Recovery, Verify, SetNewCode, Login))
  if (view === "RECOVERY_OPTIONS")
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 relative">
          <button
            onClick={() => setView("LOGIN")}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center mb-6 mt-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Account Recovery
            </h2>
            <p className="text-gray-500 mt-2">
              Where should we send the One-Time Password (OTP)?
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => sendOtp("Email", "neutechcoding@gmail.com")}
              disabled={isSending}
              className="w-full p-4 border border-gray-200 rounded-xl flex items-center hover:bg-gray-50 hover:border-secondary transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                <Mail size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Email Verification</p>
                <p className="text-sm text-gray-500">neutechcoding@gmail.com</p>
              </div>
            </button>
            <button
              onClick={() => sendOtp("Phone", "08068002159")}
              disabled={isSending}
              className="w-full p-4 border border-gray-200 rounded-xl flex items-center hover:bg-gray-50 hover:border-secondary transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                <Smartphone size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">SMS Verification 1</p>
                <p className="text-sm text-gray-500">08068002159</p>
              </div>
            </button>
            <button
              onClick={() => sendOtp("Phone", "09062712610")}
              disabled={isSending}
              className="w-full p-4 border border-gray-200 rounded-xl flex items-center hover:bg-gray-50 hover:border-secondary transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                <Smartphone size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">SMS Verification 2</p>
                <p className="text-sm text-gray-500">09062712610</p>
              </div>
            </button>
          </div>
          {isSending && (
            <div className="mt-6 flex justify-center text-secondary font-semibold">
              <span className="flex items-center">
                <Clock size={18} className="animate-spin mr-2" /> Sending
                Code...
              </span>
            </div>
          )}
          {resetSuccess && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center justify-center">
              <CheckCircle size={16} className="mr-2" /> {resetSuccess}
            </div>
          )}
        </div>
      </div>
    );
  if (view === "VERIFY_OTP")
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 relative">
          <button
            onClick={() => setView("RECOVERY_OPTIONS")}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center mb-6 mt-4">
            <div className="w-16 h-16 bg-amber-100 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Enter Verification Code
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              We sent a code to <br />
              <span className="font-semibold text-gray-800">
                {recoveryMethod}
              </span>
            </p>
          </div>
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="block w-full text-center text-3xl tracking-[1em] font-bold py-4 border-b-2 border-gray-300 focus:border-secondary focus:outline-none transition-colors"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            {resetError && (
              <p className="text-center text-sm text-red-600 flex items-center justify-center">
                <AlertTriangle size={14} className="mr-1" /> {resetError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-secondary hover:bg-amber-600 text-primary font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
            >
              Verify & Proceed
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setView("RECOVERY_OPTIONS")}
              className="text-sm text-primary hover:underline font-semibold"
            >
              Didn't receive code? Try another method
            </button>
          </div>
        </div>
      </div>
    );
  if (view === "SET_NEW_CODE")
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 relative">
          <button
            onClick={cancelUpdateCode}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Update Access Codes
            </h2>
            <p className="text-gray-500 mt-2">
              Select which code you want to reset.
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setTargetCodeType("ADMIN");
                setResetError("");
                setResetSuccess("");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${targetCodeType === "ADMIN" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetCodeType("PUBLISHER");
                setResetError("");
                setResetSuccess("");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${targetCodeType === "PUBLISHER" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Upload Page
            </button>
          </div>
          <form onSubmit={handleUpdateCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New {targetCodeType === "ADMIN" ? "Admin" : "Publisher"} Code
              </label>
              <input
                type="password"
                value={newCodeInput}
                onChange={(e) => setNewCodeInput(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary"
                placeholder={`Enter new ${targetCodeType.toLowerCase()} code`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Code
              </label>
              <input
                type="password"
                value={confirmCodeInput}
                onChange={(e) => setConfirmCodeInput(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary"
                placeholder="Re-enter new code"
              />
            </div>
            {resetError && (
              <p className="text-sm text-red-600 flex items-center">
                <XCircle size={14} className="mr-1" /> {resetError}
              </p>
            )}
            {resetSuccess && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center justify-center font-medium">
                <CheckCircle size={16} className="mr-2" /> {resetSuccess}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
            >
              Update {targetCodeType === "ADMIN" ? "Admin" : "Publisher"} Code
            </button>
          </form>
        </div>
      </div>
    );
  if (view === "LOGIN")
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-secondary shadow-lg">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Access</h2>
            <p className="text-gray-500 mt-2">
              Enter your access code to manage publishers.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Code
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary transition-colors outline-none"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
              </div>
              {authError && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <XCircle size={14} className="mr-1" /> {authError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-secondary hover:bg-amber-600 text-primary font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md transform hover:scale-[1.02] duration-200"
            >
              <LogIn size={18} className="mr-2" /> Login to Dashboard
            </button>
          </form>
          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              onClick={startRecovery}
              className="text-sm text-primary hover:text-secondary font-medium transition-colors"
            >
              Lost your access code?
            </button>
          </div>
        </div>
      </div>
    );

  // 5. Main Dashboard
  return (
    <div className="min-h-screen relative">
      {/* ... (Header & Tab Navigation - No changes) ... */}
      <div className="bg-primary/90 backdrop-blur text-white py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Shield className="mr-3 text-secondary" /> Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Manage publisher approvals and platform users.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setView("SET_NEW_CODE");
                setTargetCodeType("ADMIN");
              }}
              className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors border border-white/10"
            >
              <Key size={16} /> Change Access Codes
            </button>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 rounded-xl bg-white/20 backdrop-blur-md p-1 mb-8 w-fit mx-auto md:mx-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("DASHBOARD")}
            className={`flex items-center rounded-lg py-2.5 px-6 text-sm font-medium leading-5 transition-all whitespace-nowrap ${activeTab === "DASHBOARD" ? "bg-white text-primary shadow" : "text-white hover:bg-white/[0.12] hover:text-white"}`}
          >
            <Clock size={16} className="mr-2" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("PROPERTIES")}
            className={`flex items-center rounded-lg py-2.5 px-6 text-sm font-medium leading-5 transition-all whitespace-nowrap ${activeTab === "PROPERTIES" ? "bg-white text-primary shadow" : "text-white hover:bg-white/[0.12] hover:text-white"}`}
          >
            <LayoutList size={16} className="mr-2" /> All Properties
          </button>
          <button
            onClick={() => setActiveTab("AGENTS")}
            className={`flex items-center rounded-lg py-2.5 px-6 text-sm font-medium leading-5 transition-all whitespace-nowrap ${activeTab === "AGENTS" ? "bg-white text-primary shadow" : "text-white hover:bg-white/[0.12] hover:text-white"}`}
          >
            <Users size={16} className="mr-2" /> Agents{" "}
            {pendingUsers.length > 0 && (
              <span className="ml-2 bg-secondary text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("REQUESTS")}
            className={`flex items-center rounded-lg py-2.5 px-6 text-sm font-medium leading-5 transition-all whitespace-nowrap ${activeTab === "REQUESTS" ? "bg-white text-primary shadow" : "text-white hover:bg-white/[0.12] hover:text-white"}`}
          >
            <Briefcase size={16} className="mr-2" /> Client Requests{" "}
            {requests.length > 0 && (
              <span className="ml-2 bg-secondary text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "DASHBOARD" && (
          <>
            {/* ... (System Status) ... */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 mb-8 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <Database size={18} className="mr-2 text-primary" /> System
                    Status
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Current connection status to Supabase Database.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm ${dbStatus === "connected" ? "bg-green-100 text-green-700" : dbStatus === "error" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {dbStatus === "checking" && (
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                    )}
                    {dbStatus === "connected" && (
                      <CheckCircle size={16} className="mr-2" />
                    )}
                    {dbStatus === "error" && (
                      <XCircle size={16} className="mr-2" />
                    )}
                    {dbStatus === "checking"
                      ? "Checking Connection..."
                      : dbStatus === "connected"
                        ? "Connected to Database"
                        : "Connection Failed"}
                  </div>
                  <button
                    onClick={checkDbConnection}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                    title="Retry Connection"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              {dbStatus === "error" && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  <span>
                    Error Details:{" "}
                    {dbErrorMessage || "Unknown Error. Please check Console."}
                  </span>
                </div>
              )}
            </div>

            {/* Analytics Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Traffic Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase">
                      Total Site Visits
                    </p>
                    <h3 className="text-4xl font-bold text-gray-800">
                      {visits.length}
                    </h3>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                    <Eye size={24} />
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Info size={14} className="mr-1" /> Unique visits tracked by
                  session.
                </div>
              </div>

              {/* Locations Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border-l-4 border-teal-500 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase">
                      Top Locations
                    </p>
                  </div>
                  <div className="bg-teal-100 p-3 rounded-full text-teal-600">
                    <Globe size={24} />
                  </div>
                </div>
                {visitsError ? (
                  <div className="p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                    {visitsError}
                  </div>
                ) : (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {locationStats.length === 0 ? (
                      <p className="text-gray-400 text-sm italic">
                        No data tracking yet...
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {locationStats.slice(0, 3).map(([location, count]) => (
                          <li
                            key={location}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              {location}
                            </span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                              {count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Standard Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border-l-4 border-secondary flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">
                    Pending Requests
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {pendingProperties.length + pendingUsers.length}
                  </h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-full text-secondary">
                  <Clock size={24} />
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border-l-4 border-green-500 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">
                    Active Properties
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {approvedProperties.length}
                  </h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border-l-4 border-blue-500 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">
                    Total Agents
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {users.length}
                  </h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <Users size={24} />
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border-l-4 border-red-500 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">
                    Rejected/Removed
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {rejectedProperties.length}
                  </h3>
                </div>
                <div className="bg-red-100 p-3 rounded-full text-red-600">
                  <XCircle size={24} />
                </div>
              </div>
            </div>

            {/* Pending Approvals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Properties */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden mb-8 border border-white/20">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">
                    Pending Properties
                  </h2>
                  <span className="bg-secondary text-primary text-xs font-bold px-2 py-1 rounded-full">
                    {pendingProperties.length} New
                  </span>
                </div>

                {pendingProperties.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Shield className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No pending property requests.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingProperties.slice(0, 5).map((prop) => (
                          <tr
                            key={prop.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                                  <img
                                    src={prop.images[0]}
                                    alt={prop.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {prop.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatPrice(prop.price)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditClick(prop)}
                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleApproveProperty(prop.id)}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                              >
                                Approve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Agents - (No changes needed) */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden mb-8 border border-white/20">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">
                    Pending Agents
                  </h2>
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {pendingUsers.length} New
                  </span>
                </div>
                {pendingUsers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No pending agent applications.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingUsers.slice(0, 5).map((u) => (
                          <tr
                            key={u.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mr-2 overflow-hidden border border-gray-300">
                                  {u.passportUrl ? (
                                    <img
                                      src={u.passportUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <UserIcon size={14} />
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {u.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleApproveUser(u.id)}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                              >
                                Approve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Agents Tab - No image changes needed here as it shows passports */}
        {activeTab === "AGENTS" && (
          <div className="space-y-8">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/20">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">
                  Agent Applications
                </h2>
              </div>
              {users.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>No registered agents found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agent Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden border border-gray-300 cursor-pointer hover:scale-110 transition-transform">
                                {user.passportUrl ? (
                                  <img
                                    src={user.passportUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <UserIcon size={20} />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.email}
                                </div>
                                {user.businessName && (
                                  <div className="text-xs text-secondary font-medium">
                                    {user.businessName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {user.state}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "Approved" ? "bg-green-100 text-green-800" : user.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {user.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.id)}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {user.status === "Approved" && (
                              <button
                                onClick={() => handleRejectUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Revoke Access
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "PROPERTIES" && (
          <div className="space-y-8">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/20">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">
                  All Active Properties
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                  {approvedProperties.length} Live
                </span>
              </div>

              {approvedProperties.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Building className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>No active properties available.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price/Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvedProperties.map((property) => (
                        <tr
                          key={property.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                                <img
                                  src={property.images[0]}
                                  alt={property.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {property.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-xs">
                                  {property.description}
                                </div>
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 border border-gray-200">
                                  {property.category}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <MapPin
                                size={14}
                                className="text-gray-400 mr-1"
                              />
                              {property.location.state}
                            </div>
                            <div className="text-xs text-gray-500 ml-5">
                              {property.location.lga}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {formatPrice(property.price)}
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1
                              ${property.type === "For Sale" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                            >
                              {property.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(property);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-md transition-colors inline-flex items-center mr-2 group cursor-pointer"
                              title="Edit Property"
                            >
                              <Edit
                                size={16}
                                className="mr-2 group-hover:scale-110 transition-transform"
                              />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProperty(property.id);
                              }}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-md transition-colors inline-flex items-center group cursor-pointer"
                              title="Mark as Sold/Rented (Delete)"
                            >
                              <Trash2
                                size={16}
                                className="mr-2 group-hover:scale-110 transition-transform"
                              />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requests - (No changes needed, request.propertyImage is string) */}
        {activeTab === "REQUESTS" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Client Requests
            </h2>
            {requests.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-md rounded-xl p-12 text-center text-gray-500 shadow-xl border border-white/20">
                <Briefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg">No client requests yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 overflow-hidden flex flex-col"
                  >
                    <div className="bg-gray-50 border-b border-gray-100 p-4 flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-300">
                        <img
                          src={request.propertyImage}
                          alt={request.propertyTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-gray-800 truncate">
                          {request.propertyTitle}
                        </h4>
                        <p className="text-sm text-secondary font-semibold">
                          {formatPrice(request.propertyPrice)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ref ID: {request.propertyId.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 flex-grow space-y-4">
                      <div className="flex items-start">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">
                            Client Name
                          </p>
                          <p className="text-gray-800 font-medium">
                            {request.clientName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Smartphone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">
                            Phone
                          </p>
                          <p className="text-gray-800 font-medium">
                            {request.clientPhone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">
                            Email
                          </p>
                          <p className="text-gray-800 font-medium break-all">
                            {request.clientEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">
                            Address
                          </p>
                          <p className="text-gray-800 font-medium">
                            {request.clientAddress}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.clientLga}, {request.clientState}
                          </p>
                        </div>
                      </div>
                      <div className="border-t pt-4 mt-2">
                        <p className="text-xs text-gray-400 flex items-center">
                          <Clock size={12} className="mr-1" /> Received:{" "}
                          {formatDate(request.dateRequested)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(request.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center cursor-pointer"
                      >
                        <Trash2 size={16} className="mr-2" /> Delete Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Edit Modal --- */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-900 opacity-75"
                onClick={() => setEditingProperty(null)}
              ></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5 pb-2 border-b">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <Edit className="mr-2 text-secondary" size={20} /> Edit
                    Property
                  </h3>
                  <button
                    onClick={() => setEditingProperty(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form
                  id="editForm"
                  onSubmit={handleSaveEdit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price (NGN)
                      </label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            price: Number(e.target.value),
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            type: e.target.value as PropertyType,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                      >
                        <option value={PropertyType.SALE}>For Sale</option>
                        <option value={PropertyType.RENT}>For Rent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            category: e.target.value as PropertyCategory,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                      >
                        <option value={PropertyCategory.HOUSE}>House</option>
                        <option value={PropertyCategory.LAND}>Land</option>
                        <option value={PropertyCategory.COMMERCIAL}>
                          Cars & others
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
                      Location
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <select
                          value={editForm.location?.state}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              location: {
                                ...editForm.location!,
                                state: e.target.value,
                                lga: "",
                              },
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                        >
                          {NIGERIAN_STATES.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          LGA
                        </label>
                        <select
                          value={editForm.location?.lga}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              location: {
                                ...editForm.location!,
                                lga: e.target.value,
                              },
                            })
                          }
                          disabled={!editForm.location?.state}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm disabled:bg-gray-100"
                        >
                          <option value="">Select LGA</option>
                          {editAvailableLgas.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Address
                        </label>
                        <input
                          type="text"
                          value={editForm.location?.address}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              location: {
                                ...editForm.location!,
                                address: e.target.value,
                              },
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Features (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={editForm.featuresString}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          featuresString: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as PropertyStatus,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                    >
                      <option value={PropertyStatus.APPROVED}>Approved</option>
                      <option value={PropertyStatus.PENDING}>Pending</option>
                      <option value={PropertyStatus.REJECTED}>Rejected</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  form="editForm"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-secondary text-base font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Save size={16} className="mr-2 mt-0.5" /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
