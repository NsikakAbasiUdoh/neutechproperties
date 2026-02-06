
export enum PropertyType {
  SALE = 'For Sale',
  RENT = 'For Rent',
}

export enum PropertyCategory {
  HOUSE = 'House',
  LAND = 'Land',
  COMMERCIAL = 'Cars & others',
}

export enum PropertyStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    state: string;
    lga: string;
    address: string;
  };
  features: string[];
  type: PropertyType;
  category: PropertyCategory;
  images: string[]; // Changed from imageUrl to images array
  dateAdded: number;
  contactPhone: string;
  status: PropertyStatus;
  agentId?: string; // Link property to specific agent
}

export interface StateData {
  name: string;
  lgas: string[];
}

export enum UserStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  state?: string;
  password?: string; // Note: In production, never store plain text passwords
  passportUrl?: string;
  status: UserStatus;
  dateRequested: number;
}

export interface ClientRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string; // Keep single cover image for request summary
  propertyPrice: number;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  clientState: string;
  clientLga: string;
  dateRequested: number;
}

export type ViewState = 'HOME' | 'LISTINGS' | 'UPLOAD' | 'CONTACT' | 'ADMIN' | 'AGENTS';

export interface PropertyContextType {
  properties: Property[];
  // Updated signature to return error details
  addProperty: (property: Property) => Promise<{ success: boolean; error?: string }>;
  deleteProperty: (id: string) => Promise<boolean>;
  updatePropertyStatus: (id: string, status: PropertyStatus) => Promise<void>;
  filterState: string;
  filterLGA: string;
  setFilterState: (state: string) => void;
  setFilterLGA: (lga: string) => void;
  users: User[];
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  
  // Auth Logic
  currentUser: User | null;
  loginUser: (email: string, pass: string) => boolean;
  registerUser: (user: Partial<User>) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  logoutUser: () => void;
  
  // Requests Logic
  requests: ClientRequest[];
  addRequest: (request: ClientRequest) => Promise<void>;
  deleteRequest: (id: string) => Promise<boolean>;
  
  // Modal Logic
  openRequestModal: (property: Property) => void;
  closeRequestModal: () => void;
  isRequestModalOpen: boolean;
  currentRequestProperty: Property | null;

  // Access Control
  adminAccessCode: string;
  setAdminAccessCode: (code: string) => void;
  publisherAccessCode: string;
  setPublisherAccessCode: (code: string) => void;
}
