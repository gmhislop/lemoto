import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";
import SettingsForm from "@/app/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return <SettingsForm user={data.user} />;
}