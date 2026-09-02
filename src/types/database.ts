export type DealStatus = "OPEN" | "WON" | "LOST";
export type ActivityType = "call" | "email" | "meeting" | "note";
export type TaskStatus = "PENDING" | "DONE";
export type ChangelogCategory = "feature" | "fix" | "improvement";

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  client_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  sort_order: number;
}

export interface Deal {
  id: string;
  title: string;
  client_id: string;
  stage_id: string | null;
  owner_id: string | null;
  value: number | null;
  status: DealStatus;
  source: string | null;
  expected_close_date: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  deal_id: string;
  author_id: string | null;
  type: ActivityType;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  deal_id: string;
  assignee_id: string | null;
  title: string;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string | null;
  category: ChangelogCategory;
  released_on: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
      contacts: { Row: Contact; Insert: Partial<Contact>; Update: Partial<Contact> };
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
      changelog_entries: {
        Row: ChangelogEntry;
        Insert: Partial<ChangelogEntry>;
        Update: Partial<ChangelogEntry>;
      };
      pipeline_stages: {
        Row: PipelineStage;
        Insert: Partial<PipelineStage>;
        Update: Partial<PipelineStage>;
      };
      deals: { Row: Deal; Insert: Partial<Deal>; Update: Partial<Deal> };
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
    };
  };
}
