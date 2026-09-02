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

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-zinc-200 text-zinc-600",
};

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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/clients" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← All clients
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{client.name}</h1>
            {client.industry && <p className="mt-1 text-sm text-zinc-500">{client.industry}</p>}
          </div>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
              Edit client
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
              <form action={saveClient} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Name *</label>
                  <input
                    name="name"
                    defaultValue={client.name}
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Industry</label>
                  <input
                    name="industry"
                    defaultValue={client.industry ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Tags (comma-separated)
                  </label>
                  <input
                    name="tags"
                    defaultValue={client.tags?.join(", ") ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={client.notes ?? ""}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Save changes
                </button>
              </form>
            </div>
          </details>
        </div>
        {client.tags && client.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {client.tags.map((tag: string) => (
              <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        )}
        {client.notes && <p className="mt-4 max-w-2xl text-sm text-zinc-600">{client.notes}</p>}
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Contacts</h2>
          <details className="relative">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-600 hover:text-zinc-900">
              + Add contact
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
              <form action={addContactAction} className="flex flex-col gap-3">
                <input
                  name="name"
                  placeholder="Name *"
                  required
                  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  name="role"
                  placeholder="Role"
                  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  name="email"
                  placeholder="Email"
                  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Add contact
                </button>
              </form>
            </div>
          </details>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {(!contacts || contacts.length === 0) && (
            <p className="text-sm text-zinc-500">No contacts yet.</p>
          )}
          {contacts?.map((contact) => {
            async function update(formData: FormData) {
              "use server";
              await updateContact(id, contact.id, formData);
            }
            async function remove() {
              "use server";
              await deleteContact(id, contact.id);
            }
            return (
              <ContactRow key={contact.id} contact={contact} onUpdate={update} onDelete={remove} />
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Deals</h2>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800">
              + Add deal
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
              <form action={createDealAction} className="flex flex-col gap-3">
                <input
                  name="title"
                  placeholder="Deal title *"
                  required
                  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  name="value"
                  type="number"
                  step="0.01"
                  placeholder="Value ($)"
                  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  name="source"
                  placeholder="Source"
                  className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Expected close date
                  </label>
                  <input
                    name="expected_close_date"
                    type="date"
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Create deal
                </button>
              </form>
            </div>
          </details>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {(!deals || deals.length === 0) && (
            <p className="text-sm text-zinc-500">No deals yet for this client.</p>
          )}
          {deals?.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-3 hover:border-zinc-300"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{deal.title}</p>
                <p className="text-xs text-zinc-500">
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
    </div>
  );
}
