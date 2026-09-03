import Link from "next/link";

const SECTIONS = [
  {
    title: "Clients & Contacts",
    href: "/clients",
    body: [
      "A Client is a company or account you're selling to. Each client can have any number of Contacts — the people there you actually talk to.",
      "From the Clients page, use \"+ Add Client\" to create one. Opening a client shows a header card (logo or initials, contact/deal counts, open pipeline value) and three tabs — Details (an always-editable Basic Details panel), Contacts, and Deals.",
      "Click Upload under the avatar to set a client's logo, or Change / Remove once one's set.",
      "The Contacts tab lists contacts in a table — click the pencil icon to edit one, or + Add Contact to open the add form as a modal.",
      "The Deals tab works the same way — a table of the client's deals, and + Add Deal opens the create form as a modal. Click the View icon on a row to open the deal's full detail (value, source, dates, Activity and Tasks as tabs) in a large modal, with Edit deal and Delete deal buttons right there — no need to leave the client page.",
      "Deal values are shown in LKR throughout the app.",
    ],
  },
  {
    title: "The Pipeline board",
    href: "/pipeline",
    body: [
      "Every deal moves through a set of stages — Lead, Contacted, Qualified, Proposal, Negotiation, Trial, Legal, Won, Lost — shown as columns on the Pipeline board.",
      "Drag a deal's card into another column to move it. Dropping a deal into Won or Lost automatically closes it and timestamps when that happened — you don't need to update that by hand.",
      "New deals are created from a client's page and start in the first stage (Lead).",
    ],
  },
  {
    title: "Deal details, activity, and tasks",
    href: undefined,
    body: [
      "Open any deal (from its card on the Pipeline board, or from the client page) to edit its value, source, and expected close date.",
      "Log calls, emails, meetings, or notes in the Activity feed — it's a running history of everything that's happened on that deal, newest first.",
      "Add follow-up Tasks scoped to that deal, with an optional due date. Check them off as they're done.",
    ],
  },
  {
    title: "Tasks",
    href: "/tasks",
    body: [
      "The Tasks page pulls together every open task across all deals in one list, sorted by due date so nothing slips — overdue items are flagged in red.",
    ],
  },
  {
    title: "System Log",
    href: "/system-log",
    body: [
      "Every meaningful action anyone takes — signing in or out, creating or editing a client/contact/deal, moving a deal's stage, logging an activity, adding or completing a task — is recorded here with who did it, when, their IP address, and where that request came from.",
      "It's append-only: nobody can edit or delete an entry once it's written, so it stays a reliable record.",
    ],
  },
  {
    title: "Release Note",
    href: "/changelog",
    body: [
      "A running list of what's changed in the tool itself — new features, fixes, improvements — grouped by date, so the team can see what's new without having to ask.",
    ],
  },
  {
    title: "Dark mode",
    href: undefined,
    body: [
      "Use the sun/moon button in the top-right corner of the header to switch between light and dark mode. It defaults to your system's setting the first time you visit, and remembers whatever you pick after that on this device.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Guide
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          A quick tour of each part of the tool and how they fit together. This is an
          internal pipeline tracker for the team — everyone who&apos;s signed in has full
          access to everything below.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {section.title}
              </h2>
              {section.href && (
                <Link
                  href={section.href}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Go there →
                </Link>
              )}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          A typical flow, start to finish
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Add the client, and a contact there you&apos;re talking to.</li>
          <li>Create a deal for that client — it starts in the Lead stage.</li>
          <li>Drag it across the Pipeline board as it progresses.</li>
          <li>Log calls/emails/meetings and set follow-up tasks on the deal as you go.</li>
          <li>Drop it in Won or Lost when it closes — that&apos;s the end of the trail.</li>
        </ol>
      </section>
    </div>
  );
}
