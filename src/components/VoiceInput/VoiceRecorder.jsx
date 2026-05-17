import React, { useEffect, useRef, useState } from "react";
import { Loader, Mic } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../constants/api.js";

const VoiceRecorder = ({ onTranscript, onCommandParsed, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const manuallyStoppedRef = useRef(false);

  const clearRecordingTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const cleanupRecognition = () => {
    clearRecordingTimeout();
    recognitionRef.current = null;
    manuallyStoppedRef.current = false;
  };

  useEffect(() => {
    return () => {
      clearRecordingTimeout();
      if (recognitionRef.current) {
        manuallyStoppedRef.current = true;
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Speech recognition not supported in this browser. Try using Chrome or Edge.",
      );
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          initializeSpeechRecognition(SpeechRecognition);
        })
        .catch(() => {
          toast.error(
            "Microphone access denied. Please allow microphone access in your browser settings.",
          );
        });
    } else {
      initializeSpeechRecognition(SpeechRecognition);
    }
  };

  const initializeSpeechRecognition = (SpeechRecognition) => {
    clearRecordingTimeout();

    if (recognitionRef.current) {
      manuallyStoppedRef.current = true;
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    manuallyStoppedRef.current = false;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      toast.info("Listening... Speak your command now.");

      timeoutRef.current = window.setTimeout(() => {
        if (recognitionRef.current === recognition) {
          manuallyStoppedRef.current = true;
          recognition.stop();
          toast.info("Recording timed out. Try again.");
        }
      }, 8000);
    };

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      if (!transcript) {
        toast.warning("No speech detected. Please try again.");
        return;
      }

      console.log("Transcript:", transcript);

      if (onTranscript) {
        onTranscript(transcript);
      }

      // Send to backend for parsing
      if (onCommandParsed) {
        setIsRecording(false);
        setIsProcessing(true);
        try {
          const { data } = await axios.post("/voice-command", {
            voiceText: transcript,
          });

          if (data.success) {
            onCommandParsed(data);
          } else {
            toast.error(data.message || "Failed to process voice command");
          }
        } catch (error) {
          console.error("Voice command error:", error);
          const isBackendOffline =
            error?.code === "ERR_NETWORK" ||
            error?.message === "Network Error" ||
            !error?.response;
          const message = isBackendOffline
            ? "Backend is not running. Start the backend on port 5000 and try again."
            :
            error?.response?.data?.message ||
            error.message ||
            "Failed to process voice command";
          toast.error(message);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      clearRecordingTimeout();
      setIsRecording(false);
      setIsProcessing(false);

      if (event.error === "aborted" && manuallyStoppedRef.current) {
        cleanupRecognition();
        return;
      }

      let errorMessage = "Speech recognition failed";
      switch (event.error) {
        case "network":
          errorMessage =
            "Speech service unavailable. Try again later or use manual input.";
          break;
        case "not-allowed":
          errorMessage =
            "Microphone access denied. Please allow microphone access and try again.";
          break;
        case "no-speech":
          errorMessage = "No speech detected. Please speak clearly and try again.";
          break;
        case "aborted":
          errorMessage = "Speech recognition was cancelled.";
          break;
        case "audio-capture":
          errorMessage = "Microphone not found or not working.";
          break;
        case "service-not-allowed":
          errorMessage = "Speech recognition service not allowed.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      if (event.error === "no-speech") {
        toast.warning(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    };

    recognition.onend = () => {
      clearRecordingTimeout();
      setIsRecording(false);
      if (recognitionRef.current === recognition) {
        cleanupRecognition();
      }
    };

    try {
      recognition.start();
    } catch {
      cleanupRecognition();
      setIsRecording(false);
      toast.error("Could not start microphone. Please try again.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      manuallyStoppedRef.current = true;
      clearRecordingTimeout();
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
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md scale-105"
          : isProcessing
            ? "border-amber-300 bg-amber-50 text-amber-700 shadow-md"
            : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm"
      } ${disabled || isProcessing ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}`}
      title={
        isRecording
          ? "Stop recording"
          : isProcessing
            ? "Processing..."
            : "Speak your command"
      }
    >
      {isProcessing ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <Mic className="w-4 h-4 animate-pulse" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
      <span className="text-sm font-semibold">
        {isProcessing ? "Processing..." : isRecording ? "Listening..." : "Voice"}
      </span>
    </button>
  );
};

export default VoiceRecorder;
