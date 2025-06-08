'use client';
"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<any[]>([]);

  const fetchEmails = async () => {
    const res = await fetch("/api/getEmails");
    const data = await res.json();
    setEmails(data);
  };

  if (session) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <p>Signed in as {session.user?.email}</p>
          <button
            onClick={() => signOut()}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
          >
            Sign out
          </button>
          <button
            onClick={fetchEmails}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
          >
            Fetch Emails
          </button>
          <div>
            {emails.map((email) => (
              <div key={email.id}>
                <p>
                  From:{" "}
                  {
                    email.payload.headers.find(
                      (header: any) => header.name === "From"
                    )?.value
                  }
                </p>
                <p>
                  Subject:{" "}
                  {
                    email.payload.headers.find(
                      (header: any) => header.name === "Subject"
                    )?.value
                  }
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <p>Not signed in</p>
        <button
          onClick={() => signIn("google")}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
        >
          Sign in with Google
        </button>
      </main>
    </div>
  );
}
