import { redirect } from "next/navigation";
import { authorized } from "@/lib/auth";
import { Workspace } from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await authorized())) redirect("/login");
  return <Workspace />;
}
