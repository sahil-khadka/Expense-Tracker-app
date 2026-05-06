import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../../constants/api.js';

const VoiceRecorder = ({ onTranscript, onCommandParsed, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser. Try using Chrome or Edge.');
      return;
    }

    // Check for microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          initializeSpeechRecognition();
        })
        .catch(() => {
          toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
        });
    } else {
      // Fallback for older browsers
      initializeSpeechRecognition();
    }
  };

  const initializeSpeechRecognition = () => {
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US'; // Set to English for better compatibility

    // Add timeout to prevent hanging
    setTimeout(() => {
      if (isRecording) {
        stopRecording();
        toast.info('Recording timed out. Try again.');
      }
    }, 8000); // 8 second timeout

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      toast.info('🎤 Listening... Speak your command now (8s timeout)');
    };

    recognitionRef.current.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Transcript:', transcript);

      if (onTranscript) {
        onTranscript(transcript);
      }

      // Send to backend for parsing
      if (onCommandParsed) {
        setIsProcessing(true);
        try {
          console.log("before")
          const { data } = await axios.post('/voice-command', {
            voiceText: transcript,
          });
console.log("after")
console.log(data)
          if (data.success) {
            toast.success('Voice command processed successfully!');
            onCommandParsed(data);
          } else {
            toast.error(data.message || 'Failed to process voice command');
          }
        } catch (error) {
          console.error('Voice command error:', error);
          const message =
            error?.response?.data?.message ||
            error.message ||
            'Failed to process voice command';
          toast.error(message);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsProcessing(false);

      let errorMessage = 'Speech recognition failed';
      switch (event.error) {
        case 'network':
          errorMessage = 'Speech service unavailable: Google\'s speech recognition servers may be down or blocked. Try again later or use manual input.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access and try again';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly and try again';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was cancelled';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or not working';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      toast.error(errorMessage);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${
        isRecording
          ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md scale-105'
          : isProcessing
          ? 'border-amber-300 bg-amber-50 text-amber-700 shadow-md'
          : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm'
      } ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}`}
      title={isRecording ? 'Stop recording' : isProcessing ? 'Processing...' : 'Speak your command'}
    >
      {isProcessing ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <Mic className="w-4 h-4 animate-pulse" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
      <span className="text-sm font-semibold">
        {isProcessing ? 'Processing...' : isRecording ? 'Listening...' : 'Voice'}
      </span>
    </button>
  );
};

export default VoiceRecorder;