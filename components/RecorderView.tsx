import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Square, Play, Save, RotateCcw } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';
import { AppSettings } from '../App';

interface RecorderViewProps {
  onSave: (blob: Blob, duration: number) => void;
  settings: AppSettings;
}

export const RecorderView: React.FC<RecorderViewProps> = ({ onSave, settings }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blobUrl: string, blob: Blob) => {
    setPreviewUrl(blobUrl);
    setLastBlob(blob);
  };

  const {
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,
    error,
    analyserNode,
    isPaused,
    togglePause
  } = useRecorder({ 
    onRecordingComplete: handleRecordingComplete,
    settings 
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Zen Visualizer
  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Draw subtle breathing circle
      const radius = 50 + (average / 2);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.9, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, analyserNode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (previewUrl && lastBlob) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
        <video 
          src={previewUrl} 
          controls 
          className="max-h-[60vh] max-w-[90%] rounded-lg shadow-2xl border border-zinc-800 bg-black"
        />
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setPreviewUrl(null);
              setLastBlob(null);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium border border-zinc-800"
          >
            <RotateCcw className="w-4 h-4" />
            Discard
          </button>
          <button 
            onClick={() => {
              onSave(lastBlob, recordingTime); // Pass the final duration from recorder state or logic
              setPreviewUrl(null);
              setLastBlob(null);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-100 text-zinc-950 hover:scale-105 transition-all text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Save to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
         <canvas ref={canvasRef} width="600" height="600" />
      </div>

      <div className="z-10 flex flex-col items-center gap-12">
        <div className="text-center space-y-2">
           <div className={`text-6xl font-light tabular-nums tracking-tighter transition-colors duration-300 ${isRecording ? 'text-zinc-100' : 'text-zinc-600'}`}>
             {formatTime(recordingTime)}
           </div>
           <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">
             {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
           </p>
        </div>

        {error && (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
            </div>
        )}

        <div className="flex items-center gap-6">
            {!isRecording ? (
                <button 
                    onClick={startRecording}
                    className="group relative flex items-center justify-center w-24 h-24 bg-zinc-100 rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-white/5"
                >
                    <div className="w-8 h-8 bg-red-500 rounded-full group-hover:scale-110 transition-transform duration-300" />
                </button>
            ) : (
                <>
                    <button 
                        onClick={togglePause}
                        className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                    >
                       {isPaused ? <Play className="w-6 h-6 fill-current" /> : <div className="w-5 h-5 border-l-2 border-r-2 border-current h-4 mx-0.5" />}
                    </button>
                    <button 
                        onClick={stopRecording}
                        className="p-8 rounded-full bg-zinc-100 text-zinc-950 hover:scale-105 transition-all shadow-lg shadow-white/10"
                    >
                        <Square className="w-6 h-6 fill-current" />
                    </button>
                </>
            )}
        </div>

        {!isRecording && (
          <div className="flex gap-4 text-xs text-zinc-500 font-medium tracking-wide">
            <span className={`flex items-center gap-1.5 ${!settings.includeMic && 'opacity-50 line-through'}`}>
              {settings.includeMic ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
              {settings.includeMic ? 'Mic On' : 'Mic Off'}
            </span>
            <span className="w-px h-3 bg-zinc-800 self-center"></span>
            <span className="uppercase">WEBM</span>
          </div>
        )}
      </div>
    </div>
  );
};