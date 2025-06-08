'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useMemo } from "react";
import LeftSidebar from "./components/LeftSidebar";
import RightSidebar from "./components/RightSidebar";

export default function Home() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All unread mails');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const handleDetox = async () => {
    setIsLoading(true);
    try {
      const emailRes = await fetch("/api/getEmails");
      const rawEmails = await emailRes.json();

      if (rawEmails && rawEmails.length === 0) {
        alert("You have no unread emails to detox!");
        setIsLoading(false);
        return;
      }

      const emailIds = rawEmails.map((email: any) => email.id);

      const processRes = await fetch("/api/processEmails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds }),
      });
      const processedData = await processRes.json();

      const mergedEmails = rawEmails.map((rawEmail: any) => {
        const processed = processedData.find((p: any) => p.emailId === rawEmail.id);
        return {
          ...rawEmail,
          tag: processed?.tag,
          importance: processed?.importance,
        };
      });

      setEmails(mergedEmails);
    } catch (error) {
      console.error("Error during detox process:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (emailId: string) => {
    setSelectedEmails((prevSelectedEmails) => {
      if (prevSelectedEmails.includes(emailId)) {
        return prevSelectedEmails.filter((id) => id !== emailId);
      } else {
        return [...prevSelectedEmails, emailId];
      }
    });
  };

  const handleCleanEmails = async () => {
    try {
      const res = await fetch('/api/cleanEmails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedEmails }),
      });

      if (res.ok) {
        setEmails((prevEmails) =>
          prevEmails.filter((email: any) => !selectedEmails.includes(email.id))
        );
        setSelectedEmails([]);
        alert('Selected emails have been cleaned!');
      } else {
        alert('Failed to clean emails.');
      }
    } catch (error) {
      console.error('Error cleaning emails:', error);
      alert('An error occurred while cleaning emails.');
    }
  };

  const filteredEmails = useMemo(() => {
    let emailsToDisplay = [...emails];

    if (activeFilter && activeFilter !== 'All unread mails') {
      // Normalize the filter value, e.g., "Important mails" -> "important"
      const filterValue = activeFilter.replace(/ mails$/i, '').toLowerCase();
      emailsToDisplay = emailsToDisplay.filter((email: any) => {
        // Safely normalize the importance value from the email object
        const importanceValue = (email.importance || '').toLowerCase();
        // Add this log:
        return importanceValue === filterValue;
      });
    }

    if (activeTag) {
      emailsToDisplay = emailsToDisplay.filter((email: any) => email.tag === activeTag);
    }

    return emailsToDisplay;
  }, [emails, activeFilter, activeTag]);

  if (session) {
    return (
      <div className="container mx-auto p-8 font-[family-name:var(--font-geist-sans)]">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inbox Detox</h1>
          <div className="flex items-center">
            <p className="mr-4">Signed in as {session.user?.email}</p>
            <button
              onClick={() => signOut()}
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="flex">
          <LeftSidebar
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            setActiveTag={setActiveTag}
          />
          <main className="flex-grow p-4">
            <div className="flex flex-col items-center gap-8">
              <button
                onClick={handleDetox}
                disabled={isLoading}
                className="rounded-full bg-blue-600 text-white transition-colors flex items-center justify-center hover:bg-blue-700 font-bold text-lg h-12 px-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Detoxing..." : "Detox Now"}
              </button>

              {isLoading && <p>Processing your emails. This might take a moment...</p>}

              {emails.length > 0 && (
                <div className="w-full max-w-4xl mt-8">
                  <h2 className="text-2xl font-bold mb-4">Your Detoxed Inbox</h2>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmails.map((email: any) => (
                      <li key={email.id} className="py-4 flex items-center">
                        <input
                          type="checkbox"
                          className="mr-4"
                          checked={selectedEmails.includes(email.id)}
                          onChange={() => handleCheckboxChange(email.id)}
                        />
                        <div>
                          <div className="font-bold text-lg">
                            {email.payload.headers.find((h: any) => h.name === 'Subject')?.value}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            From: {email.payload.headers.find((h: any) => h.name === 'From')?.value}
                          </div>
                          <p className="mt-2 text-gray-800 dark:text-gray-200">{email.snippet}</p>
                          <div className="mt-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              email.importance === 'Important' ? 'bg-yellow-500 text-white' :
                              email.importance === 'Urgent' ? 'bg-red-500 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {email.importance}
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                              {email.tag}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <button
                      disabled={selectedEmails.length === 0}
                      onClick={handleCleanEmails}
                      className="rounded-full bg-red-600 text-white transition-colors flex items-center justify-center hover:bg-red-700 font-bold text-lg h-12 px-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Clean Mails
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
          <RightSidebar
            activeTag={activeTag}
            setActiveTag={setActiveTag}
            setActiveFilter={setActiveFilter}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to Inbox Detox</h1>
        <p>Sign in to clean up your inbox.</p>
        <button
          onClick={() => signIn("google")}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[200px]"
        >
          Sign in with Google
        </button>
      </main>
    </div>
  );
}
