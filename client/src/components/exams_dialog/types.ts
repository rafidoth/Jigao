export interface ExamUser {
  name?: string;
  image_url?: string;
}

export interface ExamItem {
  id?: string;
  set_id?: string;
  title: string;
  description?: string;
  start_time?: string;
  duration?: number;
  visibility: string;
  session_status?: string;
  end_time?: string;
  start_mode?: string;
  owner_name?: string;
  owner_profile_image_url?: string;
  created_by?: ExamUser;
}

export interface SelfTestSubmission {
  self_test_id: string;
  set_id: string;
  created_at: string;
}
