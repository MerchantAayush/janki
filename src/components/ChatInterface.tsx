import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Image as ImageIcon, Sparkles, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatMutation, useGenerateImage } from "@/hooks/use-janki";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { LotusSpinner } from "./ui/lotus-spinner";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Message = {
  role: "user" | "assistant";
  text: string;
  type?: "text" | "image";
  id: string;
};

const MODES = [
  "Meditation / Mantra Guide",
  "Dharm Knowledge",
  "Learning",
  "Reasoning",
  "Problem Solving",
  "Perception",
  "Data Analysis",
  "Automation",
  "Storytelling",
  "Poetry",
  "Creative",
];

const LANGUAGES = [
  "English", "Hindi", "Sanskrit", "Spanish", "French", 
  "German", "Chinese", "Japanese", "Arabic", "Russian"
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      text: "Namaste. I am Janki AI. How may I assist you on your journey today?", 
      id: "init",
      type: "text"
    }
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(MODES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [isListening, setIsListening] = useState(false);
  
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { data: user } = useUser();
  const buyPremiumMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/buy-premium", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      toast({ title: "Success", description: "🎉 You are now a Premium user. Welcome!" });
      setIsPremiumModalOpen(false);
    }
  });

  const chatMutation = useChatMutation();
  const imageMutation = useGenerateImage();
  const { toast } = useToast();

  // Show premium message for free users
  useEffect(() => {
    if (user && !user.isPremium && messages.length === 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          text: "⚠️ Free users have limited access. Buy Premium to unlock full experience 🌸",
          id: "premium-warning",
          type: "text"
        }]);
      }, 1000);
    }
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + " " + transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({ title: "Voice Error", description: "Could not recognize voice.", variant: "destructive" });
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      const handleInput = () => {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
      };
      textarea.addEventListener("input", handleInput);
      return () => textarea.removeEventListener("input", handleInput);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Quick answer check
    const lowerMsg = input.toLowerCase();
    let quickReply = null;
    if (lowerMsg.includes("time")) quickReply = new Date().toLocaleTimeString();
    else if (lowerMsg.includes("date")) quickReply = new Date().toLocaleDateString();
    else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) quickReply = "Hello! 🌸 How are you?";
    else if (lowerMsg.includes("yes") || lowerMsg.includes("no")) quickReply = lowerMsg.includes("yes") ? "Yes 👍" : "No 👎";

    const userMsg: Message = { role: "user", text: input, id: Date.now().toString(), type: "text" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    if (quickReply) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: quickReply, 
        id: Date.now().toString(),
        type: "text"
      }]);
      const utterance = new SpeechSynthesisUtterance(quickReply);
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
      return;
    }

    if (user && !user.isPremium && messages.filter(m => m.role === 'user').length >= 5) {
      toast({ title: "Limit Reached", description: "Free users are limited to 5 messages per session. Please upgrade to Premium!", variant: "destructive" });
      setIsPremiumModalOpen(true);
      return;
    }

    try {
      const response = await chatMutation.mutateAsync({
        sessionId: "session-" + (user?.id || "guest"),
        message: userMsg.text,
        mode,
        language,
        type: "text"
      });

      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: response.reply, 
        id: Date.now().toString(),
        type: "text"
      }]);
      const utterance = new SpeechSynthesisUtterance(response.reply);
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to send",
        variant: "destructive"
      });
    }
  };

  const handleGenerateImage = async () => {
    if (user && !user.isPremium) {
      toast({ title: "Premium Feature", description: "Image generation is only for premium users.", variant: "destructive" });
      setIsPremiumModalOpen(true);
      return;
    }

    if (!input.trim()) {
      toast({ title: "Input Required", description: "Please describe the image you want.", variant: "destructive" });
      return;
    }

    const userMsg: Message = { role: "user", text: `Generate image: ${input}`, id: Date.now().toString(), type: "text" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const response = await imageMutation.mutateAsync(input);
      
      response.images.forEach((imgUrl, idx) => {
        setMessages(prev => [...prev, {
          role: "assistant",
          text: imgUrl, // URL as text for simplicity in render
          id: Date.now().toString() + idx,
          type: "image"
        }]);
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Premium required")) {
        toast({ title: "Premium Only", description: "Please upgrade to generate images.", variant: "destructive" });
      }
      // Other errors handled in hook
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({ title: "Not Supported", description: "Voice input not supported in this browser.", variant: "destructive" });
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendOtp = async () => {
    try {
      await apiRequest("POST", "/api/send-otp", { email: loginEmail });
      setOtpSent(true);
      toast({ title: "Success", description: "OTP sent to email" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await apiRequest("POST", "/api/verify-otp", { otp: loginOtp });
      toast({ title: "Success", description: "Login successful" });
      setIsLoginModalOpen(false);
      // In a real app we'd refresh user state here
    } catch (error) {
      toast({ title: "Error", description: "Invalid OTP", variant: "destructive" });
    }
  };

  return (
    <div className="glass-panel relative z-10 w-[400px] flex flex-col bg-white p-[15px] rounded-[10px]">
      <h2 className="text-xl font-bold mb-4">🌸 JANKI AI</h2>

      {/* Messages Area - id="chat" as requested */}
      <div id="chat" className="h-[300px] overflow-y-auto border border-[#ccc] p-2.5 mb-2.5 bg-white flex flex-col">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
                {msg.type === 'image' ? (
                  <div className="rounded-lg overflow-hidden">
                    <img src={msg.text} alt="Generated" className="w-full h-auto" />
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </motion.div>
          ))}
          {chatMutation.isPending && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-[#f0f4ff] p-3 rounded-2xl rounded-tl-none border border-pink-100/50">
                <div id="aiTyping">
                   <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXpueG56Znd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpx4A9K8xG5G/giphy.gif" width="50" alt="AI Typing..." />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 flex-wrap">
        <input
          id="msg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask JANKI..."
          className="w-[65%] p-1.5 border border-[#ccc] rounded-md"
        />
        
        <button
          onClick={handleSend}
          disabled={!input.trim() || chatMutation.isPending}
          className="w-[30%] p-1.5 bg-[#c2185b] text-white border-none rounded-md cursor-pointer hover:bg-[#a0134a]"
        >
          Send
        </button>
        
        <button
          onClick={toggleVoice}
          className="w-[30%] p-1.5 bg-[#c2185b] text-white border-none rounded-md cursor-pointer hover:bg-[#a0134a]"
        >
          🎤 Speak
        </button>
      </div>

      {/* Premium Modal */}      <AnimatePresence>
        {isPremiumModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setIsPremiumModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">✨ Janki AI Premium</h2>
              <p className="text-gray-600 mb-4 text-sm">Unlock full access to Janki AI</p>

              <ul className="text-left space-y-2 mb-6 text-sm text-gray-700">
                <li className="flex items-center gap-2">✅ Unlimited chats</li>
                <li className="flex items-center gap-2">✅ Advanced spiritual + science answers</li>
                <li className="flex items-center gap-2">✅ Priority responses</li>
                <li className="flex items-center gap-2">✅ Support the creator</li>
              </ul>

              <button 
                className="buy-btn" 
                onClick={() => buyPremiumMutation.mutate()}
                disabled={buyPremiumMutation.isPending}
              >
                {buyPremiumMutation.isPending ? "Processing..." : "Buy for ₹99"}
              </button>
              <button className="close-btn" onClick={() => setIsPremiumModalOpen(false)}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setIsLoginModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="logo text-[#22c55e] text-[30px] font-bold mb-1 drop-shadow-[0_0_12px_rgba(34,197,94,0.35)]">Janki</div>
              <h2 className="text-sm text-[#9ca3af] mb-6">Secure OTP Login</h2>
              
              {!otpSent ? (
                <div className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="w-full px-4 py-3.5 bg-transparent border border-[#1f2937] rounded-[12px] text-[#e5e7eb] placeholder:text-[#6b7280] outline-none text-[15px] focus:border-[#22c55e] focus:shadow-[0_0_0_2px_rgba(34,197,94,0.15)] transition-all"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                  />
                  <button className="buy-btn" onClick={handleSendOtp}>Send OTP</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[13px] text-[#9ca3af] my-4 uppercase tracking-wider">Enter OTP</div>
                  <input 
                    type="text" 
                    placeholder="6-digit OTP"
                    className="w-full px-4 py-3.5 bg-transparent border border-[#1f2937] rounded-[12px] text-[#e5e7eb] placeholder:text-[#6b7280] outline-none text-[15px] focus:border-[#22c55e] focus:shadow-[0_0_0_2px_rgba(34,197,94,0.15)] transition-all"
                    value={loginOtp}
                    onChange={e => setLoginOtp(e.target.value)}
                  />
                  <button className="buy-btn" onClick={handleVerifyOtp}>Verify & Continue</button>
                  <button className="text-xs text-[#9ca3af] underline block mx-auto mt-2 hover:text-[#e5e7eb] transition-colors" onClick={() => setOtpSent(false)}>Change Email</button>
                </div>
              )}
              
              <div className="footer mt-6 text-[12px] text-[#9ca3af]">
                Built by Aayush Kashyap
              </div>
              <button className="close-btn block mx-auto mt-4 text-[12px] text-[#9ca3af] hover:text-[#e5e7eb] transition-colors" onClick={() => setIsLoginModalOpen(false)}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
