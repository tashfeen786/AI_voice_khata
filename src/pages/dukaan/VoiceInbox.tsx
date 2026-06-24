import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/api-client";

export default function VoiceInbox() {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Send a voice note or record to update ledger." }
  ]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      // Request higher quality audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });
      streamRef.current = stream;
      
      // Use higher bitrate for MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000   // 128 kbps (much better than default)
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        console.log("Recorded blob size:", audioBlob.size);
        if (audioBlob.size < 5000) {   // increased minimum size for quality
          toast.error("Recording too short or low quality. Please speak clearly for at least 3 seconds.");
          streamRef.current?.getTracks().forEach(track => track.stop());
          return;
        }
        await uploadAudio(audioBlob);
        streamRef.current?.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // collect data in 1-second chunks to avoid memory issues
      setRecording(true);
      toast.info("Recording... tap again to stop (speak clearly)");
    } catch (err) {
      console.error(err);
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");
    try {
      const res = await apiClient.post("/api/voice/upload", formData, {
        headers: { "Content-Type": undefined }
      });
      const data = res.data;
      if (data.status === "success") {
        setMessages(prev => [
          ...prev,
          { role: "user", content: `🎤 Voice note sent` },
          { role: "assistant", content: `✓ Recorded\nCustomer: ${data.customer}\nDebit: Rs ${data.debit}\nCredit: Rs ${data.credit}\nBalance: Rs ${data.balance}` }
        ]);
        toast.success("Ledger updated");
      } else {
        toast.error(data.message || "Failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("Selected file size:", file.size);
    if (file.size < 1000) {
      toast.error("File too small or empty.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiClient.post("/api/voice/upload", formData, {
        headers: { "Content-Type": undefined }
      });
      const data = res.data;
      if (data.status === "success") {
        setMessages(prev => [
          ...prev,
          { role: "user", content: `📁 Uploaded: ${file.name}` },
          { role: "assistant", content: `✓ Recorded\nCustomer: ${data.customer}\nDebit: Rs ${data.debit}\nCredit: Rs ${data.credit}\nBalance: Rs ${data.balance}` }
        ]);
        toast.success("Ledger updated");
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Voice Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">Send voice notes to update ledger</p>
      </div>

      <Card className="rounded-2xl shadow-soft overflow-hidden flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {msg.role === "assistant" && <MessageCircle className="inline h-4 w-4 mr-1" />}
                <span className="whitespace-pre-wrap text-sm">{msg.content}</span>
              </div>
            </div>
          ))}
          {uploading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl px-4 py-2 text-sm"><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Processing...</div>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex items-center gap-3">
          <Button
            onClick={recording ? stopRecording : startRecording}
            variant={recording ? "destructive" : "default"}
            className="rounded-full h-12 w-12 p-0"
          >
            <Mic className="h-5 w-5" />
          </Button>
          <label className="flex-1">
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="audio-upload" />
            <Button variant="outline" asChild className="w-full rounded-xl">
              <span onClick={() => document.getElementById("audio-upload")?.click()}>📁 Choose audio file</span>
            </Button>
          </label>
          {recording && <span className="text-xs text-danger animate-pulse">Recording (high quality)...</span>}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Tip: Speak clearly for at least 3 seconds. For best results, use "Choose audio file" with a high‑quality MP3.
      </p>
    </div>
  );
}