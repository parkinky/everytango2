import React from 'react';

/**
 * TangoMilongaHallSilhouette
 * Depicts the rich social milonga hall from the user's photo (a grand ballroom filled with
 * couples dancing the Argentine tango in embrace across the wooden floor) as an elegant,
 * non-intrusive subtle monochrome silhouette.
 */
export const TangoMilongaHallSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 480 180"
        fill="currentColor"
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="tangoFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="25%" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="70%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <g fill="url(#tangoFade)">
          {/* Architectural Hall Accents (Grand ballroom arches & balcony from the photo) */}
          <path
            d="M50,15 Q240,0 450,15 L450,22 Q240,8 50,22 Z"
            opacity="0.25"
          />
          <path
            d="M360,18 L460,70 L460,76 L360,24 Z"
            opacity="0.3"
          />

          {/* Background Couple 1 (Far left floor) */}
          <circle cx="75" cy="52" r="6" />
          <circle cx="86" cy="54" r="5.5" />
          <path d="M70,60 C75,56 86,56 92,62 C90,75 88,95 85,130 L73,130 C75,105 72,85 70,60 Z" />

          {/* Background Couple 2 (Center back embrace) */}
          <circle cx="140" cy="46" r="6.5" />
          <circle cx="152" cy="48" r="6" />
          <path d="M134,55 C142,50 154,50 160,57 C156,72 153,100 152,145 L142,145 C141,110 137,80 134,55 Z" />

          {/* Foreground Couple 3 (Prominent Argentine Tango close embrace couple - center left) */}
          <g>
            {/* Leader head & torso */}
            <circle cx="210" cy="38" r="8.5" />
            {/* Follower head leaning in close embrace */}
            <circle cx="225" cy="43" r="7.5" />
            {/* Embracing upper bodies with arm curve */}
            <path d="M198,50 C206,46 226,48 238,56 C240,68 232,82 226,98 C220,115 228,145 235,178 L218,178 C215,150 208,125 204,95 C200,80 196,65 198,50 Z" />
            {/* Follower dress drape & extended leg/cross (Ocho / Boleo gesture) */}
            <path d="M228,85 C238,98 248,118 252,148 L238,155 C234,130 226,110 224,95 Z" />
            {/* Extended left arm connection */}
            <path d="M198,58 C188,64 185,76 192,85 C196,82 200,74 203,66 Z" />
          </g>

          {/* Midground Couple 4 (Dancing couple - middle right) */}
          <g>
            <circle cx="295" cy="44" r="7.5" />
            <circle cx="308" cy="47" r="7" />
            <path d="M288,54 C296,50 312,52 320,60 C316,78 312,108 316,165 L304,165 C300,128 294,92 288,54 Z" />
            {/* Follower embrace arm and back arch */}
            <path d="M312,62 C324,70 330,85 328,102 C322,96 318,85 315,72 Z" />
          </g>

          {/* Foreground Couple 5 (Right side couple from photo in dramatic tango embrace) */}
          <g>
            {/* Tall Leader & Follower in tight cheek-to-cheek abrazo */}
            <circle cx="380" cy="34" r="9" />
            <circle cx="395" cy="40" r="8" />
            {/* Classic tango tuxedo / silhouette posture */}
            <path d="M368,46 C378,42 400,45 410,54 C406,75 398,105 395,145 C394,158 402,175 408,180 L388,180 C382,155 376,120 372,85 C368,70 366,56 368,46 Z" />
            {/* Follower leg extension / high heel silhouette line */}
            <path d="M404,82 C418,100 428,125 436,155 L424,160 C416,132 406,108 400,90 Z" />
            {/* Framing arm clasp */}
            <path d="M368,54 C358,62 355,75 364,84 C368,80 372,70 374,60 Z" />
          </g>

          {/* Ambient crowd depth silhouettes (dancing couples fading to ballroom edges) */}
          <circle cx="445" cy="56" r="6" />
          <circle cx="455" cy="60" r="5.5" />
          <path d="M438,65 C444,60 456,64 462,72 C458,95 454,130 452,170 L442,170 C442,130 440,95 438,65 Z" opacity="0.6" />

          {/* Dance floor reflection base line */}
          <rect x="60" y="176" width="400" height="2" opacity="0.15" rx="1" />
        </g>
      </svg>
    </div>
  );
};
