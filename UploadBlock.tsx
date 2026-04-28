import React from "react";
import { Upload } from "lucide-react";

interface UploadBlockProps {
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotos: (files: FileList | null) => void;
}

const UploadBlock: React.FC<UploadBlockProps> = ({
  photoInputRef,
  handlePhotos,
}) => {
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
        <p className="mt-1 text-xs text-slate-400">
          Drop images or tap to browse
        </p>
      </button>
    </div>
  );
};

export default UploadBlock;