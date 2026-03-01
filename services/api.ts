import { Property, PropertyStatus } from '../types';

// Use safe access for env to prevent crash
const env = (import.meta as any).env || {};
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:5000/api';

export const apiService = {
  // Fetch all properties
  getAllProperties: async (): Promise<Property[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Add a new property
  addProperty: async (property: Property): Promise<Property> => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property),
      });
      if (!response.ok) throw new Error('Failed to add property');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Update property status
  updatePropertyStatus: async (id: string, status: PropertyStatus): Promise<Property> => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Delete a property
  deleteProperty: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete property');
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};