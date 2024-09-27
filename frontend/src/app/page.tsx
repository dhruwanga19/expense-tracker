import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DotPattern from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-white">
      <header className="p-5 flex justify-between items-center">
        <div className="flex items-center">
          <Image
            src="/nobacklogo.png"
            alt="CostCompass Logo"
            className="mr-1"
            height={80}
            width={80}
          />
          <h1 className="text-3xl font-bold font-serif text-green-700">
            CostCompass
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="lg" className="text-md" variant="ghost">
            Login
          </Button>
          <Button size="lg">New? Sign Up</Button>
        </div>
      </header>

      <main className="container mx-auto text-center py-20 relative">
        <DotPattern
          className={cn(
            "absolute inset-0 z-0",
            "[mask-image:linear-gradient(to_top,transparent,white)]"
          )}
        />
        <div className="relative z-10">
          <h2 className="text-5xl font-bold mb-6">Welcome to CostCompass</h2>
          <p className="text-xl mb-10">
            A solution to track all your expenses with AI
          </p>
          <div className="flex justify-center items-center gap-6">
            <Image
              src="/newlogo.png"
              alt="CostCompass Logo"
              height={100}
              width={100}
            />
            <Link href="/dashboard">
              <Button size="lg" className="text-lg">
                Get Started <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <section className=" py-20">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">
              All your expenses in one place
            </h3>
            <p>Personalise your expenses, sort them with Categories</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">AI Generated Bills</h3>
            <p>
              No more adding expenses one by one! Click a photo and leave it to
              AI
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">
              Budget-oriented Spending
            </h3>
            <p>
              Set your own budget and get personalised notifications when
              overspending
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-blue-100 text-foreground py-10">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 CostCompass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
