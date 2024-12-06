// src/app/page.tsx
import { useRouter } from "next/router";
import useUser from "@/app/hooks/useUser";

const HomePage = () => {
  const user = useUser(); // Get the authenticated user
  const router = useRouter();

  // Redirect to login if not logged in
  if (!user) {
    router.push("/auth/login"); // Redirect to login page if no user is logged in
    return <div>Redirecting...</div>; // Show loading text while redirecting
  }

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>Logged in as: {user.email}</p> {/* Display the user's email */}
    </div>
  );
};

export default HomePage;
