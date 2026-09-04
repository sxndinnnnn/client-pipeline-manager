import Link from "next/link";
import type { ReactNode } from "react";

const SECTIONS = [
  {
    title: "Dashboard",
    emoji: "📊",
    href: "/dashboard",
    body: [
      "An at-a-glance overview of the whole pipeline: open and won pipeline value, open deal count, win/loss rate, average sales cycle, and deal size, a bar chart of open value by stage, and client stats including your top clients by open pipeline value.",
    ],
  },
  {
    title: "Clients & Contacts",
    emoji: "👥",
    href: "/clients",
    body: [
      "A Client is a company or account you're selling to. Each client can have any number of Contacts - the people there you actually talk to.",
      "From the Clients page, use \"+ Add Client\" to create one. Opening a client shows a header card (logo or initials, contact/deal counts, open pipeline value) and three tabs - Details (an always-editable Basic Details panel), Contacts, and Deals.",
      "Click Upload under the avatar to set a client's logo, or Change / Remove once one's set.",
      "The Contacts tab lists contacts in a table - click the pencil icon to edit one, or + Add Contact to open the add form as a modal.",
      "The Deals tab works the same way - a table of the client's deals, and + Add Deal opens the create form as a modal. Click the View icon on a row to open the deal's full detail (value, source, dates, Activity and Tasks as tabs) in a large modal, with Edit Deal and Delete Deal buttons right there - no need to leave the client page.",
      "Deal values are shown in LKR throughout the app.",
      "Delete Client, in the client's header, permanently deletes the client and everything under it (contacts, deals, activity, tasks) - you'll be asked to confirm first since it can't be undone.",
    ],
  },
  {
    title: "The Pipeline Board",
    emoji: "🗂️",
    href: "/pipeline",
    body: [
      "Every deal moves through a set of stages - Lead, Contacted, Qualified, Proposal, Negotiation, Trial, Legal, Won, Lost - shown as columns on the Pipeline board.",
      "Drag a deal's card into another column to move it. Dropping a deal into Won or Lost automatically closes it and timestamps when that happened - you don't need to update that by hand.",
      "New deals are created from a client's page and start in the first stage (Lead). After creating one you land back on that client's Deals tab, where View opens it to log activity or add tasks.",
    ],
  },
  {
    title: "Deal Details, Activity, And Tasks",
    emoji: "📋",
    href: undefined,
    body: [
      "Open any deal (from its card on the Pipeline board, or from the client page) to edit its value, source, and expected close date.",
      "Log calls, emails, meetings, or notes in the Activity feed - it's a running history of everything that's happened on that deal, newest first. Click the trash icon on an entry to delete it.",
      "Add follow-up Tasks scoped to that deal, with an optional due date. Check them off as they're done, or click the trash icon to delete one.",
    ],
  },
  {
    title: "Tasks",
    emoji: "✅",
    href: "/tasks",
    body: [
      "The Tasks page pulls together every task across all deals as cards - client on top, deal on the side, task at the bottom - split into Open Tasks and Closed Tasks tabs, sorted by due date so nothing slips. Overdue open tasks are flagged in red.",
    ],
  },
  {
    title: "System Log",
    emoji: "📜",
    href: "/system-log",
    body: [
      "Every meaningful action anyone takes - signing in or out, creating or editing a client/contact/deal, moving a deal's stage, logging an activity, adding or completing a task - is recorded here with who did it, when, their IP address, and where that request came from.",
      "It's append-only: nobody can edit or delete an entry by hand, so it stays a reliable record. Shown 25 entries per page by default (adjustable), and a daily automated job keeps only the most recent 1000 entries overall.",
    ],
  },
  {
    title: "Release Note",
    emoji: "📣",
    href: "/release-note",
    body: [
      "A running timeline of what's changed in the tool itself, grouped by date with an emoji and color-coded tag per entry (✨ feature, 🛠️ improvement, 🐛 fix), so the team can see what's new without having to ask.",
    ],
  },
  {
    title: "Dark Mode",
    emoji: "🌙",
    href: undefined,
    body: [
      "Use the sun/moon button in the top-right corner of the header to switch between light and dark mode. It defaults to your system's setting the first time you visit, and remembers whatever you pick after that on this device.",
    ],
  },
];

const FLOW_STEPS = [
  "Add the client, and a contact there you're talking to.",
  "Create a deal for that client - it starts in the Lead stage.",
  "Drag it across the Pipeline board as it progresses.",
  "Log calls/emails/meetings and set follow-up tasks on the deal as you go.",
  "Drop it in Won or Lost when it closes - that's the end of the trail.",
];

function FlowArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4 shrink-0 rotate-90 text-zinc-400 sm:rotate-0 dark:text-zinc-600"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function flowNodes() {
  const nodes: ReactNode[] = [];
  FLOW_STEPS.forEach((step, i) => {
    nodes.push(
      <div
        key={`step-${i}`}
        className="flex flex-1 items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left dark:border-zinc-800 dark:bg-zinc-950 sm:min-w-[9rem] sm:flex-col sm:items-center sm:text-center"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {i + 1}
        </span>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{step}</p>
      </div>
    );
    if (i < FLOW_STEPS.length - 1) {
      nodes.push(
        <div key={`arrow-${i}`} className="flex justify-center">
          <FlowArrow />
        </div>
      );
    }
  });
  return nodes;
}

export default function GuidePage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        <span aria-hidden className="mr-2">
          🧭
        </span>
        Guide
      </h1>

      <div className="flex flex-col gap-6">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                <span aria-hidden className="mr-1.5">
                  {section.emoji}
                </span>
                {section.title}
              </h2>
              {section.href && (
                <Link
                  href={section.href}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Go There →
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
          <span aria-hidden className="mr-1.5">
            🚀
          </span>
          A Typical Flow, Start To Finish
        </h2>
        <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:gap-2">
          {flowNodes()}
        </div>
      </section>
    </div>
  );
}
