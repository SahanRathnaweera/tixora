import bgImage from '../assets/backgroundOp.jpg';

/** Full-site background photo with a low opacity, fixed behind all pages. */
export default function SiteBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Photo (change the opacity values to make it stronger / softer) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.10] dark:opacity-[0.16]"
        style={{ backgroundImage: `url("${bgImage}")` }}
      />
      {/* Soft overlay so text stays easy to read */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-100/50 via-transparent to-cream-100/70 dark:from-ink-950/60 dark:via-ink-950/20 dark:to-ink-950/80" />
    </div>
  );
}