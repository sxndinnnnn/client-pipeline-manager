import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addContact,
  createDeal,
  deleteContact,
  updateClientRecord,
  updateContact,
} from "../actions";
import { ContactRow } from "./contact-row";
import { ClientTabs } from "./client-tabs";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  LOST: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4 transition-transform group-open:rotate-180"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function DealsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path strokeLinecap="round" d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ValueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client, error: clientError }, { data: contacts }, { data: deals }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("contacts").select("*").eq("client_id", id).order("created_at"),
      supabase
        .from("deals")
        .select("*, pipeline_stages(name)")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (clientError || !client) notFound();

  const contactCount = contacts?.length ?? 0;
  const dealCount = deals?.length ?? 0;
  const openValue = (deals ?? [])
    .filter((d) => d.status === "OPEN")
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  async function saveClient(formData: FormData) {
    "use server";
    await updateClientRecord(id, formData);
  }

  async function addContactAction(formData: FormData) {
    "use server";
    await addContact(id, formData);
  }

  async function createDealAction(formData: FormData) {
    "use server";
    await createDeal(id, formData);
  }

  const detailsPanel = (
    <details open className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-t-lg bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-50">
        Basic Details
        <ChevronIcon />
      </summary>
      <form action={saveClient} className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Name *
            </label>
            <input
              name="name"
              defaultValue={client.name}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Industry
            </label>
            <input
              name="industry"
              defaultValue={client.industry ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Tags (comma-separated)
          </label>
          <input
            name="tags"
            defaultValue={client.tags?.join(", ") ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Notes
          </label>
          <textarea
            name="notes"
            defaultValue={client.notes ?? ""}
            rows={3}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Save Changes
        </button>
      </form>
    </details>
  );

  const contactsPanel = (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Contacts</h2>
        <details className="relative">
          <summary className="cursor-pointer list-none text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            + Add contact
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <form action={addContactAction} className="flex flex-col gap-3">
              <input
                name="name"
                placeholder="Name *"
                required
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                name="role"
                placeholder="Role"
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                name="email"
                placeholder="Email"
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                name="phone"
                placeholder="Phone"
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Add contact
              </button>
            </form>
          </div>
        </details>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {contactCount === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No contacts yet.</p>
        )}
        {contacts?.map((contact) => {
          async function update(formData: FormData) {
            "use server";
            await updateContact(id, contact.id, formData);
          }
          async function remove() {
            "use server";
            await deleteContact(id, contact.id, contact.name);
          }
          return (
            <ContactRow key={contact.id} contact={contact} onUpdate={update} onDelete={remove} />
          );
        })}
      </div>
    </section>
  );

  const dealsPanel = (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Deals</h2>
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
            + Add deal
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <form action={createDealAction} className="flex flex-col gap-3">
              <input
                name="title"
                placeholder="Deal title *"
                required
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                name="value"
                type="number"
                step="0.01"
                placeholder="Value ($)"
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                name="source"
                placeholder="Source"
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Expected close date
                </label>
                <input
                  name="expected_close_date"
                  type="date"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Create deal
              </button>
            </form>
          </div>
        </details>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {dealCount === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No deals yet for this client.</p>
        )}
        {deals?.map((deal) => (
          <Link
            key={deal.id}
            href={`/deals/${deal.id}`}
            className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-3 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{deal.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {(deal as unknown as { pipeline_stages: { name: string } | null })
                  .pipeline_stages?.name ?? "No stage"}
                {deal.value != null && ` · $${Number(deal.value).toLocaleString()}`}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[deal.status]}`}
            >
              {deal.status}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/clients"
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← All Clients
      </Link>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xl font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {initials(client.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {client.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <span>Client</span>
                {client.industry && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{client.industry}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <span className="text-zinc-400 dark:text-zinc-500">
              <ContactsIcon />
            </span>
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{contactCount}</p>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Contacts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <span className="text-zinc-400 dark:text-zinc-500">
              <DealsIcon />
            </span>
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{dealCount}</p>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Deals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <span className="text-zinc-400 dark:text-zinc-500">
              <ValueIcon />
            </span>
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ${openValue.toLocaleString()}
              </p>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Open Pipeline Value
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
          <span>Created: {formatDate(client.created_at)}</span>
          {client.created_by_email && <span>Created By: {client.created_by_email}</span>}
          <span>Updated: {formatDate(client.updated_at)}</span>
          {client.updated_by_email && <span>Updated By: {client.updated_by_email}</span>}
        </div>
      </div>

      <ClientTabs
        tabs={[
          { key: "details", label: "Details", content: detailsPanel },
          { key: "contacts", label: "Contacts", count: contactCount, content: contactsPanel },
          { key: "deals", label: "Deals", count: dealCount, content: dealsPanel },
        ]}
      />
    </div>
  );
}
