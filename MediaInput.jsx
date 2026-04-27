import React, { useRef } from "react";
import { Upload, Music, Image as ImageIcon, Video, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MediaInput({ 
  photos, 
  videos, 
  audio, 
  onFilesAdd, 
  onPhotoRemove, 
  onVideoRemove, 
  onAudioRemove 
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      onFilesAdd(e.target.files);
      e.target.value = ""; 
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Botón Único de Carga Inteligente */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1 shadow-inner">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-cyan-300/30 bg-cyan-300/[0.05] p-8 text-center transition hover:border-cyan-300/70 hover:bg-cyan-300/[0.08] active:scale-[0.98]"
        >
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/25 transition group-hover:scale-110">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-lg font-black text-white">Add Assets</p>
          <p className="mt-1 text-xs text-slate-400 text-balance">
            Drop photos, videos or music here to start your story
          </p>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*"
          multiple
          className="hidden"
        />
      </div>

      {/* Listado Inteligente de Archivos Subidos */}
      <div className="space-y-3">
        {/* Sección de Fotos/Videos (Miniaturas) */}
        {(photos.length > 0 || videos.length > 0) && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black">
                <img src={p.url} className="h-full w-full object-cover opacity-80" alt="" />
                <button onClick={() => onPhotoRemove(p.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 rounded bg-black/40 px-1 text-[8px] text-white/70">IMG</div>
              </div>
            ))}
            {videos.map((v) => (
              <div key={v.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black">
                <video src={v.url} className="h-full w-full object-cover opacity-80" />
                <button onClick={() => onVideoRemove(v.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-cyan-500/80 px-1 text-[8px] font-bold text-slate-950">
                  <Video className="h-2 w-2" /> MP4
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sección de Música (Estilo Card que pediste) */}
        <AnimatePresence>
          {audio && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden"
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{audio.name}</p>
                    <p className="text-[10px] text-slate-400 italic">Custom audio track</p>
                    {/* Visualizador de onda animado */}
                    <div className="mt-2 flex h-3 items-end gap-0.5">
                      {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 0.3, 0.7, 0.4].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-cyan-400/40 rounded-full"
                          animate={{ height: [`${h * 100}%`, `${(1 - h) * 100}%`, `${h * 100}%`] }}
                          transition={{ duration: 0.8 + i * 0.1, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onAudioRemove}
                  className="ml-2 rounded-lg bg-white/5 p-2 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!audio && (photos.length > 0 || videos.length > 0) && (
          <div className="rounded-2xl border border-dashed border-white/10 p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Auto-sync music enabled</p>
          </div>
        )}
      </div>
    </div>
  );
}