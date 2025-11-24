import React from 'react';
import { AppSettings } from '../App';
import { Settings2, Mic, Speaker } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
  
  const toggleMic = () => onUpdate({ ...settings, includeMic: !settings.includeMic });
  const toggleSys = () => onUpdate({ ...settings, includeSystemAudio: !settings.includeSystemAudio });

  return (
    <div className="max-w-2xl mx-auto p-8 h-full overflow-y-auto">
      <header className="mb-12 flex items-center gap-4 border-b border-zinc-900 pb-6">
        <div className="p-3 bg-zinc-900 rounded-xl">
            <Settings2 className="w-6 h-6 text-zinc-400" />
        </div>
        <div>
            <h2 className="text-2xl font-light text-white">Preferences</h2>
            <p className="text-zinc-500 text-sm">Configure your capture environment.</p>
        </div>
      </header>

      <div className="space-y-8">
        
        {/* Audio Sources */}
        <section>
             <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Audio Sources
            </h3>
            
            <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${settings.includeMic ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 text-zinc-600'}`}>
                            <Mic className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-medium text-zinc-200">Microphone Input</div>
                            <div className="text-xs text-zinc-500">Record voiceover from default input</div>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.includeMic ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
                         <div className={`w-4 h-4 rounded-full bg-black transition-transform ${settings.includeMic ? 'translate-x-6' : 'translate-x-0'}`} />
                         <input type="checkbox" className="hidden" checked={settings.includeMic} onChange={toggleMic} />
                    </div>
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-4">
                         <div className={`p-2 rounded-lg ${settings.includeSystemAudio ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 text-zinc-600'}`}>
                            <Speaker className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-medium text-zinc-200">System Audio</div>
                            <div className="text-xs text-zinc-500">Capture computer sound (must be enabled in browser dialog)</div>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.includeSystemAudio ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
                         <div className={`w-4 h-4 rounded-full bg-black transition-transform ${settings.includeSystemAudio ? 'translate-x-6' : 'translate-x-0'}`} />
                         <input type="checkbox" className="hidden" checked={settings.includeSystemAudio} onChange={toggleSys} />
                    </div>
                </label>
            </div>
        </section>

        <section className="pt-8 border-t border-zinc-900">
           <p className="text-xs text-zinc-600">
             Note: Recordings are captured in high-efficiency WebM. You can convert to MP4 (H.264) when exporting from the Library.
           </p>
        </section>
      </div>
    </div>
  );
};