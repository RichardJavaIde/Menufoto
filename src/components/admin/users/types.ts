//src/components/admin/users/types.ts
export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  active: boolean;
};