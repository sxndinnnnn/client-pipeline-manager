export type DealStatus = "OPEN" | "WON" | "LOST";
export type StageKind = "PENDING" | "IN_PROGRESS" | "WON" | "LOST";
export type ActivityType = "call" | "email" | "meeting" | "note";
export type PlanPlatform = "GPS" | "TMS" | "DVR" | "HSC" | "FMS";

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  notes: string | null;
  tags: string[];
  logo_url: string | null;
  is_active: boolean;
  created_by_email: string | null;
  updated_by_email: string | null;
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
  kind: StageKind;
}

export interface Plan {
  id: string;
  name: string;
  platforms: PlanPlatform[];
  amount_usd: number | null;
  amount_lkr: number | null;
  vehicle_count: number | null;
  shipment_count: number | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Industry {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  position: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  client_id: string;
  stage_id: string | null;
  owner_id: string | null;
  plan_id: string | null;
  value: number | null;
  value_usd: number | null;
  plan_amount_lkr: number | null;
  plan_amount_usd: number | null;
  status: DealStatus;
  lost_reason: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealStageEvent {
  id: string;
  deal_id: string;
  stage_id: string;
  entered_at: string;
}

export interface SalesTarget {
  year: number;
  amount_lkr: number;
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

export interface Database {
  public: {
    Tables: {
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
      contacts: { Row: Contact; Insert: Partial<Contact>; Update: Partial<Contact> };
      pipeline_stages: {
        Row: PipelineStage;
        Insert: Partial<PipelineStage>;
        Update: Partial<PipelineStage>;
      };
      plans: { Row: Plan; Insert: Partial<Plan>; Update: Partial<Plan> };
      industries: { Row: Industry; Insert: Partial<Industry>; Update: Partial<Industry> };
      user_profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile>;
        Update: Partial<UserProfile>;
      };
      deals: { Row: Deal; Insert: Partial<Deal>; Update: Partial<Deal> };
      deal_stage_events: {
        Row: DealStageEvent;
        Insert: Partial<DealStageEvent>;
        Update: Partial<DealStageEvent>;
      };
      sales_targets: {
        Row: SalesTarget;
        Insert: Partial<SalesTarget>;
        Update: Partial<SalesTarget>;
      };
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> };
    };
  };
}
