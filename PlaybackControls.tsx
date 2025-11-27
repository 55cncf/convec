import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    onReset: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, onTogglePlay, onReset }) => {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 backdrop-blur border border-slate-600 px-6 py-3 rounded-2xl shadow-xl z-20">
            <button 
                onClick={onTogglePlay}
                className="flex items-center gap-2 text-white hover:text-blue-400 transition"
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                <span className="font-bold text-sm uppercase tracking-wide w-12 text-center">
                    {isPlaying ? 'Pause' : 'Play'}
                </span>
            </button>
            <div className="w-px h-6 bg-slate-600" />
            <button 
                onClick={onReset}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
                <RotateCcw size={20} />
                <span className="text-sm">Reset</span>
            </button>
        </div>
    );
};
