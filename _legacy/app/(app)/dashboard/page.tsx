import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";
import Dashboard from "@/app/components/Dashboard";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return <Dashboard user={data.user} />;
}
