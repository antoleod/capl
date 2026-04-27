import React, { useRef } from "react";
import { Upload, Music, Video, X, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaInputProps {
  photos: any[];
  videos: any[];
  audio: any | null;
  onFilesAdd: (files: FileList | null) => void;
  uploadProgress: number | null; // Nueva prop
  isUploadSuccess?: boolean; // New prop for success state
  onCancelUpload?: () => void; // Nueva prop para cancelar, ahora opcional
  onPhotoRemove: (id: string) => void;
  onVideoRemove: (id: string) => void;
  onAudioRemove: () => void;
}

export function MediaInput({ 
  photos, 
  videos, 
  audio, 
  onFilesAdd, 
  uploadProgress,
  isUploadSuccess,
  onCancelUpload,
  onPhotoRemove, 
  onVideoRemove, 
  onAudioRemove 
}: MediaInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFilesAdd(e.target.files);
      e.target.value = ""; 
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1 shadow-inner">
        <div
          onClick={() => uploadProgress === null && !isUploadSuccess && fileInputRef.current?.click()}
          className={`group flex w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-cyan-300/30 bg-cyan-300/[0.05] p-8 text-center transition ${
            uploadProgress === null && !isUploadSuccess 
              ? "hover:border-cyan-300/70 hover:bg-cyan-300/[0.08] active:scale-[0.98] cursor-pointer" 
              : "cursor-default"
          }`}
        >
          {isUploadSuccess ? (
            <div className="w-full max-w-xs space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-sm font-bold text-white">Upload Complete!</p>
            </div>
          ) : uploadProgress !== null ? (
            <div className="w-full max-w-xs space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.08]">
                <RefreshCw className="h-6 w-6 animate-spin text-cyan-300" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-white">Uploading assets... {uploadProgress}%</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div 
                    className="h-full bg-cyan-300" 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCancelUpload?.(); }}
                  className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                >
                  Cancel Upload
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/25 transition group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-lg font-black text-white">Add Assets</p>
              <p className="mt-1 text-xs text-slate-400 text-balance">
                Drop photos, videos or music here
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*"
          multiple
          className="hidden"
        />
      </div>

      <div className="space-y-3">
        {(photos.length > 0 || videos.length > 0) && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black">
                <img src={p.url} className="h-full w-full object-cover opacity-80" alt="" />
                <button onClick={() => onPhotoRemove(p.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {videos.map((v) => (
              <div key={v.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black">
                <video src={v.url} className="h-full w-full object-cover opacity-80" />
                <button onClick={() => onVideoRemove(v.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {audio && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{audio.name}</p>
                    {/* Onda de audio animada */}
                    <div className="mt-2 flex h-2 items-end gap-0.5">
                      {[0.4, 0.7, 1, 0.8, 0.5].map((h, i) => (
                        <motion.div key={i} className="w-1 bg-cyan-400/40 rounded-full" animate={{ height: [`${h * 100}%`, `${(1 - h) * 100}%`, `${h * 100}%`] }} transition={{ duration: 0.8 + i * 0.1, repeat: Infinity }} />
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={onAudioRemove} className="text-slate-400 hover:text-red-400"><X className="h-4 w-4" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}