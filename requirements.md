## Packages
framer-motion | Smooth animations for chat bubbles and transitions
recharts | For visualizing learning progress
lucide-react | Beautiful icons for the interface (already in base but explicit mention for complex usage)
react-speech-recognition | For voice input integration (optional, but standard for React voice) or use native API
regenerator-runtime | Required for speech recognition if using certain libraries

## Notes
Voice Input uses webkitSpeechRecognition API (browser native).
Theme colors: Pink (#ffe6f0, #c2185b).
Premium features require checking `user.isPremium`.
Daily quote fetches from /api/daily-quote.
