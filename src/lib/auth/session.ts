import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}
