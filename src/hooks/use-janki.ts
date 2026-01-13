import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertChat } from "@shared/schema";

// --- Types ---
interface ChatResponse {
  reply: string;
  chatId?: number;
}

interface ImageResponse {
  images: string[];
}

interface QuoteResponse {
  quote: string;
}

// --- Hooks ---

export function useDailyQuote() {
  return useQuery({
    queryKey: [api.dailyQuote.get.path],
    queryFn: async () => {
      const res = await fetch(api.dailyQuote.get.path);
      if (!res.ok) throw new Error("Failed to fetch quote");
      return api.dailyQuote.get.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useChatMutation() {
  return useMutation({
    mutationFn: async (data: { 
      sessionId: string; 
      message: string; 
      mode: string; 
      language: string; 
      type?: string 
    }) => {
      const res = await fetch(api.chat.send.path, {
        method: api.chat.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please log in to chat");
        throw new Error("Failed to send message");
      }
      
      return api.chat.send.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateImage() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch(api.premiumImage.generate.path, {
        method: api.premiumImage.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Premium Required");
        throw new Error("Failed to generate image");
      }

      return api.premiumImage.generate.responses[200].parse(await res.json());
    },
    onError: (error: Error) => {
      if (error.message === "Premium Required") {
        toast({
          title: "Premium Feature",
          description: "Image generation is available for Premium users.",
          variant: "destructive",
        });
      }
    }
  });
}

export function useBuyPremium() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.buyPremium.post.path, {
        method: api.buyPremium.post.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Purchase failed");
      return api.buyPremium.post.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to Premium!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    }
  });
}
