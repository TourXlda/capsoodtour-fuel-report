export interface RegisteredDriver {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  joinedAt: string;
}

export type DriverDeleteResult =
  | { success: true }
  | { success: false; message: string };

export type BulkDriverDeleteResult =
  | { success: true; deletedCount: number }
  | { success: false; message: string; deletedCount: number };

export type RegisteredClientRow = {
  id: string;
  email: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
};
