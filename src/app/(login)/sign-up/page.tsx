import { getUser } from "@/app/queries/user";
import { Login } from "../login";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const user = await getUser();
  if (user) {
    return redirect("/app");
  }

  return <Login mode="signup" />;
}
