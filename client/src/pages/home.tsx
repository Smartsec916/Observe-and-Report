import React, { useState } from "react";
import { Route, Switch, useLocation, useRoute } from "wouter";
import { Bell, Settings, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import InputPage from "./input";
import SearchPage from "./search";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [isOnInputRoute] = useRoute("/");
  const [isOnSearchRoute] = useRoute("/search");

  const activeTab = isOnInputRoute ? "input" : isOnSearchRoute ? "search" : "input";

  const navigateTo = (tab: string) => {
    if (tab === "input") {
      setLocation("/");
    } else if (tab === "search") {
      setLocation("/search");
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#121212] text-white">
      {/* App Header */}
      <header className="px-4 py-3 bg-[#1E1E1E] border-b border-[#3A3A3A] sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-[#0F52BA]">Observe & Report</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-[#3A3A3A] transition-colors">
              <Bell className="h-5 w-5 text-[#8A8A8A]" />
            </button>
            <button className="p-2 rounded-full hover:bg-[#3A3A3A] transition-colors">
              <Settings className="h-5 w-5 text-[#8A8A8A]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Ensuring proper spacing at the bottom */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Switch>
          <Route path="/" component={InputPage} />
          <Route path="/search" component={SearchPage} />
        </Switch>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#3A3A3A] z-10">
        <div className="max-w-md mx-auto flex justify-around items-center relative">
          <button
            className={cn(
              "flex flex-col items-center justify-center py-3 px-5",
              activeTab === "input" ? "text-[#0F52BA]" : "text-[#8A8A8A]"
            )}
            onClick={() => navigateTo("input")}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs mt-1">Input</span>
          </button>
          <button
            className={cn(
              "flex flex-col items-center justify-center py-3 px-5",
              activeTab === "search" ? "text-[#0F52BA]" : "text-[#8A8A8A]"
            )}
            onClick={() => navigateTo("search")}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </button>
        </div>
        <div
          className={cn(
            "h-0.5 bg-[#0F52BA] w-1/2 transition-transform duration-300",
            activeTab === "input" ? "translate-x-0" : "translate-x-full"
          )}
        />
      </nav>
    </div>
  );
}
