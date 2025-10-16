import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HeroLanding() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
      
      {/* Floating Abstract Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top Left Shape */}
        <div className="absolute top-20 left-10 w-64 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl transform -rotate-12 animate-float" />
        
        {/* Top Right Shape */}
        <div className="absolute top-32 right-20 w-80 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl transform rotate-12 animate-float-delayed" />
        
        {/* Middle Left Shape */}
        <div className="absolute top-1/2 left-32 w-72 h-28 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-full blur-xl transform -rotate-6 animate-float-slow" />
        
        {/* Bottom Right Shape */}
        <div className="absolute bottom-40 right-32 w-96 h-36 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-xl transform rotate-6 animate-float" />
        
        {/* Center Shape */}
        <div className="absolute top-1/3 right-1/4 w-64 h-24 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-xl transform rotate-45 animate-float-delayed" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-white text-sm font-medium">LeadIntel</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 max-w-5xl leading-tight">
          <span className="text-white">Unlock Intelligent</span>
          <br />
          <span className="text-white">Lead Data </span>
          <span className="bg-gradient-to-b from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg md:text-xl max-w-3xl mb-12 leading-relaxed">
          Discover and enrich company data with real-time insights. Access
          comprehensive contact information, funding details, and industry
          intelligence—all in one powerful platform.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
        >
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(12deg);
          }
          50% {
            transform: translateY(-20px) rotate(12deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) rotate(-12deg);
          }
          50% {
            transform: translateY(-30px) rotate(-12deg);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) rotate(-6deg);
          }
          50% {
            transform: translateY(-15px) rotate(-6deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
