"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const ITEM_TYPES = [
  { id: "essence", name: "Essence" },
  { id: "head", name: "Head" },
  { id: "body", name: "Body" },
  { id: "trait", name: "Trait" },
  { id: "overexposed", name: "Over Exposed" },
  { id: "consumable", name: "Consumable" },
  { id: "boost", name: "Boost" },
  { id: "special", name: "Special Item" },
];

const ESSENCE_TYPES = [
  "stone", "disco", "paul", "cartoon", "candy", "tiles", 
  "moss", "bullish", "journalist", "laser", "flashbulb", 
  "accordion", "turret", "drill", "security"
];

const DURATION_OPTIONS = [
  { id: 3600, name: "1 Hour" },
  { id: 86400, name: "1 Day" },
  { id: 259200, name: "3 Days" },
  { id: 604800, name: "1 Week" },
  { id: 2592000, name: "30 Days" },
  { id: 0, name: "No Expiration" },
];

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export default function AdminShopPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [itemType, setItemType] = useState("essence");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [essenceType, setEssenceType] = useState("stone");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(86400);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  
  // Background effects state
  const [particles, setParticles] = useState<Array<{id: number, left: string, top: string, delay: string, duration: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);

  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getOrCreateUser({ 
          walletAddress: "admin_wallet_123" 
        });
        if (user) {
          setUserId(user._id as Id<"users">);
        }
      } catch (error) {
        console.error("Error initializing user:", error);
        setMessage("Error initializing user");
      }
    };
    initUser();
    
    // Generate background effects
    const generatedParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${5 + Math.random() * 5}s`,
    }));
    setParticles(generatedParticles);
    
    const generatedStars = [...Array(60)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.5,
    }));
    setStars(generatedStars);
  }, [getOrCreateUser]);

  // Get active listings with pagination - PAUSED TO SAVE BANDWIDTH
  const listingsData = null; // useQuery(api.marketplace.getActiveListings, {
  //   limit: 100,
  //   offset: 0,
  // });
  
  const listings = listingsData?.listings;
  
  // Mutations
  const createAdminListing = useMutation(api.marketplace.createAdminListing);
  const cancelListing = useMutation(api.marketplace.cancelListing);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle create listing
  const handleCreateListing = async () => {
    if (!userId) {
      setMessage("User not initialized");
      return;
    }

    if (!itemName || !price || !quantity) {
      setMessage("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      // For now, we'll use the image URL directly
      // In production, you'd upload the image to a storage service first
      const imageToUse = imagePreview || imageUrl || "";

      const expiresAt = duration > 0 ? Date.now() + (duration * 1000) : undefined;

      await createAdminListing({
        sellerId: userId,
        itemType: itemType,
        itemVariation: itemName,
        itemDescription: itemDescription || undefined,
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(price),
        imageUrl: imageToUse || undefined,
        expiresAt,
        essenceType: itemType === "essence" ? essenceType : undefined,
      });

      // Reset form
      setItemName("");
      setItemDescription("");
      setPrice("");
      setQuantity("1");
      setImageUrl("");
      setUploadedImage(null);
      setImagePreview("");
      setMessage("Listing created successfully!");
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error: unknown) {
      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel listing
  const handleCancelListing = async (listingId: Id<"marketListings">) => {
    if (!userId) return;
    
    try {
      await cancelListing({
        userId,
        listingId,
      });
      setMessage("Listing cancelled!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: unknown) {
      setMessage(`Error: ${getErrorMessage(error)}`);
    }
  };

  // Filter admin listings
  const adminListings = listings?.filter(l => l.sellerId === userId) || [];

  // Show loading state while initializing
  if (!userId) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Initializing Admin Panel...</div>
          <div className="text-gray-400">Setting up admin user</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.08) 0%, transparent 70%)
            `
          }}
        />
        
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: star.twinkle ? `starTwinkle ${2 + Math.random() * 2}s ease-in-out infinite` : 'none',
              animationDelay: star.twinkle ? `${Math.random() * 2}s` : '0s',
            }}
          />
        ))}
        
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `floatParticle ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay,
              boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div 
          className="relative mb-8 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
            border: '2px solid #fab617',
            boxShadow: '0 0 30px rgba(250, 182, 23, 0.4)',
            padding: '28px'
          }}
        >
          <h1 
            style={{
              fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
              fontSize: '42px',
              fontWeight: 900,
              color: '#fab617',
              letterSpacing: '0.1em',
              textShadow: '0 0 25px rgba(250, 182, 23, 0.7)',
            }}
          >
            ADMIN SHOP MANAGER
          </h1>
          <p className="text-gray-400 mt-2">Create and manage shop listings</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes("Error") 
              ? "bg-red-900/50 border border-red-500 text-red-300" 
              : "bg-green-900/50 border border-green-500 text-green-300"
          }`}>
            {message}
          </div>
        )}

        {/* Create Listing Form */}
        <div className="mb-8 bg-gray-900/80 border border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Create New Listing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Item Type *
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                >
                  {ITEM_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Essence Type (if essence selected) */}
              {itemType === "essence" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Essence Type *
                  </label>
                  <select
                    value={essenceType}
                    onChange={(e) => setEssenceType(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  >
                    {ESSENCE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Item Name/Variation *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Legendary Boost, Rare Head #42"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Optional description of the item..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.1"
                  step="0.1"
                  placeholder="1"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Price per Unit (Gold) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                  placeholder="100"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Listing Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                >
                  {DURATION_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Item Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400"
                  />
                  <div className="text-xs text-gray-500">OR</div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL (optional)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Preview */}
              {(imagePreview || imageUrl) && (
                <div className="mt-2">
                  <img 
                    src={imagePreview || imageUrl} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border border-gray-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handleCreateListing}
              disabled={isSubmitting}
              className={`px-6 py-3 font-bold rounded-lg transition-all ${
                isSubmitting
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-500 to-yellow-400 text-black hover:shadow-lg hover:shadow-yellow-500/30"
              }`}
              style={{
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                letterSpacing: '0.05em'
              }}
            >
              {isSubmitting ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </div>

        {/* Active Admin Listings */}
        <div className="bg-gray-900/80 border border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Active Admin Listings</h2>
          
          {adminListings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No active admin listings
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminListings.map((listing) => (
                <div
                  key={listing._id}
                  className="bg-gray-800/60 border border-gray-700 rounded-lg p-4"
                >
                  {listing.imageUrl && (
                    <img 
                      src={listing.imageUrl} 
                      alt={listing.itemVariation} 
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="font-bold text-yellow-400 mb-2">
                    {listing.itemVariation || listing.itemType}
                  </div>
                  {listing.itemDescription && (
                    <div className="text-sm text-gray-400 mb-2">
                      {listing.itemDescription}
                    </div>
                  )}
                  <div className="text-sm text-gray-300">
                    Type: {listing.itemType}
                  </div>
                  <div className="text-sm text-gray-300">
                    Quantity: {listing.quantity}
                  </div>
                  <div className="text-sm text-gray-300">
                    Price: {listing.pricePerUnit}g per unit
                  </div>
                  {listing.expiresAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Expires: {new Date(listing.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                  <button
                    onClick={() => handleCancelListing(listing._id)}
                    className="mt-3 w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded transition-all"
                  >
                    Cancel Listing
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}