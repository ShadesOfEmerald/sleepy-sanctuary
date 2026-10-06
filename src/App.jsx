import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, Music, 
  Sparkles, ChevronUp 
} from 'lucide-react';

// --- CONFIGURATION FOR REMOTE UPDATES ---
const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const JSONBIN_API_KEY = import.meta.env.VITE_JSONBIN_API_KEY;

// Pseudo-random generator with seed for true non-repeating natural star distribution
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const GENERATED_STARS = Array.from({ length: 90 }, (_, i) => {
  const top = seededRandom(i * 1.3 + 1) * 72; // Cover top 72% of sky
  const left = seededRandom(i * 2.7 + 5) * 100; // Natural X distribution
  const sizeRandom = seededRandom(i * 4.1 + 9);
  const size = sizeRandom > 0.85 ? 'w-1.5 h-1.5' : sizeRandom > 0.5 ? 'w-1 h-1' : 'w-0.5 h-0.5';
  const opacity = 0.3 + (seededRandom(i * 3.5) * 0.6);
  const delay = seededRandom(i * 5.9) * 4;
  const duration = 2 + (seededRandom(i * 6.2) * 3);

  return { id: i, top, left, size, opacity, delay, duration };
});

export default function SleepApp() {
  // --- STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDimmed, setIsDimmed] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);

  // Custom Live Message States
  const [customMessage, setCustomMessage] = useState("Sweet dreams & sleep well baobei <3 I love you so muchh mwuahh");
  const [inputMessage, setInputMessage] = useState("");
  const [showMsgDrawer, setShowMsgDrawer] = useState(false);
  
  // Music Player States
  const [musicPlaying, setMusicPlaying] = useState(true);
  
  // DATA SOURCES
  const R2_DOMAIN = import.meta.env.VITE_R2_DOMAIN || "";

  const musicTracks = [
    { 
      title: 'Mreowww its already 2am???', 
      url: `${R2_DOMAIN}/Peder%20B.%20Helland%20-%20Thursday%20(Rain%20Version)%20_%20Soft%20Piano%20Music%20for%20Sleep%20%26%20Relaxation%20-%20(192%20Kbps).mp3` 
    },
    { 
      title: 'Yours Truly <3', 
      url: `${R2_DOMAIN}/Deep%20Sleep%20-%20piano%20and%20rain.mp3` 
    },
    { 
      title: 'Cuddling in the Car', 
      url: `${R2_DOMAIN}/Rainy%20Afternoon%20in%20the%20Car.mp3` 
    },
    { 
      title: 'CAS - Playlist', 
      url: `${R2_DOMAIN}/CAS%20-%20Late%20Night%20Playlist.mp3` 
    },
    { 
      title: 'Apple Cider', 
      url: `${R2_DOMAIN}/Relaxing%20Piano%20Music%20with%20Rain.mp3` 
    },
    { 
      title: 'Stargazing with You', 
      url: `${R2_DOMAIN}/Rain%20and%20Thunder%20behind%20a%20Window.mp3` 
    },
    { 
      title: 'Wifebun and Husbun', 
      url: `${R2_DOMAIN}/Heavy%20Rain%20%26%20Thunder.mp3` 
    },
    { 
      title: 'Dododo hao bu hao', 
      url: `${R2_DOMAIN}/Sound%20of%20Rain%20and%20Thunder.mp3` 
    }
  ];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    const lastPlayed = localStorage.getItem('last_played_track');
    let availableIndices = musicTracks.map((_, idx) => idx);
    
    if (lastPlayed !== null && musicTracks.length > 1) {
      const lastIndex = parseInt(lastPlayed, 10);
      availableIndices = availableIndices.filter(i => i !== lastIndex);
    }
    
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    localStorage.setItem('last_played_track', randomIndex.toString());
    return randomIndex;
  });

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [musicVolume, setMusicVolume] = useState(() => {
    const savedVolume = localStorage.getItem('music_player_volume');
    return savedVolume !== null ? Number(savedVolume) : 20;
  });

  const musicAudioRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  // Inactivity & Auto-collapse Timer (20 Seconds)
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setIsPlayerExpanded(false);
      setIsDimmed(true);
    }, 4000); // 20 Seconds
  };

  useEffect(() => {
    // Throttle user activity events to avoid constant state resets
    let lastActivityTime = Date.now();

    const handleUserActivity = (e) => {
      // Ignore click events coming from the player container to prevent double triggers
      if (e.target.closest('#floating-music-player')) return;

      const now = Date.now();
      // Only reset if at least 500ms has passed since last activity
      if (now - lastActivityTime > 500) {
        lastActivityTime = now;
        setIsDimmed(false);
        setIsPlayerExpanded(true);
        resetInactivityTimer();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, []);

  // Persistent Volume Saving
  const handleVolumeChange = (newVolume) => {
    setMusicVolume(newVolume);
    localStorage.setItem('music_player_volume', newVolume.toString());
  };

  // --- CLOCK & TIMING ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- GREETING LOGIC ---
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 4 && hour < 12) return 'Good Morning, sunshine';
    if (hour >= 12 && hour < 18) return 'Henyo, my Love';
    return 'Good Night, baby';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- CELESTIAL CALCULATIONS ---
  const getSkyMetrics = () => {
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    
    let isNight = hours < 5 || hours >= 19;
    let skyGradient = "";
    let sunPos = { top: "120%", left: "50%", opacity: 0 };
    let moonPos = { top: "120%", left: "50%", opacity: 0 };

    if (hours >= 5 && hours < 6.5) {
      const progress = (hours - 5) / 1.5;
      skyGradient = "from-[#0a0c1a] via-[#2a1b38] to-[#6e3940]";
      sunPos = { 
        top: `${85 - progress * 40}%`, 
        left: `${10 + progress * 20}%`, 
        opacity: Math.min(progress, 0.7)
      };
      moonPos = { top: `${15 + progress * 40}%`, left: `${80 + progress * 10}%`, opacity: 1 - progress };
    } else if (hours >= 6.5 && hours < 18) {
      const dayProgress = (hours - 6.5) / 11.5;
      skyGradient = "from-[#1e3c72] via-[#2a5298] to-[#78a3c8]";
      sunPos = { 
        top: `${20 + Math.sin(dayProgress * Math.PI) * -15}%`, 
        left: `${30 + dayProgress * 60}%`, 
        opacity: 1 
      };
      moonPos = { top: "120%", left: "90%", opacity: 0 };
    } else if (hours >= 18 && hours < 19) {
      const sunsetProgress = (hours - 18);
      skyGradient = "from-[#121324] via-[#3a1c38] to-[#8d443b]";
      sunPos = { top: `${30 + sunsetProgress * 50}%`, left: "90%", opacity: 1 - sunsetProgress };
      moonPos = { top: `${70 - sunsetProgress * 50}%`, left: "10%", opacity: sunsetProgress };
    } else {
      const nightProgress = hours >= 19 ? (hours - 19) / 10 : (hours + 5) / 10;
      skyGradient = "from-[#03050d] via-[#0a0f24] to-[#141830]";
      moonPos = { 
        top: `${35 - Math.sin(nightProgress * Math.PI) * 20}%`, 
        left: `${15 + nightProgress * 70}%`, 
        opacity: 1 
      };
      sunPos = { top: "120%", left: "0%", opacity: 0 };
    }

    return { skyGradient, sunPos, moonPos, isNight };
  };

  const { skyGradient, sunPos, moonPos, isNight } = getSkyMetrics();

  // --- AUTOMATIC REMOTE NOTE SYNC ---
  const fetchRemoteNote = async () => {
    if (!JSONBIN_BIN_ID) return;
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: JSONBIN_API_KEY ? { 'X-Master-Key': JSONBIN_API_KEY } : {}
      });
      const data = await res.json();
      if (data?.record?.message) {
        setCustomMessage(data.record.message);
      }
    } catch (e) {
      console.log("Remote note sync failed", e);
    }
  };

  useEffect(() => {
    fetchRemoteNote();
    const interval = setInterval(fetchRemoteNote, 300000); // Polling every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // --- MUSIC PLAYER LOGIC ---
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = Math.min(Math.max(musicVolume / 100, 0), 1);
    }
  }, [musicVolume]);

  useEffect(() => {
    if (!musicAudioRef.current) {
      musicAudioRef.current = new Audio(musicTracks[currentTrackIndex].url);
    } else {
      musicAudioRef.current.src = musicTracks[currentTrackIndex].url;
    }

    const audio = musicAudioRef.current;
    
    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleNextTrack);

    if (musicPlaying) {
      audio.play().catch(e => console.log("Music play blocked:", e));
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleNextTrack);
    };
  }, [currentTrackIndex, musicPlaying]);

  const toggleMusicPlay = () => {
    setMusicPlaying(!musicPlaying);
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => {
      const nextIndex = (prev + 1) % musicTracks.length;
      localStorage.setItem('last_played_track', nextIndex.toString());
      return nextIndex;
    });
    setMusicPlaying(true);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => {
      const prevIndex = (prev - 1 + musicTracks.length) % musicTracks.length;
      localStorage.setItem('last_played_track', prevIndex.toString());
      return prevIndex;
    });
    setMusicPlaying(true);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (musicAudioRef.current) {
      musicAudioRef.current.currentTime = val;
    }
  };

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#070b19] text-white font-sans select-none flex flex-col justify-between">
      
      {/* KEYFRAME ANIMATIONS FOR ULTRA-SLOW PARALLAX DRIFT */}
      <style>{`
        @keyframes parallaxDriftLeft {
          0% { transform: translateX(0%); }
          50% { transform: translateX(-14%); }
          100% { transform: translateX(0%); }
        }
        @keyframes parallaxDriftRight {
          0% { transform: translateX(0%); }
          50% { transform: translateX(18%); }
          100% { transform: translateX(0%); }
        }
        @keyframes gentleBob {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        .animate-mountain-drift {
          animation: parallaxDriftLeft 120s ease-in-out infinite;
        }
        .animate-hill-front {
          animation: parallaxDriftRight 75s ease-in-out infinite;
        }
        .animate-hill-back {
          animation: parallaxDriftLeft 90s ease-in-out infinite;
        }
        .animate-sky-float {
          animation: gentleBob 12s ease-in-out infinite;
        }
      `}</style>

      {/* BACKGROUND GRAPHICS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Sky Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${skyGradient} transition-colors duration-[3000ms]`} />
        
        {/* Sun Element */}
        <div 
          className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-[#ffaa00] via-[#ffee88] to-[#ffffff] shadow-[0_0_60px_rgba(255,200,100,0.8)] transition-all duration-1000"
          style={{
            top: sunPos.top,
            left: sunPos.left,
            opacity: sunPos.opacity,
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Moon Element */}
        <div 
          className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-[#ffe6a7] to-[#fff] shadow-[0_0_35px_rgba(255,230,167,0.5)] transition-all duration-1000"
          style={{
            top: moonPos.top,
            left: moonPos.left,
            opacity: moonPos.opacity,
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Stars Container - Gentle Sky Float */}
        <div className={`absolute inset-0 transition-opacity duration-[3000ms] animate-sky-float ${isNight ? 'opacity-100' : 'opacity-20'}`}>
          {GENERATED_STARS.map((star) => (
            <div
              key={star.id}
              className={`absolute bg-white rounded-full animate-pulse ${star.size}`}
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                opacity: star.opacity,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`
              }}
            />
          ))}
        </div>

        {/* Distant Mountains - Slower Background Parallax */}
        <div 
          className="absolute bottom-40 -left-[20%] -right-[20%] h-64 bg-gradient-to-t from-[#1b2245] to-[#0e1327] opacity-90 animate-mountain-drift" 
          style={{ clipPath: 'polygon(0% 100%, 15% 35%, 32% 80%, 50% 20%, 72% 75%, 88% 40%, 100% 100%)' }}
        />

        {/* Mid-ground Hills - Faster Layered Parallax */}
        <div className="absolute bottom-20 -left-[25%] -right-[25%] h-52 bg-[#0a0d1d] rounded-t-[50%] opacity-95 animate-hill-back" />
        <div className="absolute bottom-12 -left-[30%] -right-[30%] h-44 bg-[#060814] rounded-t-[40%] animate-hill-front" />

        {/* Campfire Warm Glow */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-20 bg-amber-500/20 blur-xl rounded-full" />
      </div>

      {/* SCREEN DIMMING OVERLAY */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity duration-1000 z-10 pointer-events-none ${
          isDimmed ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* HEADER AREA */}
      <div className="relative z-20 p-6 sm:p-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-wide drop-shadow-md">
            {getGreeting()}
          </h1>
          <p className="text-sm text-indigo-200/70 mt-1 capitalize tracking-wider">
            {formatDate(currentTime)}
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="text-xl sm:text-2xl font-medium tracking-tight text-indigo-100">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* CENTER LIVE MINI MESSAGE CARD */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-xl text-center space-y-1 transition-all">
          <div className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-amber-300" /> Note For You
          </div>
          <p className="text-sm sm:text-base font-medium text-white/95 leading-relaxed italic">
            "{customMessage}"
          </p>
        </div>
      </div>

      {/* BOTTOM FLOATING MUSIC CONTROLLER CONTAINER WITH ANIMATIONS */}
      <div className="relative z-30 p-4 sm:p-6 pb-6">
        <div 
          id="floating-music-player"
          className={`bg-[#0b1021]/85 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-700 ease-in-out transform overflow-hidden ${
            isPlayerExpanded 
              ? 'translate-y-0 opacity-100 scale-100 p-5' 
              : 'translate-y-2 opacity-80 scale-95 p-3 cursor-pointer hover:opacity-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPlayerExpanded) {
              setIsPlayerExpanded(true);
              setIsDimmed(false);
            }
            resetInactivityTimer();
          }}
        >
          {/* COLLAPSED VIEW (Mini Bar) */}
          <div 
            className={`grid transition-all duration-700 ease-in-out ${
              !isPlayerExpanded 
                ? 'grid-rows-[1fr] opacity-100 pointer-events-auto' 
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex items-center justify-between px-2 text-indigo-200">
                <div className="flex items-center gap-2.5 truncate">
                  <Music size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-xs font-medium truncate">{musicTracks[currentTrackIndex].title}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-indigo-300/70 font-medium shrink-0 ml-2">
                  <span>Open</span>
                  <ChevronUp size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* EXPANDED VIEW */}
          <div 
            className={`grid transition-all duration-700 ease-in-out ${
              isPlayerExpanded 
                ? 'grid-rows-[1fr] opacity-100 pointer-events-auto' 
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm">
                  <Music size={18} />
                  <span>{musicTracks[currentTrackIndex].title}</span>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                {/* Seeker */}
                <div className="space-y-1">
                  <input 
                    type="range" min="0" max={duration || 100} value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>{Math.floor(progress / 60)}:{('0' + Math.floor(progress % 60)).slice(-2)}</span>
                    <span>{Math.floor(duration / 60)}:{('0' + Math.floor(duration % 60)).slice(-2)}</span>
                  </div>
                </div>

                {/* Music Volume Control */}
                <div className="flex items-center gap-3 pt-1">
                  <Volume2 size={16} className="text-indigo-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Volume</span>
                      <span>{musicVolume}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={musicVolume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <button onClick={handlePrevTrack} className="p-2 text-gray-300 hover:text-white transition-colors">
                    <SkipBack size={20} />
                  </button>
                  <button 
                    onClick={toggleMusicPlay}
                    className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {musicPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>
                  <button onClick={handleNextTrack} className="p-2 text-gray-300 hover:text-white transition-colors">
                    <SkipForward size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}