import type { Dispatch, RefObject, SetStateAction } from "react";
import { AlertCircle, Clock, Music, Repeat, Scissors, Settings2, Sparkles, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CustomUnit, MediaAudio } from "../../types/caply";
import { ASPECT_OPTIONS, DURATION_OPTIONS, QUALITY_OPTIONS, STYLE_OPTIONS, TRANSITION_OPTIONS } from "../../config/options";
import { Section } from "../ui/Section";
import { Pill } from "../ui/Pill";

type ControlPanelProps = {
  audioInputRef: RefObject<HTMLInputElement | null>;
  audio: MediaAudio | null;
  removeAudio: () => void;

  duration: string;
  setDuration: Dispatch<SetStateAction<string>>;
  customDuration: string | number;
  setCustomDuration: Dispatch<SetStateAction<string | number>>;
  customUnit: CustomUnit;
  setCustomUnit: Dispatch<SetStateAction<CustomUnit>>;

  style: string;
  setStyle: Dispatch<SetStateAction<string>>;
  aspect: string;
  setAspect: Dispatch<SetStateAction<string>>;
  quality: string;
  setQuality: Dispatch<SetStateAction<string>>;

  fps: number;
  setFps: Dispatch<SetStateAction<number>>;
  bitrate: string;
  setBitrate: Dispatch<SetStateAction<string>>;
  transition: string;
  setTransition: Dispatch<SetStateAction<string>>;

  hasLongVideo: boolean;

  audioTrimStart: number;
  setAudioTrimStart: Dispatch<SetStateAction<number>>;
  audioTrimEnd: number | undefined;
  setAudioTrimEnd: Dispatch<SetStateAction<number | undefined>>;
  audioLoop: boolean;
  setAudioLoop: Dispatch<SetStateAction<boolean>>;
  audioFadeIn: number;
  setAudioFadeIn: Dispatch<SetStateAction<number>>;
  audioFadeOut: number;
  setAudioFadeOut: Dispatch<SetStateAction<number>>;
  audioVolume: number;
  setAudioVolume: Dispatch<SetStateAction<number>>;
};

export function ControlPanel(props: ControlPanelProps) {
  const {
    audioInputRef,
    audio,
    removeAudio,
    duration,
    setDuration,
    customDuration,
    setCustomDuration,
    customUnit,
    setCustomUnit,
    style,
    setStyle,
    aspect,
    setAspect,
    quality,
    setQuality,
    fps,
    setFps,
    bitrate,
    setBitrate,
    transition,
    setTransition,
    hasLongVideo,
    audioTrimStart,
    setAudioTrimStart,
    audioTrimEnd,
    setAudioTrimEnd,
    audioLoop,
    setAudioLoop,
    audioFadeIn,
    setAudioFadeIn,
    audioFadeOut,
    setAudioFadeOut,
    audioVolume,
    setAudioVolume,
  } = props;

  return (
    <div className="space-y-3">
      <Section icon={Music} title="Music" defaultOpen>
        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left text-sm transition hover:bg-white/[0.08]"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {audio ? (
              <>
                <Music className="h-4 w-4 shrink-0 text-cyan-300" />
                <span className="truncate">{audio.name}</span>
              </>
            ) : (
              "Auto music"
            )}
          </span>
          <span className="shrink-0 text-cyan-300">{audio ? "Change" : "Add"}</span>
        </button>

        {audio && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-xs text-slate-400">{audio.name}</span>
              <button type="button" onClick={removeAudio} className="text-xs text-red-300 hover:text-red-200">
                Remove
              </button>
            </div>

            <RangeField icon={Scissors} label="Trim start (s)" min={0} max={60} step={1} value={audioTrimStart} onChange={setAudioTrimStart} />
            <RangeField icon={Scissors} label={`Trim end (s) ${audioTrimEnd === undefined ? "(full)" : ""}`} min={0} max={300} step={1} value={audioTrimEnd ?? 0} onChange={(value) => setAudioTrimEnd(value || undefined)} />

            <label className="flex items-center gap-2 text-xs text-slate-300">
              <Repeat className="h-3 w-3" />
              <input type="checkbox" checked={audioLoop} onChange={(event) => setAudioLoop(event.target.checked)} className="accent-cyan-400" />
              Loop
            </label>

            <RangeField label="Fade in (s)" min={0} max={5} step={0.5} value={audioFadeIn} onChange={setAudioFadeIn} />
            <RangeField label="Fade out (s)" min={0} max={5} step={0.5} value={audioFadeOut} onChange={setAudioFadeOut} />
            <RangeField icon={Volume2} label="Volume" min={0} max={2} step={0.1} value={audioVolume} onChange={setAudioVolume} />
          </div>
        )}
      </Section>

      <Section icon={Clock} title="Duration" defaultOpen>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((item) => (
            <Pill key={item} active={duration === item} onClick={() => setDuration(item)}>
              {item}
            </Pill>
          ))}
        </div>

        {duration === "Custom" && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input
              value={customDuration}
              onChange={(event) => setCustomDuration(event.target.value)}
              type="number"
              min={1}
              className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-cyan-300"
            />
            <select
              value={customUnit}
              onChange={(event) => setCustomUnit(event.target.value as CustomUnit)}
              className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none"
            >
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
        )}

        {hasLongVideo && (
          <div className="mt-3 flex gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Long video — may take time and resources.
          </div>
        )}
      </Section>

      <Section icon={Sparkles} title="Style">
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((item) => (
            <Pill key={item} active={style === item} onClick={() => setStyle(item)}>
              {item}
            </Pill>
          ))}
        </div>
      </Section>

      <Section icon={Settings2} title="Export" defaultOpen>
        <OptionGroup label="Quality" options={QUALITY_OPTIONS} value={quality} onChange={setQuality} />
        <OptionGroup label="Format" options={ASPECT_OPTIONS} value={aspect} onChange={setAspect} />
        <OptionGroup
          label="Transition"
          options={TRANSITION_OPTIONS}
          value={transition}
          onChange={setTransition}
          render={(item) => (item === "fade" ? "Crossfade" : "None")}
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="FPS" value={fps} min={15} max={60} onChange={setFps} />
          <div>
            <p className="mb-1 text-xs text-slate-400">Bitrate</p>
            <input
              type="text"
              value={bitrate}
              onChange={(event) => setBitrate(event.target.value)}
              className="h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  render?: (item: T) => string;
}) {
  return (
    <div className="mb-3">
      <p className="mb-2 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => (
          <Pill key={item} active={value === item} onClick={() => onChange(item)}>
            {render ? render(item) : item}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function RangeField({
  icon: Icon,
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  icon?: LucideIcon;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-slate-300">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-400"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-cyan-300"
      />
    </div>
  );
}
