import React from 'react';
import { useCaply, STYLE_OPTIONS, ASPECT_OPTIONS } from '../hooks/useCaply';

export const EditorUI = () => {
  const {
    allMedia, aspect, setAspect, style, setStyle, audio, hasAudio,
    showAdvancedSettings, setShowAdvancedSettings, advancedSummary,
    quality, setQuality, fps, setFps, bitrate, setBitrate, transition, setTransition,
    generate, phase, progress, audioInputRef, handleAudio, removePhoto, removeVideo
  } = useCaply();

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-3xl mx-auto p-4 space-y-8">
        
        {/* 1. MEDIA TIMELINE (Merged Row) */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Media Timeline</h3>
          <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-[2rem] p-4 shadow-xl shadow-black/5">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {allMedia.map((item) => (
                <div key={item.id} className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group">
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 bg-black/40 backdrop-blur-sm p-1 rounded-lg">
                    {item.type === 'image' ? (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <button 
                    onClick={() => item.type === 'image' ? removePhoto(item.id) : removeVideo(item.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* 2. CORE SETTINGS (Segmented Buttons) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Aspect Ratio</label>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {ASPECT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setAspect(opt)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${aspect === opt ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setStyle(opt)}
                  className={`px-4 py-2 text-xs font-bold rounded-full border-2 transition-all ${style === opt ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. AUDIO SECTION (Simplified) */}
        <section className="bg-white p-6 rounded-2xl shadow-sm">
          {!hasAudio ? (
            <button 
              onClick={() => audioInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
              <span className="font-bold">Add Audio Track</span>
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  <span className="text-sm font-bold truncate max-w-[200px]">{audio?.name}</span>
                </div>
                <button className="text-xs text-red-500 font-bold underline">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="text-center"><span className="block text-[10px] uppercase text-gray-400 font-bold">Trim</span><input type="checkbox" className="mt-1" /></div>
                <div className="text-center"><span className="block text-[10px] uppercase text-gray-400 font-bold">Loop</span><input type="checkbox" className="mt-1" /></div>
                <div className="text-center"><span className="block text-[10px] uppercase text-gray-400 font-bold">Fade</span><input type="checkbox" className="mt-1" /></div>
              </div>
            </div>
          )}
          <input type="file" ref={audioInputRef} className="hidden" onChange={(e) => handleAudio(e.target.files)} accept="audio/*" />
        </section>

        {/* 4. ADVANCED SETTINGS (Collapsible) */}
        <section className="border border-gray-200 rounded-2xl overflow-hidden">
          <button 
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-bold text-gray-700">Advanced Settings</span>
              {!showAdvancedSettings && <span className="text-xs text-gray-400 font-medium">{advancedSummary}</span>}
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {showAdvancedSettings && (
            <div className="p-6 bg-white border-t border-gray-100 grid grid-cols-2 gap-6 animate-in slide-in-from-top-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Quality</label>
                <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full bg-gray-50 border-none rounded-lg text-sm font-bold">
                  <option>720p</option><option>1080p</option><option>4K</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">FPS</label>
                <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full bg-gray-50 border-none rounded-lg text-sm font-bold">
                  <option>24</option><option>30</option><option>60</option>
                </select>
              </div>
              {/* ... Bitrate and Transition would go here ... */}
            </div>
          )}
        </section>

      </div>

      {/* 5. GENERATE BUTTON (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-3xl mx-auto relative">
          <button 
            onClick={generate}
            disabled={phase === 'rendering'}
            className="w-full py-4 bg-black text-white rounded-2xl font-black text-lg shadow-xl shadow-black/10 active:scale-[0.98] transition-all disabled:bg-gray-400"
          >
            {phase === 'rendering' ? `Rendering... ${Math.round(progress)}%` : 'GENERATE VIDEO'}
          </button>
        </div>
      </div>
    </div>
  );
};