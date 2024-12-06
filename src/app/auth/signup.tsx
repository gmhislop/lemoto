import { useState } from "react";
import supabase from "@/app/lib/supabaseClient";
import { useRouter } from "next/router";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setUserEmail(data.user?.email || "");
      router.push("/auth/login");
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {userEmail && <p>Confirmation email sent to: {userEmail}</p>}
      <form onSubmit={handleSignUp}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUp;
