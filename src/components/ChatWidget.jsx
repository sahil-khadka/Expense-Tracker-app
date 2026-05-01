import React, { useEffect, useRef, useState } from "react";
import messiProfile from "../assets/image.png";
import aiRobot from "../assets/robo.webp";
import { Sparkles, MessageCircle } from "lucide-react";
import axios from "../constants/api.js";
import sendIcon from "../assets/send.png";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    // initial bot greeting (dummy)
    setMessages([
      {
        id: Date.now(),
        from: "ai",
        text: "Hello, how can I help you today?",
      },
    ]);
  }, []);

  useEffect(() => {
    // scroll to bottom when messages change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async (text) => {
    if (!text || sending) return;
    const userMsg = { id: Date.now() + 1, from: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // show thinking placeholder
    const thinkingId = Date.now() + 2;
    setMessages((m) => [...m, { id: thinkingId, from: "ai", text: "AI is thinking...", pending: true }]);
    setSending(true);

        try {
      // call backend using axios to /api/dashboardAI (per Postman doc)
      const payload = { message: text };
      let replyText = null;
      try {
        // send as POST so backend receives JSON body at req.body.message
        const resp = await axios.post("/dashboardAI", payload);
        const data = resp?.data;
        console.log("ChatWidget: dashboardAI response", data);
        // prefer the backend `data` field if present (your API returns {message, data})
        replyText = data?.data || data?.reply || data?.message || data?.answer || data?.output || data?.text || data?.result || null;
        // if data is an object, try nested fields
        if (replyText && typeof replyText === "object") {
          replyText = replyText.reply || replyText.message || replyText.text || JSON.stringify(replyText);
        }
        // choices (OpenAI style)
        if (!replyText && Array.isArray(data?.choices) && data.choices[0]) {
          replyText = data.choices[0].text || data.choices[0].message || data.choices[0].message?.content || null;
        }
        // nested choices
        if (!replyText && Array.isArray(data?.data?.choices) && data.data.choices[0]) {
          replyText = data.data.choices[0].text || data.data.choices[0].message || data.data.choices[0].message?.content || null;
        }
        // message.content arrays
        if (!replyText && data?.message?.content) {
          if (Array.isArray(data.message.content)) replyText = data.message.content.map(c => c.text || c).join(" ");
          else replyText = data.message.content.text || data.message.content;
        }
        // some providers use result.output_text or output
        if (!replyText && data?.result?.output_text) replyText = data.result.output_text;
        if (!replyText && data?.output_text) replyText = data.output_text;
        // fall back to stringified data if nothing found
        if (!replyText) replyText = typeof data === "string" ? data : JSON.stringify(data).slice(0, 2000);
      } catch (err) {
        // backend failed - log and surface server message when available
        console.error("ChatWidget: dashboardAI request failed", err && (err.response || err).data || err.message || err);
        const srv = err?.response?.data;
        if (srv) {
          // prefer `message` field or string body
          replyText = srv.message || (typeof srv === "string" ? srv : JSON.stringify(srv));
        } else {
          // no server response (network) - leave replyText null so fallback triggers
          replyText = null;
        }
      }

      if (!replyText) {
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 800));
        replyText = `Thanks — I received: "${text}"`;
      }

      // replace pending message with real reply
      setMessages((m) => m.map((mm) => (mm.id === thinkingId ? { id: Date.now() + 3, from: "ai", text: replyText } : mm)));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-widget" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 80 }}>
      <style>{`
        .hover-msg { display:flex; align-items:center; gap:8px; background:#fff; border-radius:20px; padding:6px 12px; box-shadow:0 4px 18px rgba(2,6,23,0.12); font-size:12px; font-weight:600; color:#374151; opacity:0; transform:translateY(6px); transition:opacity 180ms ease, transform 180ms ease; pointer-events:none }
        .chat-widget:hover .hover-msg { opacity:1; transform:translateY(0); pointer-events:auto }
      `}</style>
      <style>{`
        .chat-panel { width: 50vw; max-width: 92vw; height: 60vh; max-height: 92vh; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(2,6,23,0.25); overflow: hidden; display:flex; flex-direction:column; }
        .chat-header { background: linear-gradient(90deg,#7c3aed,#06b6d4); color:#fff; padding:12px 14px; display:flex; align-items:center; gap:10px; font-weight:700; }
        .chat-list { flex:1; overflow:auto; padding:18px; display:flex; flex-direction:column; gap:14px; background: linear-gradient(180deg,#f8faf9,#fff); }
        .msg-row { display:flex; gap:10px; align-items:flex-end; }
        .msg-row.user { justify-content:flex-end; }
        .msg-bubble { max-width:70%; padding:14px 16px; border-radius:12px; background:#f3f4f6; color:#111827; font-size:15px; line-height:1.4 }
        .msg-bubble.ai { background:#eefdf3; color:#064e3b; }
        .online-dot { width:10px; height:10px; border-radius:9999px; background:#16a34a; box-shadow: 0 0 0 6px rgba(16,185,129,0.10); display:inline-block }
        .online-row { display:flex; align-items:center; gap:8px }
        .avatar { width:36px; height:36px; border-radius:50%; overflow:hidden; box-shadow: 0 2px 8px rgba(2,6,23,0.12); }
        .input-row { padding:10px; display:flex; gap:8px; align-items:center; border-top:1px solid #eef2f7; background:#fff }
        .input-row input { flex:1; padding:10px 12px; border-radius:999px; border:1px solid #e6eef0; outline:none }
        .thinking { font-style:italic; opacity:0.85 }
      `}</style>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <img src={aiRobot} alt="AI" style={{ width:28, height:28, borderRadius:8, background:'#fff' }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Spend Wise Support Assistant</span>
              <div className="online-row">
                <span className="online-dot" aria-hidden="true" />
                <small style={{ opacity: 0.9, fontWeight: 500, fontSize: 12 }}>Online</small>
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color:'#fff', cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
          </div>

          <div className="chat-list" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`msg-row ${m.from === "user" ? "user" : "ai"}`}>
                {m.from === "ai" && (
                  <img src={aiRobot} className="avatar" alt="ai" style={{ objectFit: "cover", display: "block", width: 36, height: 36, borderRadius: 9999 }} />
                )}

                <div className={`msg-bubble ${m.from === "ai" ? "ai" : ""}`}>
                  {m.pending ? (
                    <span className="thinking">AI is thinking...</span>
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                  )}
                </div>

                {m.from === "user" && (
                  <img src={messiProfile} className="avatar" alt="you" style={{ objectFit: "cover", display: "block", width: 36, height: 36, borderRadius: 9999 }} />
                )}
              </div>
            ))}
          </div>

          <div className="input-row">
            <input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(input.trim());
                }
              }}
            />
            <button
              aria-label="Send message"
              onClick={() => sendMessage(input.trim())}
              disabled={!input.trim() || sending}
              style={{
                background: "linear-gradient(135deg,#16a34a,#22c55e)",
                border: "none",
                borderRadius: 9999,
                height: 40,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                opacity: input.trim() && !sending ? 1 : 0.6,
              }}
            >
              <img src={sendIcon} alt="" style={{ width: 18, height: 18, display: "block" }} />
              <span style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}>Send</span>
            </button>
          </div>
        </div>
      )}

      {/* floating button + hover message */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {open && <div style={{ height: 8 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="hover-msg"><Sparkles size={13} color="#16a34a" /> We are here to help!</div>
          <button
            aria-label="Open chat"
            onClick={() => setOpen((s) => !s)}
            style={{
              background: "linear-gradient(135deg,#16a34a,#22c55e)",
              border: "none",
              borderRadius: "50%",
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 8px 28px rgba(16,185,129,0.28)",
            }}
          >
            <MessageCircle size={26} color="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
