import { Sparkle, Languages, Keyboard } from "./icons";

export default function EmptyState() {
  const features = [
    {
      icon: Sparkle,
      title: "Live as you type",
      body: "See the meaning of your sentence and a gentle grammar check before you hit send.",
    },
    {
      icon: Languages,
      title: "Read every reply",
      body: "Incoming messages translate on tap — or automatically, if you like.",
    },
    {
      icon: Keyboard,
      title: "Type any script",
      body: "A built-in kana keyboard and romaji input, so a Latin keyboard is never a wall.",
    },
  ];

  return (
    <div className="chat-canvas grid h-full place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
          <Sparkle size={30} />
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink balance leading-tight">
          Talk to anyone,<br />in any language.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted pretty">
          Pick a conversation to start. Lingua translates both sides and helps
          you write with confidence — right now,{" "}
          <span className="font-bn font-semibold text-brand">Bengali</span> ↔{" "}
          <span className="font-jp font-semibold text-brand">Japanese</span>.
        </p>

        <div className="mt-8 grid gap-2.5 text-left">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3.5 rounded-2xl bg-surface/70 px-4 py-3.5 ring-1 ring-line backdrop-blur-sm transition-all duration-200 hover:shadow-xs hover:ring-line-strong"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                <f.icon size={17} className="text-brand" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-ink">{f.title}</div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-muted pretty">{f.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
