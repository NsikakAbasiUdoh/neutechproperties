
import React, { useState, useMemo, useEffect } from 'react';
import { PropertyContextType, PropertyType, PropertyCategory, Property, PropertyStatus, UserStatus } from '../types';
import { NIGERIAN_STATES } from '../constants';
import { generatePropertyDescription } from '../services/geminiService';
import { uploadImage } from '../services/supabaseClient';
import { Sparkles, Upload as UploadIcon, CheckCircle, AlertCircle, Loader2, XCircle, Lock, LogIn, Key, UserCheck, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';

interface UploadProps {
  propertyContext: PropertyContextType;
  onNavigate: (view: any) => void;
}

const Upload: React.FC<UploadProps> = ({ propertyContext, onNavigate }) => {
  const { addProperty, publisherAccessCode, adminAccessCode, currentUser } = propertyContext;

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Check for login on mount
  useEffect(() => {
    if (currentUser && currentUser.status === UserStatus.APPROVED) {
        setIsAuthenticated(true);
        if (currentUser.phone) {
            setFormData(prev => ({ ...prev, contactPhone: currentUser.phone }));
        }
    }
  }, [currentUser]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    state: '',
    lga: '',
    address: '',
    type: PropertyType.SALE,
    category: PropertyCategory.HOUSE,
    description: '',
    featuresString: '',
    contactPhone: '09062712610'
  });

  // Multiple Image State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableLgas = useMemo(() => {
    const state = NIGERIAN_STATES.find(s => s.name === formData.state);
    return state ? state.lgas : [];
  }, [formData.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const newPreviews: string[] = [];
      let sizeError = '';

      const minSize = 25 * 1024; // 25KB
      
      selectedFiles.forEach((file: File) => {
          // Basic validation
          if (file.size < minSize) {
              sizeError = `One or more images are too small (<25KB).`;
          } else {
              validFiles.push(file);
              newPreviews.push(URL.createObjectURL(file));
          }
      });

      if (sizeError) {
          setError(sizeError);
      } else {
          setError('');
      }
      
      setImageFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviews]);
      
      // Clear input so same files can be selected again if needed
      e.target.value = ''; 
    }
  };

  const removeImage = (index: number) => {
      const newFiles = [...imageFiles];
      const newPreviews = [...previewUrls];
      
      // Revoke object URL to avoid memory leak
      URL.revokeObjectURL(newPreviews[index]);

      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      
      setImageFiles(newFiles);
      setPreviewUrls(newPreviews);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === publisherAccessCode || accessCode === adminAccessCode) {
        setIsAuthenticated(true);
        setAuthError('');
    } else {
        setAuthError('Invalid Publisher Code');
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.state || !formData.featuresString) {
        setError("Please fill in Title, State, and Features before generating a description.");
        return;
    }
    setError('');
    setIsGenerating(true);
    
    const desc = await generatePropertyDescription(
        formData.title,
        formData.type,
        `${formData.lga}, ${formData.state}`,
        formData.featuresString
    );
    
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Detailed Validation
    const missingFields = [];
    if (!formData.title) missingFields.push("Property Title");
    if (!formData.price) missingFields.push("Price");
    if (!formData.state) missingFields.push("State");
    if (!formData.lga) missingFields.push("LGA");
    if (imageFiles.length === 0) missingFields.push("At least one Property Image");

    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}.`);
      return;
    }

    setIsUploading(true);

    try {
        // 1. Upload Images to Supabase in parallel
        const uploadPromises = imageFiles.map(file => uploadImage(file, 'properties'));
        const uploadedUrls = await Promise.all(uploadPromises);
        
        // Filter out any failed uploads (nulls)
        const validImageUrls = uploadedUrls.filter(url => url !== null) as string[];

        if (validImageUrls.length === 0) {
            throw new Error("Failed to upload images. Please check your connection.");
        }

        // 2. Create Property Record
        const newProperty: Property = {
          id: crypto.randomUUID(), // Use secure UUID
          title: formData.title,
          description: formData.description || 'No description provided.',
          price: Number(formData.price),
          location: {
              state: formData.state,
              lga: formData.lga,
              address: formData.address
          },
          features: formData.featuresString.split(',').map(f => f.trim()).filter(f => f !== ''),
          type: formData.type,
          category: formData.category,
          images: validImageUrls, // Save array of URLs
          dateAdded: Date.now(),
          contactPhone: formData.contactPhone,
          status: PropertyStatus.PENDING,
          agentId: currentUser?.id // Link to current agent
        };

        const result = await addProperty(newProperty);
        
        if (result.success) {
            setIsUploading(false);
            setSuccess('Property uploaded successfully! It is now pending approval by an admin.');
            
            setTimeout(() => {
                if(currentUser) {
                    onNavigate('AGENTS'); // Return to Agent Dashboard
                } else {
                    onNavigate('LISTINGS');
                }
            }, 2500);
        } else {
            // Display Database Error
            setIsUploading(false);
            setError(result.error || "Failed to save property. Please try again.");
            // Scroll to top to ensure user sees the error
            window.scrollTo(0, 0);
        }

    } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred during upload.");
        setIsUploading(false);
        window.scrollTo(0, 0);
    }
  };

  if (!isAuthenticated) {
    if (currentUser && currentUser.status === UserStatus.PENDING) {
         return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-8 text-center border border-white/20">
                     <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Account Pending</h2>
                    <p className="text-gray-500 mt-2">Your agent account is currently waiting for admin approval. You cannot upload properties yet.</p>
                </div>
            </div>
         );
    }
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-white/20 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                        <UploadIcon size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Publisher Access</h2>
                    <p className="text-gray-500 mt-2">Enter your Agent ID to list a property.</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Publisher Code</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors outline-none"
                                placeholder="••••••••"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key size={18} className="text-gray-400" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            {authError && <p className="text-sm text-red-600 flex items-center"><XCircle size={14} className="mr-1"/> {authError}</p>}
                            <button type="button" onClick={() => onNavigate('ADMIN')} className="text-xs text-gray-400 hover:text-secondary ml-auto">Forgot Code?</button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md transform hover:scale-[1.02] duration-200"
                    >
                        <LogIn size={18} className="mr-2" /> Verify Access
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <button onClick={() => onNavigate('AGENTS')} className="text-xs text-secondary font-bold hover:underline">
                        Are you a registered Agent? Login here.
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                        Don't have a code? Contact Neutech Admin.
                        <br/>
                        <span className="opacity-50">(Demo Current Code: {publisherAccessCode})</span>
                    </p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-primary/90 px-8 py-6 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                <UploadIcon className="mr-3" /> Upload New Property
                </h1>
                <p className="text-gray-400 mt-1">
                    {currentUser ? `Welcome Agent ${currentUser.name}` : 'Add a new land or house to the marketplace.'}
                </p>
            </div>
            {currentUser ? (
                 <div className="flex items-center text-green-400 text-xs bg-white/10 px-3 py-1 rounded-full">
                    <UserCheck size={12} className="mr-1" /> Verified Agent
                 </div>
            ) : (
                <button 
                    onClick={() => setIsAuthenticated(false)} 
                    className="text-xs text-gray-400 hover:text-white flex items-center"
                >
                    <Lock size={12} className="mr-1" /> Logout
                </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 flex items-center animate-pulse">
                <AlertCircle className="mr-2 flex-shrink-0" /> 
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 flex items-center">
                <CheckCircle className="mr-2 flex-shrink-0" /> {success}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Property Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Luxury 4-Bedroom Duplex"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price (NGN) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 50000000"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
                >
                  <option value={PropertyCategory.HOUSE}>House</option>
                  <option value={PropertyCategory.LAND}>Land</option>
                  <option value={PropertyCategory.COMMERCIAL}>Cars & others</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
                >
                  <option value={PropertyType.SALE}>For Sale</option>
                  <option value={PropertyType.RENT}>For Rent</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    readOnly
                    className="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm p-2 border bg-gray-100 text-gray-500 cursor-not-allowed pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-50/50 p-4 rounded-lg space-y-4 border border-gray-200">
                <h3 className="font-semibold text-gray-700">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">State *</label>
                        <select
                        name="state"
                        value={formData.state}
                        onChange={(e) => {
                             setFormData(prev => ({...prev, state: e.target.value, lga: ''}));
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
                        >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">L.G.A *</label>
                        <select
                        name="lga"
                        value={formData.lga}
                        onChange={handleChange}
                        disabled={!formData.state}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border disabled:bg-gray-100 bg-white/80"
                        >
                        <option value="">Select LGA</option>
                        {availableLgas.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address/Landmark</label>
                        <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g. Opposite Okpokpo Market"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
                        />
                    </div>
                </div>
            </div>

            {/* Features & Description */}
            <div>
               <label className="block text-sm font-medium text-gray-700">Features (comma separated)</label>
                <input
                  type="text"
                  name="featuresString"
                  value={formData.featuresString}
                  onChange={handleChange}
                  placeholder="e.g. Swimming Pool, Fenced, C of O, Tarred Road"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
                />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Description</span>
                <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="text-xs flex items-center text-purple-600 hover:text-purple-800 font-semibold disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="animate-spin w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Generate with AI
                </button>
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the property..."
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm p-2 border bg-white/80"
              />
            </div>

            {/* Multiple Image Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Property Images *</label>
                <div className="mt-1">
                    <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50/50 transition-colors bg-white/50">
                        <div className="space-y-1 text-center w-full">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 justify-center">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer bg-white/0 rounded-md font-medium text-secondary hover:text-amber-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-secondary"
                                >
                                    <span>Upload photos</span>
                                    <input 
                                        id="file-upload" 
                                        name="file-upload" 
                                        type="file" 
                                        multiple 
                                        className="sr-only" 
                                        onChange={handleImageChange} 
                                        accept="image/*" 
                                    />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF (Max 2MB per file)</p>
                        </div>
                    </div>
                </div>

                {/* Previews Grid */}
                {previewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {previewUrls.map((url, index) => (
                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                                >
                                    <XCircle size={14} />
                                </button>
                                {index === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                                        Cover
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-5">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-secondary hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
              >
                {isUploading ? <Loader2 className="animate-spin" /> : `Publish Property (${imageFiles.length} photos)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
