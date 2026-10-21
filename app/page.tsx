import { Playground } from "@/components/playground/playground";
import { playgroundFiles } from "@/lib/playground/files";
import { defaultPlaygroundFile } from "@/lib/playground/registry";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="flex flex-col gap-4">
        <span className="w-fit rounded-md bg-[var(--highlight)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--highlight)]">
          React Learning Lab
        </span>

        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-[var(--text-strong)] sm:text-4xl">
          ရေးထားတဲ့ code ကို ချက်ချင်း စမ်းကြည့်ပါ
        </h1>

        <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          Project root ရှိ <code className="font-mono text-[13px] text-[var(--highlight)]">.tsx</code>{" "}
          ဖိုင်တွေကို အောက်မှာ ရွေးပြီး code ကို ပြင်ရင် ရလဒ်က
          ချက်ချင်း ပြောင်းပါတယ်။ ဖိုင်တွေကို ဖိုင်တွေ မဟုတ်ဘူး —
          ပြင်ချင်တဲ့ code ကို ဒီမှာပဲ ရေးပါ။
        </p>
      </section>

      {/* Playground */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-sm font-bold text-[var(--text-strong)]">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[10px] font-black text-[var(--accent)]"
            >
              ▶
            </span>
            Live playground
          </h2>

          <p className="text-xs text-[var(--text-subtle)]">
            {playgroundFiles.length} ဖိုင် ရှိပါတယ်
          </p>
        </div>

        <Playground
          files={playgroundFiles}
          initialFile={defaultPlaygroundFile}
        />
      </section>
    </div>
  );
}
