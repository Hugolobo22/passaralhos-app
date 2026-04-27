export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  xp: number;
  level: number;
  is_verified: boolean;
  created_at: string;
}
