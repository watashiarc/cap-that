// /hooks/recordingConfig.ts

//
// 1) Types
//
export type RecordingProfileId =
  | 'low'     // Fastest browser conversion; smallest files
  | 'medium'  // Balanced defaults for browser-based ffmpeg
  | 'high'    // Higher quality; browser conversion slow
  | 'server'; // For server-side ffmpeg only (too heavy for WASM)

export interface RecordingSettings {
  width: number;
  height: number;
  frameRate: number;
  videoBitsPerSecond: number;
}

export interface ExportSettings {
  scaleWidth: number;   // target width (height auto)
  fps: number;
  crf: number;          // x264 quality (lower = better)
  preset: string;       // x264 preset
  audioBitrate: string;
  maxDurationMP4: number;
}

export interface RecordingProfile {
  recording: RecordingSettings;
  export: ExportSettings;
}

//
// 2) Profiles (simple names + clear comments)
//
export const RECORDING_PROFILES: Record<RecordingProfileId, RecordingProfile> = {
  
  // FAST browser profile (smallest size, quickest WASM conversion)
  low: {
    recording: {
      width: 1280,
      height: 720,
      frameRate: 30,
      videoBitsPerSecond: 2_000_000, // 2 Mbps
    },
    export: {
      scaleWidth: 1280,
      fps: 30,
      crf: 30,             // more compression, faster encode
      preset: 'ultrafast', // WASM-friendly
      audioBitrate: '96k',
      maxDurationMP4: 30,  // keep short or WASM will crawl
    },
  },

  // Balanced default for browser-based MP4 export
  medium: {
    recording: {
      width: 1600,
      height: 900,
      frameRate: 30,
      videoBitsPerSecond: 3_000_000,
    },
    export: {
      scaleWidth: 1600,
      fps: 30,
      crf: 28,
      preset: 'ultrafast',
      audioBitrate: '128k',
      maxDurationMP4: 45,
    },
  },

  // Higher-quality settings (WASM conversion will be slow — short clips only)
  high: {
    recording: {
      width: 1920,
      height: 1080,
      frameRate: 30,
      videoBitsPerSecond: 5_000_000,
    },
    export: {
      scaleWidth: 1920,
      fps: 30,
      crf: 23,             // standard x264 quality
      preset: 'fast',      // too slow for WASM on long videos
      audioBitrate: '160k',
      maxDurationMP4: 60,
    },
  },

  // For server-side ffmpeg — NOT suitable for in-browser conversion
  server: {
    recording: {
      width: 1920,
      height: 1080,
      frameRate: 60,
      videoBitsPerSecond: 8_000_000,
    },
    export: {
      scaleWidth: 1920,
      fps: 60,
      crf: 20,
      preset: 'medium',
      audioBitrate: '192k',
      maxDurationMP4: 300, // ok because server handles it
    },
  },
};

//
// 3) Active profile
//
let activeProfileId: RecordingProfileId = 'medium';

export const getActiveRecordingProfileId = () => activeProfileId;

export const setActiveRecordingProfileId = (id: RecordingProfileId) => {
  activeProfileId = id;
};

export const getActiveRecordingProfile = (): RecordingProfile => {
  return RECORDING_PROFILES[activeProfileId];
};
