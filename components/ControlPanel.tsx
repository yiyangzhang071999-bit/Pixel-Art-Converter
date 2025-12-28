import React, { useState, useEffect } from 'react';
import { RetroSettings, FileType } from '../types';
import { Settings, Grid, Droplet, Sun, Moon, Zap, Pipette, Camera, Video, Square, Hash } from 'lucide-react';

interface ControlPanelProps {
  settings: RetroSettings;
  setSettings: React.Dispatch<React.SetStateAction<RetroSettings>>;
  onDownloadImage: () => void;
  onToggleRecord: () => void;
  isRecording: boolean;
  fileType: FileType;
}

// 经典复古配色预设
const COLOR_PRESETS = [
  { name: 'Classic', dark: '#1a1a14', light: '#e6e0d4' },
  { name: 'Gameboy', dark: '#0f380f', light: '#9bbc0f' },
  { name: 'Terminal', dark: '#001a00', light: '#00ff00' },
  { name: 'Mac', dark: '#000000', light: '#ffffff' },
  { name: 'Blueprint', dark: '#001540', light: '#e0f0ff' },
  { name: 'Sunset', dark: '#2d0000', light: '#ffaa55' },
];

const ColorPickerInput = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
}) => {
  const [localHex, setLocalHex] = useState(value);

  useEffect(() => {
    setLocalHex(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalHex(newVal);
    // Basic Hex validation
    if (/^#[0-9A-F]{6}$/i.test(newVal)) {
      onChange(newVal);
    }
  };

  const handleEyeDropper = async () => {
    if (!window.EyeDropper) return;
    try {
      const ed = new window.EyeDropper();
      const result = await ed.open();
      onChange(result.sRGBHex);
    } catch (e) {
      console.log('Eyedropper cancelled');
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-500 font-mono uppercase">{label}</span>
      <div className="flex items-center gap-2 bg-[#222] p-1.5 rounded border border-[#333] group focus-within:border-[#e6e0d4] transition-colors">
        
        {/* Color Swatch / Native Picker */}
        <div className="relative w-8 h-8 flex-shrink-0">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div 
                className="w-full h-full rounded border border-[#444]" 
                style={{ backgroundColor: value }}
            />
        </div>

        {/* Hex Input */}
        <div className="flex items-center flex-1 min-w-0 relative">
            <Hash size={12} className="text-gray-500 absolute left-0" />
            <input 
                type="text" 
                value={localHex.replace('#', '')}
                onChange={(e) => handleHexChange({ ...e, target: { ...e.target, value: '#' + e.target.value } })}
                className="w-full bg-transparent border-none text-xs font-mono text-[#e6e0d4] focus:ring-0 pl-4 py-1 uppercase"
                maxLength={6}
            />
        </div>

        {/* Eyedropper Button */}
        {window.EyeDropper && (
            <button 
                onClick={handleEyeDropper}
                className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-[#e6e0d4] transition-colors"
                title="Pick color from screen"
            >
                <Pipette size={14} />
            </button>
        )}
      </div>
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  setSettings,
  onDownloadImage,
  onToggleRecord,
  isRecording,
  fileType,
}) => {
  const handleChange = (key: keyof RetroSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (dark: string, light: string) => {
    setSettings(prev => ({ ...prev, colorDark: dark, colorLight: light }));
  };

  return (
    <div className="w-full md:w-80 bg-[#111] border-l border-[#333] p-6 flex flex-col gap-6 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-800">
      <div className="flex items-center gap-2 mb-2 pb-4 border-b border-[#333]">
        <Settings className="w-5 h-5 text-[#e6e0d4]" />
        <h2 className="text-xl font-bold text-[#e6e0d4] tracking-tighter">CONTROLS</h2>
      </div>

      {/* Pixelation */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-sm text-gray-400 font-mono flex items-center gap-2">
                <Grid size={14} /> Resolution
            </label>
            <span className="text-xs text-[#e6e0d4] font-mono bg-[#222] px-2 py-1 rounded">
                1/{settings.pixelSize}
            </span>
        </div>
        <input
          type="range"
          min="1"
          max="24"
          step="1"
          value={settings.pixelSize}
          onChange={(e) => handleChange('pixelSize', Number(e.target.value))}
          className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#e6e0d4]"
        />
      </div>

      {/* Threshold */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-sm text-gray-400 font-mono flex items-center gap-2">
                <Sun size={14} /> Threshold
            </label>
            <span className="text-xs text-[#e6e0d4] font-mono bg-[#222] px-2 py-1 rounded">
                {settings.threshold}
            </span>
        </div>
        <input
          type="range"
          min="0"
          max="255"
          step="1"
          value={settings.threshold}
          onChange={(e) => handleChange('threshold', Number(e.target.value))}
          className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#e6e0d4]"
        />
      </div>

      {/* Contrast */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-sm text-gray-400 font-mono flex items-center gap-2">
                <Moon size={14} /> Contrast
            </label>
            <span className="text-xs text-[#e6e0d4] font-mono bg-[#222] px-2 py-1 rounded">
                {settings.contrast.toFixed(1)}x
            </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={settings.contrast}
          onChange={(e) => handleChange('contrast', Number(e.target.value))}
          className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#e6e0d4]"
        />
      </div>

      {/* Dithering */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-sm text-gray-400 font-mono flex items-center gap-2">
                <Zap size={14} /> Dither
            </label>
            <span className="text-xs text-[#e6e0d4] font-mono bg-[#222] px-2 py-1 rounded">
                {Math.round(settings.ditherAmount * 100)}%
            </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.ditherAmount}
          onChange={(e) => handleChange('ditherAmount', Number(e.target.value))}
          className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#e6e0d4]"
        />
      </div>

      {/* Colors */}
      <div className="space-y-4 border-t border-[#333] pt-4">
        <label className="text-sm text-gray-400 font-mono flex items-center gap-2 mb-2">
            <Droplet size={14} /> Palette
        </label>

        {/* Presets Grid */}
        <div className="grid grid-cols-6 gap-2 mb-2">
            {COLOR_PRESETS.map((preset) => (
                <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.dark, preset.light)}
                    className="w-full aspect-square rounded border border-[#444] hover:border-[#fff] transition-all relative group overflow-hidden"
                    title={preset.name}
                >
                    <div className="absolute inset-0 flex">
                        <div className="w-1/2 h-full" style={{ backgroundColor: preset.dark }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: preset.light }} />
                    </div>
                </button>
            ))}
        </div>
        
        {/* Advanced Pickers */}
        <div className="grid grid-cols-2 gap-3">
            <ColorPickerInput 
                label="Dark" 
                value={settings.colorDark} 
                onChange={(val) => handleChange('colorDark', val)} 
            />
            <ColorPickerInput 
                label="Light" 
                value={settings.colorLight} 
                onChange={(val) => handleChange('colorLight', val)} 
            />
        </div>

        <div className="flex items-center gap-3 pt-2">
             <label className="flex items-center gap-2 text-sm text-gray-300 font-mono cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={settings.invert}
                    onChange={(e) => handleChange('invert', e.target.checked)}
                    className="w-4 h-4 rounded bg-[#333] border-gray-600 accent-[#e6e0d4]"
                />
                Invert
            </label>
             <label className="flex items-center gap-2 text-sm text-gray-300 font-mono cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={settings.gridLine}
                    onChange={(e) => handleChange('gridLine', e.target.checked)}
                    className="w-4 h-4 rounded bg-[#333] border-gray-600 accent-[#e6e0d4]"
                />
                Scanlines
            </label>
        </div>
      </div>

      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button
            onClick={onDownloadImage}
            className="w-full py-3 bg-[#e6e0d4] text-[#1a1a1a] font-bold font-mono text-sm uppercase tracking-wider hover:bg-white transition-colors rounded shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-2"
        >
            <Camera size={16} /> Capture Image
        </button>

        {fileType === 'video' && (
            <button
                onClick={onToggleRecord}
                className={`
                    w-full py-3 font-bold font-mono text-sm uppercase tracking-wider transition-all rounded 
                    flex items-center justify-center gap-2
                    ${isRecording 
                        ? 'bg-red-600 text-white animate-pulse shadow-[0px_0px_10px_rgba(220,38,38,0.5)]' 
                        : 'bg-[#222] text-[#e6e0d4] border border-[#333] hover:bg-[#333] hover:border-[#666]'
                    }
                `}
            >
                {isRecording ? (
                    <><Square size={16} fill="currentColor" /> Stop Recording</>
                ) : (
                    <><Video size={16} /> Record Video</>
                )}
            </button>
        )}
      </div>
    </div>
  );
};
