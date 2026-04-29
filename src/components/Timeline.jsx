import React, { useMemo, useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import { Film, Music, Wand2, Clock, ZoomIn, ZoomOut } from "lucide-react";

function TimelineRuler({ totalDuration = 60, pxPerSec }) {
  const marks = Array.from({ length: Math.ceil(totalDuration / 5) + 1 });
  return (
    <div className="relative mb-2 h-6 border-b border-white/10" style={{ width: totalDuration * pxPerSec }}>
      {marks.map((_, i) => (
        <div key={i} className="absolute bottom-0 flex flex-col items-center" style={{ left: i * 5 * pxPerSec }}>
          <div className="h-2 w-px bg-white/30" />
          <span className="mt-1 text-[8px] text-slate-500">{i * 5}s</span>
        </div>
      ))}
    </div>
  );
}

function TimelineClip({ item, type, duration = 5, pxPerSec }) {
  const bgColors = {
    media: "bg-indigo-500/40 border-indigo-400/30",
    audio: "bg-emerald-500/40 border-emerald-400/30",
    effect: "bg-purple-500/40 border-purple-400/30",
  };

  return (
    <motion.div
      layout
      className={`relative flex h-12 shrink-0 items-center gap-2 rounded-lg border px-2 py-1 overflow-hidden backdrop-blur-sm ${bgColors[type]}`}
      style={{ width: duration * pxPerSec }}
    >
      {item.url && type === "media" && (
        <img src={item.url} className="h-8 w-8 rounded object-cover opacity-60" alt="" />
      )}
      <span className="truncate text-[10px] font-medium text-white/90">{item.name || "Clip"}</span>
      <div className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-white/10 hover:bg-white/30" />
    </motion.div>
  );
}

function TrackRow({ icon: Icon, label, children }) {
  return (
    <div className="group flex items-start gap-4">
      <div className="flex h-12 w-24 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.03] text-slate-400 group-hover:bg-white/[0.05]">
        <Icon className="h-4 w-4" />
        <span className="mt-1 text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="relative flex h-12 flex-1 items-center gap-1 rounded-xl bg-black/20 p-1">
        {children}
      </div>
    </div>
  );
}

export function Timeline({ photos, videos, audio }) {
  const [pxPerSec, setPxPerSec] = useState(10);
  const [visualItems, setVisualItems] = useState([]);

  // Mock duration calculation for the UI
  const totalDuration = 60; 

  // Sync local state for reordering when props change
  useEffect(() => {
    const combined = [
      ...photos.map(p => ({ ...p, mediaType: 'photo', duration: 4 })),
      ...videos.map(v => ({ ...v, mediaType: 'video', duration: 8 }))
    ];
    setVisualItems(combined);
  }, [photos, videos]);

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-inner">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span>Editor Timeline</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            <button 
              onClick={() => setPxPerSec(Math.max(2, pxPerSec - 2))}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[40px] text-center text-[10px] font-mono text-slate-500">{pxPerSec}px/s</span>
            <button 
              onClick={() => setPxPerSec(Math.min(50, pxPerSec + 2))}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar overflow-x-auto pb-4">
        <div className="min-w-max space-y-3">
          <TimelineRuler totalDuration={totalDuration} pxPerSec={pxPerSec} />

          {/* Media Track (Photos & Videos) */}
          <TrackRow icon={Film} label="Visuals">
            {visualItems.length > 0 ? (
              <Reorder.Group axis="x" values={visualItems} onReorder={setVisualItems} className="flex gap-1">
                {visualItems.map((item) => (
                  <Reorder.Item key={item.id} value={item}>
                    <TimelineClip item={item} type="media" duration={item.duration} pxPerSec={pxPerSec} />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div className="flex w-full items-center justify-center text-[10px] text-slate-600 italic">
                Drop media to start
              </div>
            )}
          </TrackRow>

          {/* Placeholder Effects Track */}
          <TrackRow icon={Wand2} label="Effects">
            <div className="absolute left-[20px]">
              <TimelineClip item={{ name: "Auto-Transition" }} type="effect" duration={12} pxPerSec={pxPerSec} />
            </div>
            <div className="absolute left-[160px]">
              <TimelineClip item={{ name: "Color Grade" }} type="effect" duration={25} pxPerSec={pxPerSec} />
            </div>
          </TrackRow>

          {/* Audio Track */}
          <TrackRow icon={Music} label="Audio">
            {audio ? (
              <TimelineClip item={audio} type="audio" duration={totalDuration - 5} pxPerSec={pxPerSec} />
            ) : (
              <div className="flex w-full items-center justify-center text-[10px] text-slate-600 italic">
                No audio track
              </div>
            )}
          </TrackRow>
        </div>

        {/* Playhead Marker */}
        <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
             style={{ left: `calc(112px + ${15 * pxPerSec}px)` }} />
      </div>
    </div>
  );
}