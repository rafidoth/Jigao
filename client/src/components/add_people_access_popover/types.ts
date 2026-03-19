export interface User {
  id: string | number;
  name: string;
  email: string;
  image_url?: string | null;
}

export interface SetLike {
  id: string | number;
}
