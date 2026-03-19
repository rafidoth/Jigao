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
  duration_in_minutes?: number;
  visibility: string;
  created_by: ExamUser;
}
