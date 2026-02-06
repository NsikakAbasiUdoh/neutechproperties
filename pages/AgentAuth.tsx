
import React, { useState, useEffect } from 'react';
import { PropertyContextType, UserStatus, PropertyStatus } from '../types';
import { NIGERIAN_STATES } from '../constants';
import { uploadImage } from '../services/supabaseClient';
import { User, Mail, Lock, Phone, MapPin, Briefcase, CheckCircle, AlertTriangle, ArrowRight, Loader2, Camera, Edit2, Save, X, Trash2, Building, Plus, Key, ArrowLeft } from 'lucide-react';

interface AgentAuthProps {
  propertyContext: PropertyContextType;
  onNavigate: (view: any) => void;
}

const AgentAuth: React.FC<AgentAuthProps> = ({ propertyContext, onNavigate }) => {
  const { loginUser, registerUser, currentUser, logoutUser, updateUser, properties, deleteProperty, users } = propertyContext;
  
  // Auth Views: 'LOGIN' | 'REGISTER' | 'FORGOT_PASS' | 'VERIFY_OTP' | 'RESET_PASS'
  const [authView, setAuthView] = useState('LOGIN');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string>('');

  // Password Reset States
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // Dashboard - Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: '',
      phone: '',
      businessName: '',
      state: ''
  });
  const [editPassportFile, setEditPassportFile] = useState<File | null>(null);
  const [editPassportPreview, setEditPassportPreview] = useState('');

  // Dashboard - Properties
  const myProperties = properties.filter(p => p.agentId === currentUser?.id);
  const pendingCount = myProperties.filter(p => p.status === PropertyStatus.PENDING).length;
  const approvedCount = myProperties.filter(p => p.status === PropertyStatus.APPROVED).length;

  useEffect(() => {
      if (currentUser) {
          setEditForm({
              name: currentUser.name || '',
              phone: currentUser.phone || '',
              businessName: currentUser.businessName || '',
              state: currentUser.state || ''
          });
          setEditPassportPreview(currentUser.passportUrl || '');
      }
  }, [currentUser]);


  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (25KB - 60KB)
      const minSize = 25 * 1024; // 25KB
      const maxSize = 60 * 1024; // 60KB

      if (file.size < minSize || file.size > maxSize) {
        setError('Image size must be between 25KB and 60KB.');
        return;
      }

      setError(''); // Clear error

      const preview = URL.createObjectURL(file);
      if (isEdit) {
          setEditPassportFile(file);
          setEditPassportPreview(preview);
      } else {
          setPassportFile(file);
          setPassportPreview(preview);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
        const success = loginUser(email, password);
        setIsLoading(false);
        if (success) {
            // onNavigate('UPLOAD'); // Removed auto-redirect to upload, stay on dashboard
        } else {
            setError('Invalid email or password.');
        }
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
    }

    if (!passportFile) {
        setError("Please upload a passport or ID photo.");
        setIsLoading(false);
        return;
    }

    try {
        const passportUrl = await uploadImage(passportFile, 'passports');
        
        if (!passportUrl) {
            throw new Error("Failed to upload passport image.");
        }

        await registerUser({
            name: fullName,
            email,
            phone,
            businessName,
            state,
            password,
            passportUrl: passportUrl
        });

        setIsLoading(false);
        setSuccess('Registration successful! Please login once an admin approves your account.');
        setAuthView('LOGIN');
        setFullName('');
        setBusinessName('');
        setPhone('');
        setState('');
        setPassword('');
        setPassportFile(null);
        setPassportPreview('');

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Registration failed. Please try again.");
        setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      setIsLoading(true);
      setError('');

      try {
          let passportUrl = currentUser.passportUrl;

          if (editPassportFile) {
              const newUrl = await uploadImage(editPassportFile, 'passports');
              if (newUrl) passportUrl = newUrl;
          }

          await updateUser(currentUser.id, {
              ...editForm,
              passportUrl
          });
          
          setIsEditing(false);
          setIsLoading(false);
      } catch (err: any) {
          setError("Failed to update profile.");
          setIsLoading(false);
      }
  };

  const handleDeleteProperty = async (id: string) => {
      if (confirm("Are you sure you want to delete this listing?")) {
          await deleteProperty(id);
      }
  }

  // --- Password Reset Handlers ---

  const initiatePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      const targetUser = users.find(u => u.email.toLowerCase() === resetEmail.toLowerCase());
      
      setTimeout(() => {
          setIsLoading(false);
          if (targetUser) {
              setTargetUserId(targetUser.id);
              setSuccess(`OTP sent to ${resetEmail}`);
              setTimeout(() => {
                setAuthView('VERIFY_OTP');
                setSuccess('');
              }, 1500);
          } else {
              setError("Email address not found in our records.");
          }
      }, 1000);
  };

  const verifyOtp = (e: React.FormEvent) => {
      e.preventDefault();
      if (otp === '123456') { // Mock OTP
          setAuthView('RESET_PASS');
          setError('');
      } else {
          setError('Invalid OTP. Please try again.');
      }
  };

  const finalizePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword.length < 6) {
          setError("Password must be at least 6 characters");
          return;
      }
      if (newPassword !== confirmPassword) {
          setError("Passwords do not match");
          return;
      }
      
      setIsLoading(true);
      if (targetUserId) {
          try {
              await updateUser(targetUserId, { password: newPassword });
              setIsLoading(false);
              setSuccess("Password reset successfully! Please login.");
              setTimeout(() => {
                  setAuthView('LOGIN');
                  setSuccess('');
                  setResetEmail('');
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
              }, 2000);
          } catch (e) {
              setIsLoading(false);
              setError("Failed to update password.");
          }
      }
  };


  // --- Render Logged In Dashboard ---
  if (currentUser) {
    return (
        <div className="min-h-screen pt-4 pb-20 px-4 max-w-7xl mx-auto">
             {/* Header */}
             <div className="flex justify-between items-center mb-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Agent Dashboard</h1>
                    <p className="text-gray-500 text-sm">Welcome back, {currentUser.name}</p>
                </div>
                <button 
                    onClick={logoutUser}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    Logout
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
                        <div className="bg-primary h-24 relative">
                            {isEditing && (
                                <div className="absolute top-4 right-4 z-10">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="bg-white/20 hover:bg-white/30 text-white p-1 rounded-full backdrop-blur-sm"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="px-6 pb-6 relative">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 -mt-12 overflow-hidden relative group shadow-md">
                                {editPassportPreview ? (
                                    <img src={editPassportPreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-4 text-gray-400" />
                                )}
                                {isEditing && (
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={24} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePassportChange(e, true)} />
                                    </label>
                                )}
                            </div>

                            {/* Info or Edit Form */}
                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name} 
                                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                                            className="w-full border-b border-gray-300 py-1 focus:border-secondary outline-none text-gray-800 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                        <input 
                                            type="text" 
                                            value={editForm.phone} 
                                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                            className="w-full border-b border-gray-300 py-1 focus:border-secondary outline-none text-gray-800 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase">Business Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.businessName} 
                                            onChange={e => setEditForm({...editForm, businessName: e.target.value})}
                                            className="w-full border-b border-gray-300 py-1 focus:border-secondary outline-none text-gray-800 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase">State</label>
                                        <select 
                                            value={editForm.state} 
                                            onChange={e => setEditForm({...editForm, state: e.target.value})}
                                            className="w-full border-b border-gray-300 py-1 focus:border-secondary outline-none text-gray-800 font-medium bg-transparent"
                                        >
                                            {NIGERIAN_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full bg-secondary text-white font-bold py-2 rounded-lg mt-4 flex items-center justify-center hover:bg-amber-600 transition-colors"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Save Changes</>}
                                    </button>
                                </form>
                            ) : (
                                <div className="mt-4">
                                    <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
                                    <p className="text-secondary font-medium text-sm">{currentUser.businessName || 'Independent Agent'}</p>
                                    
                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <Mail size={16} className="mr-3 text-gray-400" /> {currentUser.email}
                                        </div>
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <Phone size={16} className="mr-3 text-gray-400" /> {currentUser.phone}
                                        </div>
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <MapPin size={16} className="mr-3 text-gray-400" /> {currentUser.state}
                                        </div>
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <CheckCircle size={16} className="mr-3 text-green-500" /> {currentUser.status} Status
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="w-full mt-8 border border-gray-200 text-gray-600 font-semibold py-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <Edit2 size={16} className="mr-2" /> Edit Profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Work Area */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Total Listings</p>
                                <p className="text-2xl font-bold text-gray-800">{myProperties.length}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                                <Building size={20} />
                            </div>
                         </div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-full text-green-600">
                                <CheckCircle size={20} />
                            </div>
                         </div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Pending</p>
                                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-full text-amber-600">
                                <AlertTriangle size={20} />
                            </div>
                         </div>
                    </div>

                    {/* Publish Action */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-xl font-bold mb-1">Have a new property?</h3>
                            <p className="text-gray-300 text-sm">Upload details and get it listed on our marketplace.</p>
                        </div>
                        <button 
                            onClick={() => onNavigate('UPLOAD')}
                            className="bg-secondary hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-transform hover:scale-105 flex items-center"
                        >
                            <Plus size={20} className="mr-2" /> Publish Property
                        </button>
                    </div>

                    {/* My Properties List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">My Properties</h3>
                        </div>
                        
                        {myProperties.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Building className="mx-auto mb-3 opacity-20" size={48} />
                                <p>You haven't uploaded any properties yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {myProperties.map(property => (
                                    <div key={property.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                            {/* Changed from property.imageUrl to property.images[0] */}
                                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate">{property.title}</h4>
                                            <p className="text-sm text-gray-500 truncate">{property.location.address}, {property.location.state}</p>
                                            <p className="text-sm font-semibold text-secondary mt-1">
                                                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(property.price)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                ${property.status === PropertyStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                                                  property.status === PropertyStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {property.status}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteProperty(property.id)}
                                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                title="Delete Listing"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
             </div>
        </div>
    );
  }

  // ... (Login / Register / Forgot Password Views - Unchanged except import if needed) ...
  return (
    <div className="min-h-screen py-20 px-4 flex items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        
        {/* Left Side: Visuals */}
        <div className="relative hidden md:block bg-slate-900">
            <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop" 
                alt="Agent" 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent flex flex-col justify-end p-10 text-white">
                <h2 className="text-3xl font-bold mb-4">Join Our Network</h2>
                <p className="text-gray-300 mb-6">Connect with thousands of potential buyers and renters across Nigeria. Grow your real estate business with Neutech.</p>
                <div className="flex items-center space-x-2 text-sm text-secondary font-semibold">
                    <CheckCircle size={16} /> <span>Verified Listings</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-secondary font-semibold mt-2">
                    <CheckCircle size={16} /> <span>Instant Lead Notifications</span>
                </div>
            </div>
        </div>

        {/* Right Side: Forms */}
        <div className="p-8 md:p-12 flex flex-col justify-center min-h-[500px]">
            
            {authView === 'LOGIN' && (
                <>
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Login</h1>
                    <p className="text-gray-500 text-sm">Welcome back! Please enter your details.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center"><AlertTriangle size={16} className="mr-2 flex-shrink-0" /> {error}</div>}
                {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 text-sm flex items-center"><CheckCircle size={16} className="mr-2 flex-shrink-0" /> {success}</div>}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all"
                                placeholder="agent@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setAuthView('FORGOT_PASS')} className="text-sm text-secondary hover:underline font-semibold">
                            Forgot Password?
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account? <button onClick={() => setAuthView('REGISTER')} className="text-secondary font-bold hover:underline">Sign Up</button>
                    </p>
                </div>
                </>
            )}

            {authView === 'REGISTER' && (
                <>
                <div className="mb-6 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Become an Agent</h1>
                    <p className="text-gray-500 text-xs">Fill in the form to apply for an account.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center"><AlertTriangle size={16} className="mr-2 flex-shrink-0" /> {error}</div>}

                <form onSubmit={handleRegister} className="space-y-4">
                     {/* Passport Upload */}
                     <div>
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden border-2 border-dashed border-gray-300 flex-shrink-0 relative group">
                                {passportPreview ? (
                                    <img src={passportPreview} alt="Passport" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Camera size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label
                                    htmlFor="passport-upload"
                                    className="cursor-pointer text-secondary hover:text-amber-600 text-xs font-bold uppercase tracking-wide inline-block transition-colors"
                                >
                                    Upload Photo *
                                </label>
                                <input 
                                    id="passport-upload"
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handlePassportChange(e)}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                             <input 
                                type="text" 
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm"
                                placeholder="Full Name"
                            />
                        </div>
                         <div>
                             <input 
                                type="tel" 
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm"
                                placeholder="Phone (080...)"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                             <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm"
                             >
                                <option value="">State</option>
                                {NIGERIAN_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                             </select>
                        </div>
                        <div>
                             <input 
                                type="text" 
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm"
                                placeholder="Business Name"
                            />
                        </div>
                    </div>

                    <div>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm"
                            placeholder="Email Address"
                        />
                    </div>

                    <div>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm"
                            placeholder="Password (Min. 6)"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-secondary hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center mt-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Register Agent'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-600">
                        Already have an account? <button onClick={() => setAuthView('LOGIN')} className="text-secondary font-bold hover:underline">Login</button>
                    </p>
                </div>
                </>
            )}

            {authView === 'FORGOT_PASS' && (
                <div className="text-center">
                    <button onClick={() => setAuthView('LOGIN')} className="absolute top-8 left-8 text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h2>
                    <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a code to reset it.</p>
                    
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center justify-center"><AlertTriangle size={16} className="mr-2" /> {error}</div>}

                    <form onSubmit={initiatePasswordReset} className="space-y-4">
                        <div>
                            <input 
                                type="email" 
                                required
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none text-center"
                                placeholder="Enter your email"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Send Reset Code'}
                        </button>
                    </form>
                </div>
            )}

            {authView === 'VERIFY_OTP' && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your Email</h2>
                    <p className="text-gray-500 text-sm mb-6">We sent a 6-digit code to <span className="font-semibold">{resetEmail}</span></p>
                    
                    {success && <div className="bg-green-50 text-green-600 p-2 rounded mb-4 text-xs">{success}</div>}
                    {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

                    <form onSubmit={verifyOtp} className="space-y-4">
                        <input 
                            type="text" 
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none text-center text-2xl tracking-[0.5em] font-bold"
                            placeholder="000000"
                        />
                         <button 
                            type="submit" 
                            className="w-full bg-secondary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-amber-600 transition-all"
                        >
                            Verify Code
                        </button>
                    </form>
                </div>
            )}

            {authView === 'RESET_PASS' && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
                    <p className="text-gray-500 text-sm mb-6">Create a new, strong password for your account.</p>
                    
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center justify-center"><AlertTriangle size={16} className="mr-2" /> {error}</div>}

                    <form onSubmit={finalizePasswordReset} className="space-y-4 text-left">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">New Password</label>
                            <input 
                                type="password" 
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirm Password</label>
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none"
                            />
                        </div>
                         <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all mt-2"
                        >
                             {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Update Password'}
                        </button>
                    </form>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default AgentAuth;
