import React, { useState, useRef } from 'react';
import { Recording } from '../App';
import { Clock, HardDrive, Trash2, Download, Film, Loader2, Play, X } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { getActiveRecordingProfile } from '../hooks/recordingConfig';

interface LibraryViewProps {
  recordings: Recording[];
  onDelete: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ recordings, onDelete }) => {
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegRef.current = ffmpeg;
      return ffmpeg;
    } catch (e) {
      console.error('FFmpeg load error', e);
      alert('Failed to load converter. Your browser might block high-performance scripts needed for MP4 conversion. Try using WebM.');
      return null;
    }
  };

  const downloadFile = (blobUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExport = async (rec: Recording, format: 'webm' | 'mp4') => {
    if (format === 'webm') {
      downloadFile(rec.blobUrl, `${rec.title.replace(/[:/]/g, '-')}.webm`);
      return;
    }

    setConvertingId(rec.id);
    setConversionProgress(0);
    const ffmpeg = await loadFFmpeg();
    if (!ffmpeg) {
      setConvertingId(null);
      return;
    }

    const { export: recordingProfile } = getActiveRecordingProfile();
    const fps = recordingProfile.fps;
    const totalFrames = Math.max(1, rec.duration * fps);

    ffmpeg.on('log', ({ message }) => {
      if (message.includes('frame=') && message.includes('time=')) {
        const frameMatch = message.match(/frame=\s*(\d+)/);
        const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);

        if (frameMatch) {
          const currentFrame = parseInt(frameMatch[1]);
          const percent = Math.min((currentFrame / totalFrames) * 100, 100);
          setConversionProgress(percent);
        } else if (timeMatch) {
          const h = parseInt(timeMatch[1]);
          const m = parseInt(timeMatch[2]);
          const s = parseFloat(timeMatch[3]);
          const currentSec = h * 3600 + m * 60 + s;
          const percent = Math.min((currentSec / rec.duration) * 100, 100);
          setConversionProgress(percent);
        }
      }
    });

    try {
      const inputName = 'input.webm';
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(rec.blob));
      await ffmpeg.exec([
        '-i', inputName,
        '-vf', `scale=${recordingProfile.scaleWidth}:-2,fps=${recordingProfile.fps}`,
        '-c:v', 'libx264',
        '-preset', recordingProfile.preset,
        '-crf', String(recordingProfile.crf),
        '-c:a', 'aac',
        '-b:a', recordingProfile.audioBitrate,
        '-movflags', '+faststart',
        '-stats',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const mp4Blob = new Blob([data as Uint8Array], { type: 'video/mp4' });
      const mp4Url = URL.createObjectURL(mp4Blob);
      downloadFile(mp4Url, `${rec.title.replace(/[:/]/g, '-')}.mp4`);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (e) {
      console.error(e);
      alert('Conversion failed. Please try exporting as WebM.');
    } finally {
      setConvertingId(null);
      setConversionProgress(0);
    }
  };

  return (
    <div className="h-full relative">
      <div className="h-full overflow-y-auto p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-light text-white mb-2">Session Gallery</h2>
          <p className="text-zinc-500 text-sm">
            {recordings.length === 0
              ? 'No new captures in this session.'
              : `${recordings.length} unsaved capture${recordings.length === 1 ? '' : 's'}.`}
          </p>
        </header>

        {recordings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((rec) => (
              <div
                key={rec.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col relative"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-black relative overflow-hidden group/thumb">
                  {rec.thumbnailUrl ? (
                    <img
                      src={rec.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <span className="text-zinc-700 text-xs">No Preview</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setPlayingUrl(rec.blobUrl)}
                      className="p-3 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-all text-white"
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {formatDuration(rec.duration)}
                  </div>

                  {/* Conversion Overlay */}
                  {convertingId === rec.id && (
                    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center flex-col gap-3 z-20 px-8">
                      <div className="w-full flex justify-between text-xs text-zinc-400 mb-1">
                        <span>Converting to MP4...</span>
                        <span>{conversionProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                          style={{ width: `${conversionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Meta & Actions */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="text-sm font-medium text-zinc-200 truncate" title={rec.title}>
                    {rec.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto">
                    <span>{formatSize(rec.blob.size)}</span>
                    <span className="uppercase tracking-wider text-zinc-600">WEBM</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                    <button
                      onClick={() => handleExport(rec, 'webm')}
                      disabled={!!convertingId}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      <Download className="w-3 h-3" />
                      WebM
                    </button>
                    <button
                      onClick={() => handleExport(rec, 'mp4')}
                      disabled={!!convertingId}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-colors text-xs font-bold disabled:opacity-50"
                    >
                      <Film className="w-3 h-3" />
                      MP4
                    </button>
                  </div>

                  <button
                    onClick={() => onDelete(rec.id)}
                    disabled={!!convertingId}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-red-900/10 text-zinc-500 hover:text-red-400 transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full py-24 rounded-2xl border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4 text-zinc-500">
            <HardDrive className="w-12 h-12 opacity-20" />
            <p className="text-lg">No recordings yet.</p>
            <p className="text-sm">Start capturing to see them here.</p>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {playingUrl && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex flex-col">
          <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-black">
            <span className="text-sm font-medium text-zinc-400">Preview</span>
            <button
              onClick={() => setPlayingUrl(null)}
              className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <video
              src={playingUrl}
              controls
              autoPlay
              className="max-h-full max-w-full rounded shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};