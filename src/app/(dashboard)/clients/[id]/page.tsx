import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatLKR } from "@/lib/currency";
import {
  addContact,
  createDeal,
  deleteContact,
  updateClientRecord,
  updateContact,
} from "../actions";
import {
  addActivity,
  addTask,
  deleteDeal,
  setTaskStatus,
  updateDeal,
} from "../../deals/[id]/actions";
import { ContactRow } from "./contact-row";
import { ClientTabs } from "./client-tabs";
import { ClientLogo } from "./client-logo";
import { AddContactModal } from "./add-contact-modal";
import { AddDealModal } from "./add-deal-modal";
import { DealRow } from "./deal-row";
import type { Activity, Deal, Task } from "@/types/database";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
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

  const dealIds = (deals ?? []).map((d) => d.id);
  const [{ data: allActivities }, { data: allTasks }] =
    dealIds.length > 0
      ? await Promise.all([
          supabase
            .from("activities")
            .select("*")
            .in("deal_id", dealIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("tasks")
            .select("*")
            .in("deal_id", dealIds)
            .order("due_date", { ascending: true, nullsFirst: false }),
        ])
      : [{ data: [] as Activity[] }, { data: [] as Task[] }];

  function groupByDealId<T extends { deal_id: string }>(items: T[]): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};
    for (const item of items) {
      (grouped[item.deal_id] ??= []).push(item);
    }
    return grouped;
  }
  const activitiesByDeal = groupByDealId(allActivities ?? []);
  const tasksByDeal = groupByDealId(allTasks ?? []);

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
        <AddContactModal addContactAction={addContactAction} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Full Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Phone
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {contactCount === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  No contacts yet.
                </td>
              </tr>
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
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onUpdate={update}
                  onDelete={remove}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  const dealsPanel = (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Deals</h2>
        <AddDealModal createDealAction={createDealAction} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Stage
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Value
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {dealCount === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  No deals yet for this client.
                </td>
              </tr>
            )}
            {deals?.map((deal) => {
              async function updateAction(formData: FormData) {
                "use server";
                await updateDeal(deal.id, formData);
                revalidatePath(`/clients/${id}`);
              }
              async function deleteAction() {
                "use server";
                await deleteDeal(deal.id, deal.title);
                revalidatePath(`/clients/${id}`);
              }
              async function addActivityAction(formData: FormData) {
                "use server";
                await addActivity(deal.id, formData);
                revalidatePath(`/clients/${id}`);
              }
              async function addTaskAction(formData: FormData) {
                "use server";
                await addTask(deal.id, formData);
                revalidatePath(`/clients/${id}`);
              }
              async function setTaskStatusAction(
                dealId: string,
                taskId: string,
                done: boolean
              ) {
                "use server";
                await setTaskStatus(dealId, taskId, done);
                revalidatePath(`/clients/${id}`);
              }
              return (
                <DealRow
                  key={deal.id}
                  deal={
                    deal as unknown as Deal & { pipeline_stages: { name: string } | null }
                  }
                  activities={activitiesByDeal[deal.id] ?? []}
                  tasks={tasksByDeal[deal.id] ?? []}
                  onUpdate={updateAction}
                  onDelete={deleteAction}
                  onAddActivity={addActivityAction}
                  onAddTask={addTaskAction}
                  onSetTaskStatus={setTaskStatusAction}
                />
              );
            })}
          </tbody>
        </table>
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
            <ClientLogo clientId={id} logoUrl={client.logo_url} initials={initials(client.name)} />
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {client.name}
              </h1>
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
                {formatLKR(openValue)}
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
        defaultTab={tab}
        tabs={[
          { key: "details", label: "Details", content: detailsPanel },
          { key: "contacts", label: "Contacts", count: contactCount, content: contactsPanel },
          { key: "deals", label: "Deals", count: dealCount, content: dealsPanel },
        ]}
      />
    </div>
  );
}
