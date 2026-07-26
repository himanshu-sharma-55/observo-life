function FrameChrome({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="marketing-frame min-w-0 overflow-hidden rounded-xl border border-[#d5dde8] bg-white shadow-[0_12px_32px_rgba(10,18,32,0.08)] sm:rounded-2xl sm:shadow-[0_20px_50px_rgba(10,18,32,0.1)]">
      <div className="flex min-w-0 items-center gap-1.5 border-b border-[#e8edf3] bg-[#fafbfc] px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3">
        <span className="size-2 shrink-0 rounded-full bg-[#ff5f57] sm:size-2.5" />
        <span className="size-2 shrink-0 rounded-full bg-[#febc2e] sm:size-2.5" />
        <span className="size-2 shrink-0 rounded-full bg-[#28c840] sm:size-2.5" />
        <span className="ml-2 truncate text-[0.7rem] text-[#4f6175] sm:ml-3 sm:text-xs">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export function ComposerFrame() {
  return (
    <FrameChrome label="Feed · composer">
      <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
        <div className="rounded-xl border border-[#d5dde8] bg-[#eef1f6] p-3.5 sm:p-4">
          <p className="text-sm leading-relaxed text-[#0a1220] sm:text-[0.95rem]">
            Left the office early. Walked home instead of taking the metro. Felt clearer by
            the time I reached the bridge.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#d5dde8] pt-3 sm:mt-4">
            <span className="text-xs text-[#4f6175]">Enter to log</span>
            <span className="rounded-full bg-[#1a7d6f] px-3.5 py-1.5 text-xs font-medium text-white">
              Log
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["walk", "evening", "work"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#d5dde8] bg-white px-3 py-1 text-[0.7rem] text-[#4f6175]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </FrameChrome>
  );
}

export function TimelineFrame() {
  return (
    <FrameChrome label="Events · timeline">
      <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        <p className="text-xs font-medium tracking-wide text-[#4f6175] uppercase">
          Sunday · Jul 26
        </p>
        {[
          { time: "7:40 pm", text: "Walked home. Bridge felt quieter than usual." },
          { time: "1:15 pm", text: "Skipped lunch meeting. Needed the hour alone." },
          { time: "Day", text: "A slower Sunday. More walking, fewer tabs open." },
        ].map((item) => (
          <div key={item.time} className="grid grid-cols-[3.75rem_1fr] gap-2.5 sm:grid-cols-[4.5rem_1fr] sm:gap-3">
            <span className="pt-0.5 text-[0.7rem] font-medium text-[#1a7d6f] sm:text-xs">
              {item.time}
            </span>
            <p className="min-w-0 text-sm leading-relaxed text-[#0a1220]">{item.text}</p>
          </div>
        ))}
      </div>
    </FrameChrome>
  );
}

export function InsightFrame() {
  return (
    <FrameChrome label="AI insight · this week">
      <div className="space-y-3 p-4 sm:p-6">
        <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[#1a7d6f] uppercase">
          Pattern
        </p>
        <h3 className="text-base font-semibold tracking-tight text-[#0a1220] sm:text-lg">
          Evenings open up when you leave on foot
        </h3>
        <p className="text-sm leading-relaxed text-[#4f6175]">
          Three of the four walks this week landed after leaving work early. Those evenings
          also show fewer late-night tabs, and clearer next-day notes.
        </p>
        <p className="text-sm font-medium text-[#1a7d6f]">Show 4 source events →</p>
      </div>
    </FrameChrome>
  );
}

export function RecapFrame() {
  return (
    <FrameChrome label="Month recap · June">
      <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
        <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[#1a7d6f] uppercase">
          Month story
        </p>
        <h3 className="text-base font-semibold tracking-tight text-[#0a1220] sm:text-lg">
          June was quieter than it felt
        </h3>
        <p className="text-sm leading-relaxed text-[#4f6175]">
          42 events across 19 days. Walks clustered after early exits. Spending dipped on
          weeks with more day summaries.
        </p>
        <div className="grid grid-cols-3 gap-1.5 pt-1 sm:gap-2">
          {[
            { label: "Events", value: "42" },
            { label: "Days", value: "19" },
            { label: "Walks", value: "11" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-[#d5dde8] bg-[#eef1f6] px-2 py-2 text-center sm:rounded-xl sm:px-3 sm:py-2.5"
            >
              <p className="text-sm font-semibold text-[#0a1220] sm:text-base">{stat.value}</p>
              <p className="text-[0.6rem] text-[#4f6175] sm:text-[0.65rem]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </FrameChrome>
  );
}
