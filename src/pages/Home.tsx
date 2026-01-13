import React from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useDailyQuote, useBuyPremium } from "@/hooks/use-janki";
import { ChatInterface } from "@/components/ChatInterface";
import { LotusSpinner } from "@/components/ui/lotus-spinner";
import { Crown, LogIn, LogOut, Heart, Sparkles, Flower2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logoImg from "@/assets/logo.png";

export default function Home() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: quoteData, isLoading: quoteLoading } = useDailyQuote();
  const buyPremium = useBuyPremium();
  const { logout } = useAuth(); // Assuming this hook exists from previous steps

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-pink-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] bg-orange-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left flex items-center gap-4">
            <img src={logoImg} alt="Janki AI Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-1">
                Janki AI
              </h1>
              <p className="text-pink-900/60 text-lg font-medium font-display italic">
                Wisdom, Meditation & Infinite Knowledge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userLoading ? (
              <LotusSpinner className="w-8 h-8" />
            ) : user ? (
              <div className="flex gap-3 items-center glass-panel px-5 py-3 rounded-2xl">
                <div className="flex flex-col text-right">
                  <span className="font-bold text-pink-900">{user.username}</span>
                  <span className="text-xs text-pink-500 uppercase tracking-wider font-semibold flex items-center justify-end gap-1">
                    {user.isPremium ? (
                      <>Premium <Crown size={12} className="fill-yellow-400 text-yellow-600" /></>
                    ) : (
                      "Free Plan"
                    )}
                  </span>
                </div>
                
                {!user.isPremium && (
                  <button 
                    onClick={() => buyPremium.mutate()}
                    disabled={buyPremium.isPending}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    {buyPremium.isPending ? "Processing..." : <>Get Premium <Sparkles size={16} /></>}
                  </button>
                )}

                <button 
                  onClick={() => logout()} 
                  className="p-2 hover:bg-pink-100 rounded-full text-pink-400 hover:text-pink-700 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <a 
                href="/api/login" // Replit Auth native link
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-900/20 transition-all flex items-center gap-2"
              >
                <LogIn size={18} /> Login with Replit
              </a>
            )}
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Quote & Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Daily Quote Card */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-200/50 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <Heart className="fill-pink-200 text-pink-400" /> Daily Wisdom
              </h3>
              
              {quoteLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <LotusSpinner />
                </div>
              ) : (
                <blockquote className="relative">
                  <span className="text-6xl text-pink-100 absolute -top-4 -left-2 font-serif">"</span>
                  <p className="text-lg text-gray-700 italic font-display leading-relaxed relative z-10 pl-6">
                    {quoteData?.quote || "Peace comes from within. Do not seek it without."}
                  </p>
                  <footer className="text-right mt-4 text-sm text-pink-500 font-semibold">
                    — Sanatan Dharma
                  </footer>
                </blockquote>
              )}
            </div>

            {/* Features Info */}
            <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-white to-pink-50/50">
              <h3 className="font-bold text-pink-900 mb-4">Why Janki AI?</h3>
              <ul className="space-y-3">
                {[
                  "Personalized Meditation Guides",
                  "Ancient Dharmic Wisdom",
                  "Creative Storytelling & Poetry",
                  "Multi-lingual Support (10+ Languages)",
                  "Premium Image Generation"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Learning Progress (Placeholder for Recharts) */}
            {user && (
              <div className="glass-panel p-6 rounded-3xl">
                <h3 className="font-bold text-pink-900 mb-2">Your Journey</h3>
                <div className="h-32 flex items-center justify-center text-pink-300 text-sm bg-pink-50/50 rounded-xl border border-pink-100 border-dashed">
                  Start chatting to track progress
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Chat Interface */}
          <div className="lg:col-span-8">
            <ChatInterface />
          </div>

        </main>
      </div>
    </div>
  );
}
