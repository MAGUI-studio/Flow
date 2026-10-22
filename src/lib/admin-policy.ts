export const SUPERADMIN_EMAIL = "guibus.dev@gmail.com";

export type AdminIdentity = {
  id: string;
  primaryEmailAddressId: string | null;
  emailAddresses: {
    id: string;
    emailAddress: string;
    verification: { status: string } | null;
  }[];
  banned?: boolean;
  locked?: boolean;
};

export function isSuperAdmin(user: AdminIdentity | null | undefined) {
  if (!user || user.banned || user.locked) return false;
  const primary = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  return (
    primary?.verification?.status === "verified" &&
    primary.emailAddress.trim().toLowerCase() === SUPERADMIN_EMAIL
  );
}

export async function authorizeAdmin(
  userId: string | null,
  getUser: (id: string) => Promise<AdminIdentity>,
) {
  if (!userId) throw new Error("ADMIN_FORBIDDEN");
  const user = await getUser(userId);
  if (user.id !== userId || !isSuperAdmin(user))
    throw new Error("ADMIN_FORBIDDEN");
  return user;
}
