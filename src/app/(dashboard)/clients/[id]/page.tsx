import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatLKR } from "@/lib/currency";
import { formatDateTime as formatDate } from "@/lib/datetime";
import {
  addContact,
  createDeal,
  deleteClient,
  deleteContact,
  updateClientRecord,
  updateContact,
} from "../actions";
import {
  addActivity,
  addTask,
  deleteActivity,
  deleteDeal,
  deleteTask,
  setTaskStatus,
  updateDeal,
} from "../../deals/[id]/actions";
import { ContactRow } from "./contact-row";
import { ClientTabs } from "./client-tabs";
import { ClientLogo } from "./client-logo";
import { AddContactModal } from "./add-contact-modal";
import { AddDealModal } from "./add-deal-modal";
import { DealRow } from "./deal-row";
import { DeleteClientButton } from "./delete-client-button";
import type { Activity, Deal, Task } from "@/types/database";
import { BriefcaseIcon, ChevronDownIcon, ContactIcon, ValueIcon } from "@/components/icons";

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
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

  async function deleteClientAction() {
    "use server";
    await deleteClient(id, client.name);
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
    <details open className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-t-lg bg-surface-sunken px-4 py-2.5 text-sm font-semibold text-foreground">
        Basic Details
        <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <form action={saveClient} className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted">
              Name *
            </label>
            <input
              name="name"
              defaultValue={client.name}
              required
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted">
              Industry
            </label>
            <input
              name="industry"
              defaultValue={client.industry ?? ""}
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">
            Notes
          </label>
          <textarea
            name="notes"
            defaultValue={client.notes ?? ""}
            rows={3}
            className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Save Changes
        </button>
      </form>
    </details>
  );

  const contactsPanel = (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
        <AddContactModal addContactAction={addContactAction} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Full Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Phone
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {contactCount === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-subtle"
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Deals</h2>
        <AddDealModal createDealAction={createDealAction} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Stage
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Value
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Status
              </th>
              <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-subtle">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {dealCount === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-subtle"
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
              async function deleteActivityAction(
                dealId: string,
                activityId: string,
                type: Activity["type"]
              ) {
                "use server";
                await deleteActivity(dealId, activityId, type);
                revalidatePath(`/clients/${id}`);
              }
              async function addTaskAction(formData: FormData) {
                "use server";
                await addTask(deal.id, formData);
                revalidatePath(`/clients/${id}`);
              }
              async function deleteTaskAction(
                dealId: string,
                taskId: string,
                taskTitle: string
              ) {
                "use server";
                await deleteTask(dealId, taskId, taskTitle);
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
                  onDeleteActivity={deleteActivityAction}
                  onAddTask={addTaskAction}
                  onDeleteTask={deleteTaskAction}
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
        className="text-sm text-subtle hover:text-foreground"
      >
        ← All Clients
      </Link>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-resting">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ClientLogo clientId={id} logoUrl={client.logo_url} initials={initials(client.name)} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {client.name}
              </h1>
            </div>
          </div>
          <DeleteClientButton clientName={client.name} onDelete={deleteClientAction} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <span className="text-subtle">
              <ContactIcon />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">{contactCount}</p>
              <p className="text-xs uppercase tracking-wide text-subtle">
                Contacts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <span className="text-subtle">
              <BriefcaseIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">{dealCount}</p>
              <p className="text-xs uppercase tracking-wide text-subtle">
                Deals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <span className="text-subtle">
              <ValueIcon />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">
                {formatLKR(openValue)}
              </p>
              <p className="text-xs uppercase tracking-wide text-subtle">
                Open Pipeline Value
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
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
