import React, { useContext, useMemo, useState } from "react";
import {
  PropertyContextType,
  PropertyType,
  PropertyCategory,
  PropertyStatus,
} from "../types";
import { NIGERIAN_STATES } from "../constants";
import PropertyCard from "../components/PropertyCard";
import { Filter, XCircle } from "lucide-react";

interface PropertiesProps {
  propertyContext: PropertyContextType;
}

const Properties: React.FC<PropertiesProps> = ({ propertyContext }) => {
  const {
    properties,
    filterState,
    filterLGA,
    setFilterState,
    setFilterLGA,
    openRequestModal,
  } = propertyContext;

  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  // Get LGAs for selected state
  const availableLgas = useMemo(() => {
    const state = NIGERIAN_STATES.find((s) => s.name === filterState);
    return state ? state.lgas : [];
  }, [filterState]);

  // Filter properties logic
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Must be approved
      if (p.status !== PropertyStatus.APPROVED) return false;

      const matchState = filterState ? p.location.state === filterState : true;
      const matchLGA = filterLGA ? p.location.lga === filterLGA : true;
      const matchType = filterType ? p.type === filterType : true;
      const matchCategory = filterCategory
        ? p.category === filterCategory
        : true;

      return matchState && matchLGA && matchType && matchCategory;
    });
  }, [properties, filterState, filterLGA, filterType, filterCategory]);

  const clearFilters = () => {
    setFilterState("");
    setFilterLGA("");
    setFilterType("");
    setFilterCategory("");
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-primary/90 backdrop-blur text-white py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Properties</h1>
          <p className="text-gray-400">
            Browse our available lands, houses, and commercial properties.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Filter Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold border-b pb-2">
            <Filter size={20} />
            <span>Filter Properties</span>
            {(filterState || filterLGA || filterType || filterCategory) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-red-500 text-sm flex items-center hover:underline"
              >
                <XCircle size={16} className="mr-1" /> Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={filterState}
                onChange={(e) => {
                  setFilterState(e.target.value);
                  setFilterLGA("");
                }}
                className="block w-full px-3 py-2 border border-gray-300 bg-gray-50/50 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                <option value="">All States</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* LGA Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                L.G.A
              </label>
              <select
                value={filterLGA}
                onChange={(e) => setFilterLGA(e.target.value)}
                disabled={!filterState}
                className="block w-full px-3 py-2 border border-gray-300 bg-gray-50/50 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">All LGAs</option>
                {availableLgas.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-gray-50/50 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                <option value="">All Types</option>
                <option value={PropertyType.SALE}>For Sale</option>
                <option value={PropertyType.RENT}>For Rent</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-gray-50/50 rounded-md shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                <option value="">All Categories</option>
                <option value={PropertyCategory.HOUSE}>House</option>
                <option value={PropertyCategory.LAND}>Land</option>
                <option value={PropertyCategory.COMMERCIAL}>
                  Cars & others
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onRequest={openRequestModal}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white/95 backdrop-blur-md rounded-lg border border-dashed border-gray-300 shadow-lg">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Filter size={48} strokeWidth={1} />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No properties found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters to find what you're looking
                for.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary hover:bg-amber-600 focus:outline-none"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Properties;
