import { redirect } from "next/navigation";
import { getSession, SessionUser } from "./auth";

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return user;
}

