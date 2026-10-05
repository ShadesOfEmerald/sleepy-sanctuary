import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, CloudRain, 
  CloudLightning, Music, Sliders, Moon, Sparkles, X, ChevronUp 
} from 'lucide-react';

export default function SleepApp() {
  // --- STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePlayer, setActivePlayer] = useState(null); // null | 'soundscape' | 'music'
  const [isDimmed, setIsDimmed] = useState(false);

  // Soundscape States
  const [soundscapePlaying, setSoundscapePlaying] = useState(false);
  const [volumes, setVolumes] = useState({
    master: 80,
    rain: 20,
    thunder: 15,
    piano: 15,
    car: 15
  });

  // Music Player States
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [musicVolume, setMusicVolume] = useState(20);

  // --- AUDIO REFS ---
  const soundscapeAudioRefs = {
    rain: useRef(null),
    thunder: useRef(null),
    piano: useRef(null),
    car: useRef(null)
  };

  const musicAudioRef = useRef(null);

  // --- DATA SOURCES ---
  const R2_DOMAIN = import.meta.env.VITE_R2_DOMAIN;

  const soundUrls = {
  rain: `${R2_DOMAIN}/==========`,
  thunder: `${R2_DOMAIN}/==========`,
  piano: `${R2_DOMAIN}/==========`,
  car: `${R2_DOMAIN}/==========`
};

const musicTracks = [
  { 
    title: 'Peder B. Helland - Thursday', 
    url: `${R2_DOMAIN}/Peder%20B.%20Helland%20-%20Thursday%20(Rain%20Version)%20_%20Soft%20Piano%20Music%20for%20Sleep%20%26%20Relaxation%20-%20(192%20Kbps).mp3` 
  },
  { 
    title: 'Deep Sleep - Piano and Rain', 
    url: `${R2_DOMAIN}/Deep%20Sleep%20-%20piano%20and%20rain.mp3` 
  },
  { 
    title: 'Rainy Afternoon in the Car', 
    url: `${R2_DOMAIN}/Rainy%20Afternoon%20in%20the%20Car.mp3` 
  },
  { 
    title: 'CAS - Late Night Playlist', 
    url: `${R2_DOMAIN}/CAS%20-%20Late%20Night%20Playlist.mp3` 
  }
];

  // --- CLOCK & GREETING ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning, sunshine';
    if (hour < 18) return 'Good Afternoon, my Love';
    return 'Good Night, baby';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- SOUNDSCAPE LOGIC ---
  useEffect(() => {
    // Initialize audio elements for soundscape
    Object.keys(soundUrls).forEach(key => {
      if (!soundscapeAudioRefs[key].current) {
        const audio = new Audio(soundUrls[key]);
        audio.loop = true;
        soundscapeAudioRefs[key].current = audio;
      }
    });

    return () => {
      Object.keys(soundscapeAudioRefs).forEach(key => {
        if (soundscapeAudioRefs[key].current) {
          soundscapeAudioRefs[key].current.pause();
        }
      });
    };
  }, []);

  // Update soundscape volumes and play state
  useEffect(() => {
    Object.keys(soundscapeAudioRefs).forEach(key => {
      const audio = soundscapeAudioRefs[key].current;
      if (audio) {
        const calculatedVol = (volumes.master / 100) * (volumes[key] / 100);
        
        if (soundscapePlaying) {
          // If it should play, fade/jump smoothly to calculated target volume
          if (audio.paused) {
            fadeIn(audio, Math.min(Math.max(calculatedVol, 0), 1), 800);
          } else {
            audio.volume = Math.min(Math.max(calculatedVol, 0), 1);
          }
        } else {
          // If it should stop, fade out smoothly
          if (!audio.paused) {
            fadeOutAndPause(audio, 800);
          }
        }
      }
    });
  }, [soundscapePlaying, volumes]);

  // --- MUSIC PLAYER LOGIC ---
// Update music player volume dynamically
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
    const audio = musicAudioRef.current;
    if (!audio) return;

    if (musicPlaying) {
      // Pause with fade out
      setMusicPlaying(false);
      fadeOutAndPause(audio, 800);
    } else {
      // Play with fade in (uses current state slider value mapped to 0-1 range)
      setMusicPlaying(true);
      const targetVol = Math.min(Math.max(musicVolume / 100, 0), 1); 
      fadeIn(audio, targetVol, 800);
      
      // Also ensure soundscape is fully shut down if someone manually kicks off music
      if (soundscapePlaying) {
        setSoundscapePlaying(false);
        Object.keys(soundscapeAudioRefs).forEach(key => {
          fadeOutAndPause(soundscapeAudioRefs[key].current);
        });
      }
    }
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % musicTracks.length);
    setMusicPlaying(true);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + musicTracks.length) % musicTracks.length);
    setMusicPlaying(true);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (musicAudioRef.current) {
      musicAudioRef.current.currentTime = val;
    }
  };

  // --- HANDLERS ---
  // Helper to fade an audio element's volume to 0 and pause it
  const fadeOutAndPause = (audioObj, duration = 1000) => {
    if (!audioObj) return;
    const steps = 20;
    const stepTime = duration / steps;
    const startVolume = audioObj.volume;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVol = startVolume * (1 - currentStep / steps);
      if (newVol <= 0 || audioObj.paused) {
        audioObj.volume = 0;
        audioObj.pause();
        clearInterval(fadeInterval);
      } else {
        audioObj.volume = newVol;
      }
    }, stepTime);
  };

  // Helper to fade in an audio element's volume from 0 to target volume
  const fadeIn = (audioObj, targetVolume, duration = 1000) => {
    if (!audioObj) return;
    audioObj.volume = 0;
    audioObj.play().catch(e => console.log("Play blocked:", e));

    const steps = 20;
    const stepTime = duration / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVol = targetVolume * (currentStep / steps);
      if (currentStep >= steps || audioObj.paused) {
        audioObj.volume = targetVolume;
        clearInterval(fadeInterval);
      } else {
        audioObj.volume = newVol;
      }
    }, stepTime);
  };

  // Handle Opening/Switching Modes (Mutually Exclusive)
  const handleOpenPlayer = (type) => {
    setActivePlayer(type);
    setIsDimmed(true);

    if (type === 'soundscape') {
      // If switching to soundscape, fade out music if it's playing
      if (musicPlaying) {
        setMusicPlaying(false);
        if (musicAudioRef.current) fadeOutAndPause(musicAudioRef.current);
      }
      setSoundscapePlaying(true);
    } else if (type === 'music') {
      // If switching to music, fade out soundscape stems if they are playing
      if (soundscapePlaying) {
        setSoundscapePlaying(false);
        Object.keys(soundscapeAudioRefs).forEach(key => {
          fadeOutAndPause(soundscapeAudioRefs[key].current);
        });
      }
      setMusicPlaying(true);
    }
  };

  const handleClosePlayer = (e) => {
    e.stopPropagation();
    setActivePlayer(null);
    setIsDimmed(false);
  };

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#070b19] text-white font-sans select-none flex flex-col justify-between">
      
      {/* BACKGROUND GRAPHICS (Vector Landscape Simulation) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Sky Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#03050d] via-[#0a0f24] to-[#141830]" />
        
        {/* Moon */}
        <div className="absolute top-12 right-20 w-16 h-16 rounded-full bg-gradient-to-tr from-[#ffe6a7] to-[#fff] shadow-[0_0_30px_rgba(255,230,167,0.5)]" />

        {/* Stars - Distributed across upper 70% of screen */}
        {[...Array(60)].map((_, i) => {
          // Pre-calculated deterministic values using index for pure render consistency
          const top = (i * 17) % 70; // Spreads across top 70%
          const left = (i * 23) % 100; // Spreads horizontally across 100%
          const size = i % 3 === 0 ? 'w-1.5 h-1.5' : i % 2 === 0 ? 'w-1 h-1' : 'w-0.5 h-0.5';
          const opacity = 0.4 + ((i % 5) * 0.12);
          const delay = (i % 4) * 0.7;

          return (
            <div
              key={i}
              className={`absolute bg-white rounded-full animate-pulse ${size}`}
              style={{
                top: `${top}%`,
                left: `${left}%`,
                opacity: opacity,
                animationDelay: `${delay}s`,
                animationDuration: `${2 + (i % 3)}s`
              }}
            />
          );
        })}

        {/* Distant Sharp Mountains */}
        <div 
          className="absolute bottom-44 left-0 right-0 h-64 bg-gradient-to-t from-[#1b2245] to-[#0e1327]" 
          style={{ clipPath: 'polygon(0% 100%, 15% 35%, 32% 80%, 50% 20%, 72% 75%, 88% 40%, 100% 100%)' }}
        />

        {/* Mid-ground Hills (Crisp Silhouettes) */}
        <div className="absolute bottom-24 -left-10 -right-10 h-48 bg-[#0a0d1d] rounded-t-[50%]" />
        <div className="absolute bottom-16 -left-20 -right-20 h-40 bg-[#060814] rounded-t-[40%]" />

        {/* Campfire Warm Glow (Softened, focused highlight at ground level) */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-20 bg-amber-500/25 blur-xl rounded-full" />
      </div>

      {/* GLOBAL DIM OVERLAY */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-500 z-10 pointer-events-none ${
          isDimmed ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
        onClick={() => {
          // Tap outside to collapse/toggle full UI view while keeping dim state or returning to ambient focus
          setActivePlayer(null);
          setIsDimmed(false);
        }}
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
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-medium tracking-tight text-indigo-100">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* INTERACTIVE CENTER SPACE (When active player is minimized or background focus) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6">
        {isDimmed && activePlayer === null && (
          <button 
            onClick={() => setIsDimmed(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs tracking-wider text-indigo-200 animate-pulse hover:bg-white/20 transition-all"
          >
            <ChevronUp size={16} /> Tap to Return
          </button>
        )}
      </div>

      {/* BOTTOM SECTION CONTAINER */}
      <div className="relative z-30 p-4 sm:p-6 pb-8 bg-[#0b1021]/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300">
        

        {/* EXPANDED MUSIC PLAYER PANEL */}
        {activePlayer === 'music' && (
          <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm">
                <Music size={18} />
                <span>Now Playing — {musicTracks[currentTrackIndex].title}</span>
              </div>
              <button onClick={handleClosePlayer} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
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
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
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
        )}

        {/* DEFAULT ACTION BUTTONS (Matching Reference Grid/List footprint) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <button 
            onClick={() => handleOpenPlayer('music')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              activePlayer === 'music' 
                ? 'bg-indigo-600/20 border-indigo-500/50 text-white' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-indigo-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                <Music size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Music Player</div>
                <div className="text-xs text-indigo-300/60">
                  {musicPlaying ? musicTracks[currentTrackIndex].title : 'Cloudflare R2 streams'}
                </div>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 font-medium">
              {musicPlaying ? 'Playing' : 'Listen'}
            </span>
          </button>
        </div>

      </div>

    </div>
  );
}