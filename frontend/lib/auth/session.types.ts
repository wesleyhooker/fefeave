export type AppRole = 'ADMIN' | 'OPERATOR' | 'WHOLESALER';

export interface AppSession {
  access_token: string;
  id_token?: string;
  expires_at: number; // epoch seconds
  roles?: AppRole[];
  user?: {
    id: string;
    email: string;
  };
}
