/**
 * Hero-only depth. Static, quiet, one wash.
 * Pros use this sparingly. Never stack animated orbs.
 */
export function MarketingHeroAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #f5f7fb 0%, #e9eef6 48%, #dfe8f2 100%)",
        }}
      />
      <div
        className="absolute -right-[20%] top-[10%] h-[70%] w-[60%] rounded-full opacity-90 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(26, 125, 111, 0.14) 0%, transparent 68%)",
        }}
      />
      <div
        className="absolute -left-[15%] bottom-[-10%] h-[55%] w-[50%] rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(70, 120, 160, 0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
