import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc";
// import { signIn, useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { data: isAuthenticated, isLoading } =
    trpc.auth.isAuthenticated.useQuery();
  const [hover, setHover] = useState(false);
  const navigate = useLocation()[1];

  if (isAuthenticated) {
    navigate("/");
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen">
      <div className="flex flex-col items-center justify-center w-full gap-6">
        <Logo />
        <Button
          onClick={() => {
            window.location.href = "/google/login";
          }}
          className=" overflow-hidden relative bg-[#FFF] hover:bg-[#FFF] text-black border border-white border-opacity-10 h-14 justify-center w-[360px] rounded-full transition-all duration-3000 text-base"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <img
            src="/google.png"
            alt="google"
            width={33}
            height={30}
            className="mr-4 absolute left-4 top-[50%] -translate-y-[50%]"
          />
          Continue with Google
          <ArrowRight
            className="absolute top-[50%] -translate-y-[50%] w-8 h-8"
            style={{
              opacity: hover ? 1 : 0,
              right: hover ? "16px" : "32px",
              transition: "all 0.3s ease",
            }}
            strokeWidth={1}
          />
        </Button>
        <a href="/" className="underline">
          Go back to home
        </a>
      </div>
    </div>
  );
}
