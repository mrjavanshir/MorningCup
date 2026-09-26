import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, KeyRound, LogOut, RotateCcw, Shuffle } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import { changePassword, resetPassword, signIn, signOut } from "./auth.js";

const inputStyle = (bad) => ({
  width: "100%",
  background: TOKENS.bgDeep,
  border: `1px solid ${bad ? "#C4184F" : TOKENS.line}`,
  borderRadius: 10,
  color: TOKENS.cream,
  fontFamily: "'Manrope', sans-serif",
  fontSize: 14,
  padding: "11px 12px",
});

const cardStyle = {
  width: "100%",
  background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
  border: `1px solid ${TOKENS.line}`,
  borderRadius: 16,
  padding: "20px 18px",
};

/**
 * The whole app sits behind this: nothing else renders until it succeeds.
 * `title` is left out on the birthday card's link, which never names the app.
 */
export function SignIn({ onSignedIn, title = "Nook" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !username.trim() || !password) return;
    setBusy(true);
    setError(null);
    const { session, error: message } = await signIn(username.trim(), password);
    setBusy(false);
    if (session) onSignedIn(session);
    else {
      setError(message);
      setPassword("");
    }
  };

  return (
    <div
      style={{ background: TOKENS.bgDeep, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}
      className="w-full flex flex-col items-center justify-center px-4 py-8"
    >
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col items-center">
        {title && (
          <h1 style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26 }} className="mb-1">
            {title}
          </h1>
        )}
        <p style={{ color: TOKENS.muted, fontSize: 13.5 }} className="mb-7">
          Sign in to continue.
        </p>
        <div style={cardStyle} className="flex flex-col gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            style={inputStyle(!!error)}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            style={inputStyle(!!error)}
          />
          {error && <p style={{ color: "#E07A8F", fontSize: 12.5 }}>{error}</p>}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={busy}
            style={{
              height: 44,
              borderRadius: 9999,
              background: TOKENS.gold,
              color: TOKENS.bgDeep,
              fontWeight: 700,
              fontSize: 14,
              opacity: busy ? 0.6 : 1,
              marginTop: 4,
            }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

const ACCOUNTS = [
  { username: "javanshir", name: "Javanshir" },
  { username: "ganira", name: "Ganira" },
];

// No look-alike characters, so it can be read out or typed from a message.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function generatePassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = [...bytes].map((b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

/**
 * Admin only: set a new password on either account without knowing the old
 * one — the way back in after a forgotten password. The password is shown in
 * plain text on purpose: for Ganira's account it has to be passed on to her.
 */
function ResetPanel({ user, onClose }) {
  const [username, setUsername] = useState("ganira");
  const [next, setNext] = useState(generatePassword);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // { name, password }
  const [copied, setCopied] = useState(false);
  const target = ACCOUNTS.find((a) => a.username === username);
  const own = target.name === user.name;

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (next.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    setError(null);
    const message = await resetPassword(username, next);
    setBusy(false);
    if (message) return setError(message);
    setDone({ name: target.name, password: next, own });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(done.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — it is on screen to copy by hand */
    }
  };

  if (done) {
    return (
      <div style={{ ...cardStyle, padding: "14px 16px" }} className="flex flex-col gap-2.5 mb-3">
        <p style={{ color: TOKENS.cream, fontSize: 13 }}>
          {done.own ? "Your password is reset." : `${done.name}'s password is reset.`}
        </p>
        <div className="flex items-center gap-2">
          <code style={{ ...inputStyle(false), fontFamily: "ui-monospace, monospace", flex: 1, userSelect: "all" }}>{done.password}</code>
          <button type="button" onClick={copy} aria-label="Copy the new password" style={{ color: TOKENS.gold, padding: 8 }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <p style={{ color: TOKENS.muted, fontSize: 11.5 }}>
          {done.own
            ? "Your other devices are signed out; this one stays in."
            : `${done.name} is signed out on every device. Send her this password so she can sign in again.`}
        </p>
        <button type="button" onClick={onClose} style={{ color: TOKENS.gold, fontSize: 12.5, fontWeight: 700, alignSelf: "flex-start" }}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} style={{ ...cardStyle, padding: "14px 16px" }} className="flex flex-col gap-2.5 mb-3">
      <p style={{ color: TOKENS.muted, fontSize: 11.5 }}>Set a new password without the old one.</p>
      <div className="flex gap-1.5">
        {ACCOUNTS.map((a) => (
          <button
            key={a.username}
            type="button"
            onClick={() => setUsername(a.username)}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${username === a.username ? alpha(TOKENS.gold, "66") : TOKENS.line}`,
              color: username === a.username ? TOKENS.gold : TOKENS.muted,
            }}
          >
            {a.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          style={{ ...inputStyle(!!error), fontFamily: "ui-monospace, monospace" }}
        />
        <button type="button" onClick={() => setNext(generatePassword())} aria-label="Generate a password" style={{ color: TOKENS.muted, padding: 8 }}>
          <Shuffle size={15} />
        </button>
      </div>
      {own && (
        <p style={{ color: TOKENS.muted, fontSize: 11 }}>Your other devices will be signed out; this one stays in.</p>
      )}
      {!own && (
        <p style={{ color: TOKENS.muted, fontSize: 11 }}>{target.name} will be signed out on every device until she uses the new one.</p>
      )}
      {error && <p style={{ color: "#E07A8F", fontSize: 12 }}>{error}</p>}
      <div className="flex items-center gap-4 mt-1">
        <button type="submit" disabled={busy} style={{ color: TOKENS.gold, fontSize: 12.5, fontWeight: 700 }}>
          {busy ? "Saving…" : `Reset ${target.name}'s password`}
        </button>
        <button type="button" onClick={onClose} style={{ color: TOKENS.muted, fontSize: 12.5 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Who is signed in, with sign-out and a password change, under the hub. */
export function AccountFooter({ user, onSignedOut }) {
  const [changing, setChanging] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  const close = () => {
    setChanging(false);
    setCurrent("");
    setNext("");
    setAgain("");
  };

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (next !== again) return setMessage({ bad: true, text: "The two new passwords do not match." });
    if (next.length < 8) return setMessage({ bad: true, text: "Use at least 8 characters." });
    setBusy(true);
    const error = await changePassword(current, next);
    setBusy(false);
    if (error) return setMessage({ bad: true, text: error });
    close();
    setMessage({ bad: false, text: "Password changed. Your other devices are signed out." });
  };

  const leave = async () => {
    await signOut();
    onSignedOut();
  };

  return (
    <div className="w-full flex flex-col items-center mt-8">
      {changing && (
        <form onSubmit={save} style={{ ...cardStyle, padding: "14px 16px" }} className="flex flex-col gap-2.5 mb-3">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" autoComplete="current-password" style={inputStyle(false)} />
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password" autoComplete="new-password" style={inputStyle(false)} />
          <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} placeholder="New password again" autoComplete="new-password" style={inputStyle(false)} />
          <div className="flex items-center gap-4 mt-1">
            <button type="submit" disabled={busy} style={{ color: TOKENS.gold, fontSize: 12.5, fontWeight: 700 }}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={close} style={{ color: TOKENS.muted, fontSize: 12.5 }}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {resetting && <ResetPanel user={user} onClose={() => setResetting(false)} />}
      {message && (
        <p style={{ color: message.bad ? "#E07A8F" : alpha(TOKENS.gold, "CC"), fontSize: 11.5, textAlign: "center" }} className="mb-2">
          {message.text}
        </p>
      )}
      <div className="flex items-center gap-4" style={{ fontSize: 11, color: TOKENS.muted }}>
        <span>Signed in as {user.name}</span>
        {!changing && (
          <button onClick={() => { setChanging(true); setResetting(false); setMessage(null); }} style={{ color: TOKENS.muted }} className="flex items-center gap-1">
            <KeyRound size={11} /> Password
          </button>
        )}
        {user.admin && !resetting && (
          <button onClick={() => { setResetting(true); close(); setMessage(null); }} style={{ color: TOKENS.muted }} className="flex items-center gap-1">
            <RotateCcw size={11} /> Reset
          </button>
        )}
        <button onClick={leave} style={{ color: TOKENS.muted }} className="flex items-center gap-1">
          <LogOut size={11} /> Sign out
        </button>
      </div>
    </div>
  );
}
