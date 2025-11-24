import React, { useState, useEffect } from 'react';
import { RecorderView } from './components/RecorderView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { TopBar } from './components/TopBar';
import { Disc, LayoutGrid, SlidersHorizontal, Film } from 'lucide-react';

export type ViewState = 'recorder' | 'library' | 'settings';

export interface Recording {
  id: string;
  blobUrl: string;
  blob: Blob;
  title: string;
  createdAt: number;
  duration: number;
  thumbnailUrl?: string;
}

export interface AppSettings {
  includeMic: boolean;
  includeSystemAudio: boolean;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('recorder');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    includeMic: true,
    includeSystemAudio: true
  });

  // Helper to generate thumbnail
  const generateThumbnail = async (blobUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = blobUrl;
      video.currentTime = 1; // Capture at 1s
      video.onloadeddata = () => {
        video.currentTime = 1; 
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      video.onerror = () => resolve(''); // Fallback
    });
  };

  const handleSaveRecording = async (blob: Blob, duration: number) => {
    const blobUrl = URL.createObjectURL(blob);
    const thumb = await generateThumbnail(blobUrl);
    
    const newRecording: Recording = {
      id: crypto.randomUUID(),
      blobUrl,
      blob,
      title: `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
      duration,
      thumbnailUrl: thumb
    };

    setRecordings(prev => [newRecording, ...prev]);
    setCurrentView('library');
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => {
      const rec = prev.find(r => r.id === id);
      if (rec) URL.revokeObjectURL(rec.blobUrl);
      return prev.filter(r => r.id !== id);
    });
  };

  const NavButton = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`p-3 rounded-xl transition-all duration-300 group relative flex items-center justify-center
        ${currentView === view 
          ? 'bg-zinc-100 text-zinc-950 shadow-lg shadow-zinc-100/10' 
          : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="absolute left-16 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-zinc-700 z-50">
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[72px] bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-6 gap-8 z-20">
        <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 shadow-inner">
          <Film className="w-5 h-5 text-zinc-100" />
        </div>
        
        <nav className="flex flex-col gap-4 w-full items-center">
          <NavButton view="recorder" icon={Disc} label="Record" />
          <NavButton view="library" icon={LayoutGrid} label="Library" />
          <NavButton view="settings" icon={SlidersHorizontal} label="Settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-zinc-950 relative">
        <TopBar />
        
        <div className="flex-1 overflow-hidden relative p-6">
          <div className="w-full h-full max-w-7xl mx-auto bg-zinc-925 relative rounded-2xl overflow-hidden">
            {currentView === 'recorder' && (
              <RecorderView 
                onSave={handleSaveRecording} 
                settings={settings}
              />
            )}
            
            {currentView === 'library' && (
              <LibraryView 
                recordings={recordings} 
                onDelete={handleDeleteRecording}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView 
                settings={settings}
                onUpdate={setSettings}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}