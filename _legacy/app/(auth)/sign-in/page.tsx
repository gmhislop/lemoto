import { redirect } from "next/navigation";
import { Login } from "../login";
import { getUser } from "@/app/queries/user";

export default async function SignInPage() {
  const user = await getUser();
  if (user) {
    return redirect("/app/dashboard");
  }

  return <Login mode="signin" />;
}
