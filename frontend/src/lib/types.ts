export type User = {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
};

export type Meeting = {
  id: number;
  meeting_id: string;
  host_id: number;
  host_name?: string | null;
  title: string;
  description: string;
  passcode?: string | null;
  scheduled_start?: string | null;
  duration_minutes: number;
  status: "scheduled" | "active" | "ended";
  is_instant: boolean;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  invite_url: string;
  join_url: string;
};

export type Participant = {
  id: number;
  meeting_id: string;
  display_name: string;
  is_host: boolean;
  is_muted: boolean;
  is_video_on: boolean;
  is_hand_raised: boolean;
  joined_at: string;
  removed: boolean;
};
