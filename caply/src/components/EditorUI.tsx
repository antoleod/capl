import { useCaply, STYLE_OPTIONS, ASPECT_OPTIONS } from '../hooks/useCaply';

export const EditorUI = () => {
  const {
    allMedia, aspect, setAspect, style, setStyle, audio, hasAudio, removeAudio,
    audioLoop, setAudioLoop, audioVolume, setAudioVolume,
    showAdvancedSettings, setShowAdvancedSettings, advancedSummary,
    quality, setQuality, fps, setFps, bitrate, setBitrate, transition, setTransition,
    generate, phase, progress, audioInputRef, handleAudio, removePhoto, removeVideo
  } = useCaply();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-40">
      <div className="max-w-5xl mx-auto p-6 space-y-10">
        
        {/* 1. CREATIVE CONTROLS - Header Area */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 shadow-2xl">
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Canvas Aspect</label>
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
              {ASPECT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setAspect(opt)}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${aspect === opt ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-white'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Visual Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setStyle(opt)}
                  className={`px-5 py-2.5 text-xs font-black rounded-full border-2 transition-all ${style === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. MAIN TIMELINE (Photos & Videos) */}
        <section className="space-y-3">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Video Track</h3>
            <span className="text-[10px] text-gray-600 font-mono">{allMedia.length} items</span>
          </div>
          
          <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-5 shadow-inner">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
              {allMedia.map((item) => (
                <div key={item.id} className="relative w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/5 shadow-xl group transition-transform hover:scale-105 active:cursor-grabbing">
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                    {item.type === 'image' ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <button 
                    onClick={() => item.type === 'image' ? removePhoto(item.id) : removeVideo(item.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/5 transition-all">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                <span className="text-[10px] font-bold uppercase">Add Media</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. AUDIO TIMELINE TRACK */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-gray-500 px-2 uppercase tracking-[0.2em]">Audio Track</h3>
          {!hasAudio ? (
            <button 
              onClick={() => audioInputRef.current?.click()}
              className="w-full py-6 bg-blue-600/5 border-2 border-dashed border-blue-500/20 rounded-[2rem] flex items-center justify-center gap-3 text-blue-400 hover:bg-blue-600/10 transition-all group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
              <span className="font-black uppercase text-xs tracking-widest">Import Soundtrack</span>
            </button>
          ) : (
            <div className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black truncate max-w-[300px]">{audio?.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">MP3 Track • Master</span>
                  </div>
                </div>
                <button onClick={() => removeAudio()} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase text-gray-500 font-black">Fade In/Out</span>
                  <input type="range" className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="loop" checked={audioLoop} onChange={e => setAudioLoop(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600" />
                  <label htmlFor="loop" className="text-[10px] uppercase text-gray-400 font-black tracking-tighter">Loop Track</label>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase text-gray-500 font-black">Volume</span>
                  <input type="range" value={audioVolume * 100} onChange={e => setAudioVolume(Number(e.target.value)/100)} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
              </div>
            </div>
          )}
          <input type="file" ref={audioInputRef} className="hidden" onChange={(e) => handleAudio(e.target.files)} accept="audio/*" />
        </section>

        {/* 4. ADVANCED SETTINGS Area */}
        <section className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden shadow-xl">
          <button 
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Engine Export Settings</span>
              {!showAdvancedSettings && <span className="text-[10px] text-blue-400 font-mono mt-1 uppercase">{advancedSummary}</span>}
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {showAdvancedSettings && (
            <div className="p-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 animate-in slide-in-from-top-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Resolution</label>
                <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full bg-black/40 border-white/10 rounded-xl text-xs font-bold text-white p-2.5">
                  <option>720p</option><option>1080p</option><option>4K</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Framerate</label>
                <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full bg-black/40 border-white/10 rounded-xl text-xs font-bold text-white p-2.5">
                  <option>24</option><option>30</option><option>60</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Encoding Bitrate</label>
                <select value={bitrate} onChange={(e) => setBitrate(e.target.value)} className="w-full bg-black/40 border-white/10 rounded-xl text-xs font-bold text-white p-2.5">
                  <option>4M</option><option>8M</option><option>16M</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">FX Transition</label>
                <select value={transition} onChange={(e) => setTransition(e.target.value)} className="w-full bg-black/40 border-white/10 rounded-xl text-xs font-bold text-white p-2.5">
                  <option>fade</option><option>none</option><option>slide</option>
                </select>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* 5. GENERATE BUTTON (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-2xl border-t border-white/5 z-50">
        <div className="max-w-3xl mx-auto relative">
          <button 
            onClick={generate}
            disabled={phase === 'rendering' || allMedia.length === 0}
            className="w-full py-5 bg-white text-black rounded-[2rem] font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-[0.97] hover:bg-gray-200 transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:shadow-none uppercase tracking-[0.2em]"
          >
            {phase === 'rendering' ? `Rendering... ${Math.round(progress)}%` : 'GENERATE VIDEO'}
          </button>
        </div>
      </div>
    </div>
  );
};