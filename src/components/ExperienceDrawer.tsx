import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Star, 
  User, 
  Calendar, 
  Sparkles, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  MapPin, 
  Link as LinkIcon,
  Maximize2
} from 'lucide-react';
import { TangoEvent, EventExperience, SupportedLanguage } from '../types';
import { useExperiences } from '../context/ExperiencesContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n';
import { formatDateTimeToCST } from '../utils/formatters';

interface ExperienceDrawerProps {
  event: TangoEvent | null;
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
}

export const ExperienceDrawer: React.FC<ExperienceDrawerProps> = ({
  event,
  isOpen,
  onClose,
  currentLang,
}) => {
  const t = translations[currentLang];
  const { getExperiencesForEvent, addExperience, deleteExperience } = useExperiences();
  const { userProfile, currentUser } = useAuth();

  // Active sub-tab inside drawer: 'view' (list of past stories) or 'write' (create new story)
  const [activeTab, setActiveTab] = useState<'view' | 'write'>('view');

  // Form state
  const [content, setContent] = useState('');
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear().toString());
  const [rating, setRating] = useState<number>(5);
  const [photos, setPhotos] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [guestAuthorId, setGuestAuthorId] = useState('');
  const [guestAuthorName, setGuestAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Lightbox photo preview
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !event) return null;

  const pastExperiences = getExperiencesForEvent(event.event_name);
  const currentUserId = userProfile?.username || currentUser?.email || guestAuthorId;
  const currentDisplayName = userProfile?.username || currentUser?.displayName || currentUser?.email || guestAuthorName;

  // Compress & convert file to data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
  };

  const processFiles = (files: File[]) => {
    setErrorMsg('');
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select valid image files (JPG, PNG, WebP).');
        return;
      }
      // Read & compress image using canvas
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPhotos((prev) => [...prev, dataUrl]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setPhotos((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg('Please write your experience or review.');
      return;
    }

    const finalAuthorId = currentUserId.trim() || 'dancer_' + Math.random().toString(36).substring(2, 6);
    const finalAuthorName = currentDisplayName.trim() || 'Tango Dancer';

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await addExperience({
      event_id: event.id,
      event_name: event.event_name,
      author_id: finalAuthorId,
      author_name: finalAuthorName,
      content: content.trim(),
      rating,
      attendance_year: attendanceYear,
      photos,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Experience and photos successfully saved!');
      setContent('');
      setPhotos([]);
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('view');
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to save experience.');
    }
  };

  const formatDate = (isoStr: string) => {
    return formatDateTimeToCST(isoStr, false);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-50 transition-opacity backdrop-blur-xs"
        aria-hidden="true"
      />

      {/* Slide-over Right Half Screen Panel */}
      <aside 
        id="experience-right-half-drawer"
        className="fixed top-0 right-0 h-full w-full md:w-1/2 bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-50 text-red-600 border border-red-100 tracking-wider">
                Event Community Archive
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {event.country_code} · {event.city}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate" title={event.event_name}>
              {event.event_name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / View Sub-tabs */}
        <div className="px-6 pt-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'view'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Community Stories ({pastExperiences.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('write')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'write'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Share Experience & Photos</span>
            </button>
          </div>

          {activeTab === 'view' && (
            <button
              onClick={() => setActiveTab('write')}
              className="mb-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Story</span>
            </button>
          )}
        </div>

        {/* Scrollable Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">

          {/* =========================================================================
              VIEW TAB: List of Past Experiences & Photos
              Matches past and future events with the same or recurring title
              ========================================================================= */}
          {activeTab === 'view' && (
            <div className="space-y-4">
              {/* Event Title Continuity Notice */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Historical Continuity:</strong> All reviews, tips, and photos posted for{' '}
                  <span className="font-semibold text-blue-950">"{event.event_name}"</span> are retained here.
                  Any future or recurring edition sharing this title will automatically display this dancer archive.
                </div>
              </div>

              {pastExperiences.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No dancer stories yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Be the first to share your experience, photos, venue atmosphere, and tips for future attendees!
                  </p>
                  <button
                    onClick={() => setActiveTab('write')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post First Story</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastExperiences.map((exp) => (
                    <article 
                      key={exp.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3"
                    >
                      {/* Author ID & Metadata Bar (Specification Requirement: Author ID and Created Date) */}
                      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-xs font-extrabold uppercase">
                            {exp.author_name ? exp.author_name.substring(0, 2) : 'TD'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">{exp.author_name}</span>
                              <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200" title="Author User ID">
                                ID: {exp.author_id}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{formatDate(exp.created_at)}</span>
                              {exp.attendance_year && (
                                <>
                                  <span>·</span>
                                  <span className="font-semibold text-gray-600">Attended {exp.attendance_year}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rating Stars */}
                        {exp.rating && (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 ${i < exp.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Content / Story Text */}
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line font-normal">
                        {exp.content}
                      </p>

                      {/* Photo Gallery Grid */}
                      {exp.photos && exp.photos.length > 0 && (
                        <div className="pt-2">
                          <div className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span>Uploaded Photos ({exp.photos.length})</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {exp.photos.map((photoUrl, photoIdx) => (
                              <div
                                key={photoIdx}
                                onClick={() => setSelectedPhoto(photoUrl)}
                                className="group relative aspect-4/3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-2xs hover:opacity-95 transition-all"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Experience photo ${photoIdx + 1} by ${exp.author_id}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                  <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              WRITE TAB: Form for Writing Experience & Uploading Photos
              ========================================================================= */}
          {activeTab === 'write' && (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5">
              
              <div>
                <h3 className="text-base font-bold text-gray-900">Share Your Experience & Photos</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your story and photos will be linked to <strong className="text-gray-800">{event.event_name}</strong> and preserved for all past and future editions.
                </p>
              </div>

              {/* Author Identification */}
              {userProfile || currentUser ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Posting as: <strong className="text-gray-900">{currentDisplayName}</strong></span>
                    <span className="font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      ID: {currentUserId}
                    </span>
                  </div>
                  <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold border border-green-200">
                    Verified User
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Your Dancer ID / Nickname *</label>
                    <input
                      type="text"
                      required
                      value={guestAuthorId}
                      onChange={(e) => {
                        setGuestAuthorId(e.target.value);
                        if (!guestAuthorName) setGuestAuthorName(e.target.value);
                      }}
                      placeholder="e.g. milonguero_nyc"
                      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Display Name</label>
                    <input
                      type="text"
                      value={guestAuthorName}
                      onChange={(e) => setGuestAuthorName(e.target.value)}
                      placeholder="e.g. Alex M."
                      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Year Attended & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Attended Year</label>
                  <select
                    value={attendanceYear}
                    onChange={(e) => setAttendanceYear(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map((y) => (
                      <option key={y} value={y.toString()}>
                        {y} Edition
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Overall Rating</label>
                  <div className="flex items-center gap-1.5 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star 
                          className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-gray-600 ml-1.5">{rating} / 5 Stars</span>
                  </div>
                </div>
              </div>

              {/* Story / Experience Text Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Experience, Atmosphere & Tips *
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share details about the dance floor quality, DJs, ronda culture, venue temperature, nearby hotels, or memorable tandas..."
                  className="w-full bg-white border border-gray-200 rounded-md p-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 leading-relaxed"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Upload Photos</span>
                  <span className="text-[11px] font-normal text-gray-400">{photos.length} attached</span>
                </label>

                {/* Dropzone / Upload button */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-red-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-red-50/30"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-gray-700">Click to upload photos from device</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Supports JPG, PNG, WebP · Multiple images allowed</p>
                </div>

                {/* Or Add by Image URL */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or paste an image URL (https://...)"
                      className="w-full bg-white border border-gray-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors shrink-0"
                  >
                    Add URL
                  </button>
                </div>

                {/* Photos Preview Thumbnails */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                        <img 
                          src={photo} 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback messages */}
              {successMsg && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Experience & Photos</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </aside>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-black/50"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Enlarged experience photo"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
