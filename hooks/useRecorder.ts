import { getActiveRecordingProfile } from './recordingConfig';
import { useState, useRef, useEffect, useCallback } from 'react';
import { AppSettings } from '../App';

interface UseRecorderProps {
    onRecordingComplete: (blobUrl: string, blob: Blob) => void;
    settings: AppSettings;
}

export const useRecorder = ({ onRecordingComplete, settings }: UseRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Timer logic
    useEffect(() => {
        if (isRecording && !isPaused) {
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 1800) { // 30 mins hard limit
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording, isPaused]);

    const stopStreamTracks = (stream: MediaStream | null) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const startRecording = async () => {
        setError(null);
        setRecordingTime(0);
        chunksRef.current = [];

        try {
            const cfg = getActiveRecordingProfile().recording;

            // 1. Get Screen Stream
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: cfg.width,
                    height: cfg.height,
                    frameRate: cfg.frameRate
                },
                audio: settings.includeSystemAudio
            });

            // 2. Prepare Final Stream
            let finalStream = screenStream;
            let audioContext: AudioContext | null = null;
            let combinedStream: MediaStream | null = null;

            // 3. Audio Mixing
            if (settings.includeMic || settings.includeSystemAudio) {
                try {
                    audioContext = new AudioContext();
                    audioContextRef.current = audioContext;
                    const destination = audioContext.createMediaStreamDestination();
                    
                    // Mic
                    if (settings.includeMic) {
                        const micStream = await navigator.mediaDevices.getUserMedia({
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true
                            }
                        });
                         if (micStream.getAudioTracks().length > 0) {
                            const micSource = audioContext.createMediaStreamSource(micStream);
                            micSource.connect(destination);
                            
                            // Visualizer source
                            const analyser = audioContext.createAnalyser();
                            analyser.fftSize = 64;
                            analyser.smoothingTimeConstant = 0.8;
                            micSource.connect(analyser);
                            setAnalyserNode(analyser);
                        }
                    }

                    // System Audio
                    if (settings.includeSystemAudio && screenStream.getAudioTracks().length > 0) {
                        const systemSource = audioContext.createMediaStreamSource(screenStream);
                        systemSource.connect(destination);
                    }

                    // Combine
                    combinedStream = new MediaStream([
                        ...screenStream.getVideoTracks(),
                        ...destination.stream.getAudioTracks()
                    ]);

                    finalStream = combinedStream;

                } catch (micErr) {
                    console.warn("Audio setup failed:", micErr);
                }
            }

            screenStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            streamRef.current = finalStream;

            // 4. MimeType strategy: Prioritize VP9/Opus for best quality WebM, fallback to VP8
            const mimeType = [
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm"
            ].find(type => MediaRecorder.isTypeSupported(type)) || "";

            const recorder = new MediaRecorder(finalStream, {
                mimeType,
                videoBitsPerSecond: cfg.videoBitsPerSecond
            });

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
                const url = URL.createObjectURL(blob);
                onRecordingComplete(url, blob);
                
                stopStreamTracks(streamRef.current);
                stopStreamTracks(screenStream);
                
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
                setIsRecording(false);
                setIsPaused(false);
                setAnalyserNode(null);
            };

            mediaRecorderRef.current = recorder;
            recorder.start(1000);
            setIsRecording(true);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to start");
            setIsRecording(false);
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;
        if (isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        } else {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    return {
        startRecording,
        stopRecording,
        togglePause,
        isRecording,
        isPaused,
        recordingTime,
        error,
        analyserNode
    };
};