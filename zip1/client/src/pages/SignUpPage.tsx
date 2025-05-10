// src/pages/SignUpPage.tsx
import { useState } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signing up with:", email, password);
    // TODO: Add real sign-up logic here
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col justify-center items-center px-4">
      <h2 className="text-4xl font-bold mb-6">Create an Account</h2>
      <form
        onSubmit={handleSignUp}
        className="bg-gray-900 p-8 rounded-xl w-full max-w-md flex flex-col gap-4"
      >
        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded-md text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded-md text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-white text-black py-2 rounded-md font-semibold hover:bg-gray-200 transition"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
