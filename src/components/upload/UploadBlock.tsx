import { Upload, X } from "lucide-react";
import type { RefObject } from "react";
import type { MediaPhoto } from "../../types/caply";
import { formatBytes } from "../../utils/format";

type UploadBlockProps = {
  photoInputRef: RefObject<HTMLInputElement | null>;
  handlePhotos: (files: FileList | null) => void;
  photos: MediaPhoto[];
  removePhoto: (id: string) => void;
};

export function UploadBlock({ photoInputRef, handlePhotos, photos, removePhoto }: UploadBlockProps) {
  return (
    <div>
      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handlePhotos(event.dataTransfer.files);
        }}
        className="group flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/[0.05] p-6 text-center transition hover:border-cyan-300/70 hover:bg-cyan-300/[0.08] active:scale-[0.99]"
      >
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/25">
          <Upload className="h-5 w-5" />
        </div>
        <p className="font-black">Add Photos</p>
        <p className="mt-1 text-xs text-slate-400">Drop images or tap to browse</p>
      </button>

      {photos.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
            <span>{formatBytes(photos.reduce((total, photo) => total + photo.size, 0))}</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {photos.slice(0, 10).map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-white/10">
                <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
