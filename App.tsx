import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dropzone } from './components/Dropzone';
import { ControlPanel } from './components/ControlPanel';
import { RetroCanvas } from './components/RetroCanvas';
import { RetroSettings, UploadedFile } from './types';
import { Image as ImageIcon, Video, MonitorPlay } from 'lucide-react';

const DEFAULT_SETTINGS: RetroSettings = {
  pixelSize: 6,
  threshold: 110,
  ditherAmount: 0.25,
  contrast: 1.1,
  colorDark: '#1a1a14', // Rich Black
  colorLight: '#e6e0d4', // Bone/Beige
  invert: false,
  gridLine: false,
};

const App: React.FC = () => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [settings, setSettings] = useState<RetroSettings>(DEFAULT_SETTINGS);
  const [canvasInstance, setCanvasInstance] = useState<HTMLCanvasElement | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileSelect = (selectedFile: File) => {
    // Revoke old url if exists
    if (file) {
      URL.revokeObjectURL(file.url);
    }
    // Reset recording state if changing file
    if (isRecording) stopRecording();

    const url = URL.createObjectURL(selectedFile);
    const type = selectedFile.type.startsWith('video') ? 'video' : 'image';
    
    setFile({
      url,
      type,
      name: selectedFile.name
    });
  };

  const handleDownloadImage = () => {
    if (!canvasInstance) return;
    const link = document.createElement('a');
    link.download = `retrobit-${Date.now()}.png`;
    link.href = canvasInstance.toDataURL('image/png');
    link.click();
  };

  const startRecording = () => {
    if (!canvasInstance) return;
    
    // 30 FPS capture
    const stream = canvasInstance.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
      ? 'video/webm; codecs=vp9' 
      : 'video/webm';

    try {
        const recorder = new MediaRecorder(stream, { 
            mimeType,
            videoBitsPerSecond: 5000000 // 5 Mbps for good quality
        });

        chunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `retrobit-video-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            chunksRef.current = [];
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    } catch (err) {
        console.error("Failed to start recording", err);
        alert("Failed to start recording. Your browser might not support this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (file) URL.revokeObjectURL(file.url);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-[#e6e0d4] overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[#333] flex items-center px-6 justify-between bg-[#111] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <MonitorPlay className="w-6 h-6 text-[#e6e0d4]" />
          <h1 className="text-xl font-bold tracking-widest font-mono">RETRO<span className="text-gray-500">BIT</span></h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
             <span className="hidden md:inline">v1.1.0</span>
             <a href="#" className="hover:text-[#e6e0d4] transition-colors">GITHUB</a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Canvas Area */}
        <div className="flex-1 bg-[#050505] relative flex flex-col">
          {file ? (
             <div className="flex-1 relative overflow-hidden p-4 md:p-8 flex items-center justify-center">
                 <div className={`
                    relative w-full h-full max-w-5xl max-h-[80vh] border transition-colors duration-300 bg-black shadow-2xl
                    ${isRecording ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'border-[#333]'}
                 `}>
                    <RetroCanvas 
                        file={file} 
                        settings={settings} 
                        onCanvasReady={setCanvasInstance}
                    />
                    
                    {/* Floating Info Badge */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="bg-black/80 backdrop-blur border border-[#333] px-3 py-1 rounded text-xs font-mono text-gray-400 flex items-center gap-2">
                            {file.type === 'video' ? <Video size={12}/> : <ImageIcon size={12}/>}
                            <span className="uppercase max-w-[150px] truncate">{file.name}</span>
                        </div>
                        {isRecording && (
                             <div className="bg-red-600/90 backdrop-blur border border-red-500 px-3 py-1 rounded text-xs font-mono text-white flex items-center gap-2 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                REC
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => {
                            if(isRecording) stopRecording();
                            setFile(null);
                        }}
                        className="absolute top-4 right-4 bg-black/80 hover:bg-red-900/50 backdrop-blur border border-[#333] px-3 py-1 rounded text-xs font-mono text-red-400 transition-colors"
                    >
                        CLOSE
                    </button>
                 </div>
             </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-xl">
                 <Dropzone onFileSelect={handleFileSelect} />
                 <div className="mt-8 text-center space-y-2">
                    <p className="text-sm font-mono text-gray-600">
                        Try uploading a high contrast photo or a silhouette video for best results.
                    </p>
                    <div className="flex justify-center gap-2">
                        <div className="w-2 h-2 bg-[#333]"></div>
                        <div className="w-2 h-2 bg-[#444]"></div>
                        <div className="w-2 h-2 bg-[#555]"></div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <ControlPanel 
            settings={settings} 
            setSettings={setSettings}
            onDownloadImage={handleDownloadImage}
            onToggleRecord={toggleRecording}
            isRecording={isRecording}
            fileType={file ? file.type : null}
        />
      </div>
    </div>
  );
};

export default App;
