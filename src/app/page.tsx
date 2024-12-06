import { useRouter } from "next/router";

const HomePage = () => {
  const user = null;
  const router = useRouter();

  if (!user) {
    router.push("/auth/login");
    return <div>Redirecting...</div>;
  }

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
    </div>
  );
};

export default HomePage;
