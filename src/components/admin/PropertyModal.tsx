"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  X, Upload, Trash2, Plus, Image as ImageIcon, Check, AlertCircle, 
  Loader2, Star, Building2, MapPin, DollarSign, BedDouble, Bath, Square
} from "lucide-react";
import { Property } from "@/data/properties";
import { supabase } from "@/lib/supabase";

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (property: Property) => void;
  propertyToEdit?: Property | null;
}

const PROPERTY_TYPES = ["Villa", "Estate", "Modern Home", "Mansion", "Penthouse", "Chalet"];
const PROPERTY_STATUSES = ["For Sale", "For Rent"] as const;

export function PropertyModal({
  isOpen,
  onClose,
  onSuccess,
  propertyToEdit,
}: PropertyModalProps) {
  const isEditing = Boolean(propertyToEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [locationKey, setLocationKey] = useState("");
  const [type, setType] = useState("Villa");
  const [price, setPrice] = useState("");
  const [priceValue, setPriceValue] = useState<number>(0);
  const [beds, setBeds] = useState<number>(4);
  const [baths, setBaths] = useState<number>(5);
  const [sqft, setSqft] = useState("6,500");
  const [badge, setBadge] = useState("New Listing");
  const [status, setStatus] = useState<string>("For Sale");
  const [description, setDescription] = useState("");
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // UI state
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form on open/propertyToEdit change
  useEffect(() => {
    if (propertyToEdit) {
      setTitle(propertyToEdit.title || "");
      setLocation(propertyToEdit.location || "");
      setLocationKey(propertyToEdit.locationKey || propertyToEdit.location || "");
      setType(propertyToEdit.type || "Villa");
      setPrice(propertyToEdit.price || "");
      setPriceValue(propertyToEdit.priceValue || 0);
      setBeds(propertyToEdit.beds || 4);
      setBaths(propertyToEdit.baths || 5);
      setSqft(propertyToEdit.sqft || "6,500");
      setBadge(propertyToEdit.badge || "Exclusive");
      setStatus(propertyToEdit.status || "For Sale");
      setDescription(propertyToEdit.description || "");
      setFloorPlanUrl(propertyToEdit.floorPlanUrl || "");
      setVirtualTourUrl(propertyToEdit.virtualTourUrl || "");
      setImages(Array.isArray(propertyToEdit.images) ? [...propertyToEdit.images] : []);
    } else {
      // Defaults for brand new property
      setTitle("");
      setLocation("Beverly Hills, CA");
      setLocationKey("Beverly Hills, CA");
      setType("Villa");
      setPrice("$15,000,000");
      setPriceValue(15000000);
      setBeds(5);
      setBaths(6);
      setSqft("8,500");
      setBadge("New Listing");
      setStatus("For Sale");
      setDescription("");
      setFloorPlanUrl("/floorplans/1.png");
      setVirtualTourUrl("");
      setImages([
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1080&q=75",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1080&q=75",
      ]);
    }
    setErrorMsg(null);
  }, [propertyToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle auto-calculating numeric priceValue when price text changes
  const handlePriceChange = (val: string) => {
    setPrice(val);
    const parsed = parseInt(val.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPriceValue(parsed);
    }
  };

  // Upload an image file to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploadingImage(true);

    try {
      const res = await supabase.properties.uploadImage(file);
      if (res.success && res.url) {
        setImages((prev) => [...prev, res.url!]);
      } else {
        setErrorMsg("Failed to upload image.");
      }
    } catch {
      setErrorMsg("Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Add external image URL
  const handleAddUrlImage = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      setErrorMsg("Please provide a valid URL starting with http://, https://, or /");
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setCustomImageUrl("");
    setErrorMsg(null);
  };

  // Remove image
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Set image as cover (move to index 0)
  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    setImages((prev) => {
      const item = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      return [item, ...rest];
    });
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please provide a property title.");
      return;
    }
    if (!location.trim()) {
      setErrorMsg("Please provide a location.");
      return;
    }
    if (!price.trim()) {
      setErrorMsg("Please provide a listing price.");
      return;
    }
    if (images.length === 0) {
      setErrorMsg("Please include at least one property image.");
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<Property> = {
      title: title.trim(),
      location: location.trim(),
      locationKey: (locationKey.trim() || location.trim()),
      type,
      price: price.trim(),
      priceValue: priceValue > 0 ? priceValue : 1000000,
      beds: Number(beds) || 1,
      baths: Number(baths) || 1,
      sqft: sqft.trim() || "5,000",
      badge: badge.trim(),
      status,
      description: description.trim() || `${type} in prime ${location} offering unparalleled luxury and design.`,
      images,
      floorPlanUrl: floorPlanUrl.trim() || "/floorplans/1.png",
      virtualTourUrl: virtualTourUrl.trim(),
      dimensions: propertyToEdit?.dimensions || [
        { room: "Primary Suite", size: "24' x 18'", sqft: 432, level: "Upper Level" },
        { room: "Grand Living Room", size: "32' x 22'", sqft: 704, level: "Main Level" },
        { room: "Chef's Kitchen", size: "20' x 16'", sqft: 320, level: "Main Level" },
      ],
      neighborhood: propertyToEdit?.neighborhood,
    };

    try {
      if (isEditing && propertyToEdit) {
        const res = await supabase.properties.update(propertyToEdit.id, payload);
        if (res.success && res.property) {
          onSuccess(res.property);
          onClose();
        } else {
          setErrorMsg("Failed to update property.");
        }
      } else {
        const res = await supabase.properties.create(payload);
        if (res.success && res.property) {
          onSuccess(res.property);
          onClose();
        } else {
          setErrorMsg("Failed to create property.");
        }
      }
    } catch {
      setErrorMsg("Failed to save property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div 
        data-lenis-prevent="true"
        className="relative w-full max-w-3xl bg-[#0c0c0c] border border-[#c5a059]/40 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[92dvh] text-white space-y-6"
        style={{ overscrollBehavior: "contain" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059]">
                Portfolio Management
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059]">
                {isEditing ? `Editing #${propertyToEdit?.id}` : "New Asset"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-light text-white mt-1">
              {isEditing ? `Edit: ${propertyToEdit?.title}` : "Add New Luxury Property"}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Configure estate details, pricing, and high-resolution media stored in Supabase.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0 touch-manipulation active:scale-90"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: General Info */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#c5a059]">1. General Estate Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Estate Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Glass Pavilion"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Location Display *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beverly Hills, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Location Filter Key</label>
                <input
                  type="text"
                  placeholder="e.g. Beverly Hills, CA"
                  value={locationKey}
                  onChange={(e) => setLocationKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Property Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none cursor-pointer"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Status & Badge</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none cursor-pointer"
                  >
                    {PROPERTY_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Badge (e.g. Trophy Asset)"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Specs */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#c5a059]">2. Financials & Architecture Specs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Display Price *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $18,500,000"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Numeric Price Value ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 18500000"
                  value={priceValue || ""}
                  onChange={(e) => setPriceValue(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Beds</label>
                <input
                  type="number"
                  min="0"
                  value={beds}
                  onChange={(e) => setBeds(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Baths</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={baths}
                  onChange={(e) => setBaths(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Square Feet</label>
                <input
                  type="text"
                  placeholder="e.g. 12,500"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="space-y-1.5 pt-3 border-t border-white/5">
            <label className="text-xs uppercase font-semibold tracking-wider text-[#c5a059]">3. Curated Description</label>
            <textarea
              rows={3}
              placeholder="Provide a compelling narrative describing this architectural estate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Section 4: Image Media Management & Supabase Storage */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase font-semibold tracking-wider text-[#c5a059]">
                  4. Property Media & Supabase Storage ({images.length} Images)
                </h3>
                <p className="text-[11px] text-white/40">
                  Upload high-res files directly to the secure Supabase Storage bucket or add image URLs.
                </p>
              </div>

              {/* Upload to Supabase Storage button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#c5a059] hover:bg-[#dfba74] text-black text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 shadow-md"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Storage...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload to Storage</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick URL adder */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Or paste an external image URL (https://...)"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrlImage();
                  }
                }}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddUrlImage}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                Add URL
              </button>
            </div>

            {/* Image Preview Grid */}
            {images.length === 0 ? (
              <div className="p-8 border border-dashed border-white/15 rounded-2xl text-center space-y-2 text-white/40">
                <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs">No images uploaded yet. Upload images above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {images.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="relative group rounded-xl overflow-hidden border border-white/15 bg-black/40 aspect-video"
                  >
                    <Image
                      src={imgUrl}
                      alt={`Estate photo ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#c5a059] text-black tracking-wider flex items-center gap-1 shadow-md">
                        <Star className="w-2.5 h-2.5 fill-black" />
                        Cover
                      </span>
                    )}

                    {/* Overlay Actions on Hover */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="p-1.5 rounded-lg bg-[#c5a059] text-black text-[10px] font-bold cursor-pointer hover:bg-[#dfba74] transition-colors"
                          title="Set as Cover Image"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white cursor-pointer transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Floor Plan & 3D Tour */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#c5a059]">5. Layout Plan & Virtual 3D Tour</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Floor Plan Map Link</label>
                <input
                  type="text"
                  placeholder="e.g. /floorplans/1.png"
                  value={floorPlanUrl}
                  onChange={(e) => setFloorPlanUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Matterport / 3D Tour URL</label>
                <input
                  type="text"
                  placeholder="https://my.matterport.com/show/?m=..."
                  value={virtualTourUrl}
                  onChange={(e) => setVirtualTourUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="px-6 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#dfba74] text-black text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-lg hover:shadow-[#c5a059]/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Estate...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Publish Estate Listing"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
