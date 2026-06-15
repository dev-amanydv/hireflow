import SigninPage from "~/components/auth/Signin";
import type { Route } from "./+types/home";
import { useState } from "react";
import SignupPage from "~/components/auth/Signup";
import { Button } from "~/components/ui/button";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [popup, setPopup] = useState<"signin" | "signup" | "none">('signup');

  return (
    <div className="min-h-screen w-screen  flex">
      <div className="min-h-screen w-full bg-zinc-200 relative text-gray-800">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(75, 85, 99, 0.06) 5px, rgba(75, 85, 99, 0.06) 6px, transparent 6px, transparent 15px),
        repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(75, 85, 99, 0.06) 5px, rgba(75, 85, 99, 0.06) 6px, transparent 6px, transparent 15px),
        repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(107, 114, 128, 0.04) 10px, rgba(107, 114, 128, 0.04) 11px, transparent 11px, transparent 30px),
        repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(107, 114, 128, 0.04) 10px, rgba(107, 114, 128, 0.04) 11px, transparent 11px, transparent 30px)
      `,
          }}
        />
        {popup === 'signin' ? <SigninPage setPopup={setPopup} /> : popup === 'signup' ? <SignupPage setPopup={setPopup} /> : null}
        <Button onClick={() => setPopup('signup')}>Get start</Button>
      </div>
    </div>
  );
}
