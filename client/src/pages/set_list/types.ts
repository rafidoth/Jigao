export type SetVisibility = "private" | "restricted" | "public";

export type SetVisibilityFilter = "all" | SetVisibility;

export interface SetOwner {
  name?: string;
  image_url?: string | null;
}

export interface SetCore {
  id: string | number;
  title: string;
  visibility: SetVisibility;
  updated_at: string;
  name?: string;
}

export interface SetListApiItem {
  set?: SetCore;
  owner?: SetOwner;
  id?: string | number;
  title?: string;
  visibility?: SetVisibility;
  updated_at?: string;
}

export interface SetListApiResponse {
  sets: SetListApiItem[];
  next_last_seen_id: string | null;
}

export interface NormalizedSetItem {
  set: SetCore;
  owner: SetOwner;
}
