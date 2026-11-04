// Small thumbnail; hovering shows the whole, uncropped photo next to it
export default function Zoom({ src, size = "h-10 w-10" }: { src: string; size?: string }) {
  return (
    <span className="group relative inline-block shrink-0" tabIndex={0}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={`${size} rounded object-cover`} loading="lazy" />
      <span className="pointer-events-none absolute left-full top-0 z-50 ml-2 hidden w-72 rounded-md border border-ink/20 bg-white p-1 shadow-lg group-hover:block group-focus:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="max-h-80 w-full object-contain" />
      </span>
    </span>
  );
}
