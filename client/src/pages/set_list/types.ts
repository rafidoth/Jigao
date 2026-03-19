export interface SetOwner {
  name?: string;
  image_url?: string | null;
}

export interface SetCore {
  id: string | number;
  title: string;
  visibility: string;
  updated_at: string;
  name?: string;
}

export interface SetListApiItem {
  set?: SetCore;
  owner?: SetOwner;
  id?: string | number;
  title?: string;
  visibility?: string;
  updated_at?: string;
}

export interface NormalizedSetItem {
  set: SetCore;
  owner: SetOwner;
}
