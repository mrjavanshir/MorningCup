import React, { useEffect, useState } from "react";
import { BookMarked, BookOpen, CircleDot, Sparkle, Sprout, ArrowUpFromLine, Cake, Check, Eraser, Flower2,Gift, Link2, Moon, NotebookPen, Scale, Scroll, Stamp, Sun, Sunrise, Sunset } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import SunApp from "./SunApp.jsx";
import DaybreakApp from "./DaybreakApp.jsx";
import AgreementApp from "./AgreementApp.jsx";
import ThisOrThatApp from "./ThisOrThatApp.jsx";
import SurpriseBoxApp from "./SurpriseBoxApp.jsx";
import VerseJarApp from "./VerseJarApp.jsx";
import CloseDayApp from "./CloseDayApp.jsx";
import ThreeThingsApp from "./ThreeThingsApp.jsx";
import HighlightsApp from "./HighlightsApp.jsx";
import NamesApp from "./NamesApp.jsx";
import SharedSettings from "./SharedSettings.jsx";
import KhatmApp from "./KhatmApp.jsx";
import Quran from "./Quran.jsx";
import GardenApp, { GardenWidget } from "./GardenApp.jsx";
import ZikrApp from "./ZikrApp.jsx";
import BirthdayGiftCard from "./BirthdayGiftCard.jsx";
import RosesGift from "./RosesGift.jsx";
import { cachedViews, fetchViews, readAsUser, setAsUser } from "./owner.js";
import { readSession, refreshUser, SIGNED_OUT_EVENT } from "./auth.js";
import { AccountFooter, ChooseNewPassword, SignIn } from "./Account.jsx";
import { applyTheme, currentTheme } from "./theme.js";

// `shared` controls only what the hub LISTS. Every app stays reachable at its
// own /apps/<id> URL whatever this says, so links already sent keep working —
// and so do the older /games/<id> ones (see parseRoute).
// `bare` drops the app header on that app's page, for the ones you sit inside
// for a while rather than glance at — the greeting is just a band of dead space
// above a long read.
const APPS = [
  { id: "sun", icon: Sunrise, title: "Sunrise", desc: "Tap to raise it.", shared: true },
  { id: "daybreak", icon: ArrowUpFromLine, title: "Daybreak", desc: "Drag to bring up the sun.", shared: true },
  { id: "agreement", icon: Stamp, title: "Agreement", desc: "Stamp it to make it official.", shared: true },
  { id: "this-or-that", icon: Scale, title: "This or That", desc: "Pick a side, compare picks.", shared: true },
  { id: "surprise", icon: Gift, title: "Surprise Box", desc: "No idea what's inside.", shared: true },
  { id: "jar", icon: Scroll, title: "Verses Jar", desc: "Read me when…", shared: true },
  { id: "names", icon: Sparkle, title: "The 99 Names", desc: "One at a time, or all of them.", shared: true, bare: true },
  { id: "khatm", icon: BookOpen, title: "Khatm Together", desc: "Thirty juz, between the two of you.", shared: true },
  { id: "quran", icon: BookMarked, title: "Read the Qur'an", desc: "All 114, with where you each are.", shared: true, bare: true },
  { id: "zikr", icon: CircleDot, title: "Zikr", desc: "A tasbih — 33 a day waters the garden.", shared: true },
  { id: "garden", icon: Sprout, title: "Our Garden", desc: "Grows when either of you reads.", shared: true },
  { id: "birthday", icon: Cake, title: "Birthday Card", desc: "Open the box.", shared: false },
  { id: "roses", icon: Flower2, title: "Roses", desc: "Tap the rose, open the note.", shared: false },
  { id: "close-day", icon: Eraser, title: "Close the Day", desc: "Dump it out, watch it go.", night: true, shared: true },
  { id: "three-things", icon: NotebookPen, title: "Three Good Things", desc: "Log what went well today.", night: true, shared: true },
  { id: "highlights", icon: Sunset, title: "Highlights", desc: "Both share the best bit.", night: true, shared: true },
];

function parseRoute() {
  const path = window.location.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);
  // Links sent before the rename point at /games/…; open them, and show the
  // current address so a copy of it is the new one.
  if (segments[0] === "games") {
    segments[0] = "apps";
    const url = `${import.meta.env.BASE_URL}${segments.join("/")}${window.location.search}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }
  if (segments.length === 1 && segments[0] === "sun") return { view: "app", id: "sun" };
  if (segments[0] !== "apps") return { view: "blank" };
  if (segments.length === 1) return { view: "hub" };
  if (segments.length === 2 && APPS.some((g) => g.id === segments[1])) return { view: "app", id: segments[1] };
  return { view: "blank" };
}

function appLink(id) {
  return `${window.location.origin}${import.meta.env.BASE_URL}apps/${id}`;
}

// Opt-in via ?after=22 — the page refuses to open before that hour.
// Hours before 4am still count as "night", so a 1am visit is not locked.
function nightLockHour() {
  const raw = new URLSearchParams(window.location.search).get("after");
  if (!raw || !/^\d{1,2}$/.test(raw)) return null;
  const h = Number(raw);
  if (h > 23) return null;
  const now = new Date().getHours();
  return now >= 4 && now < h ? h : null;
}

/**
 * The roses page is a gift sent as a bare link: it opens without signing in,
 * and is rendered on its own, before any of the app's session, hub or
 * navigation exists — so there is nothing in it that leads anywhere else.
 */
export default function App() {
  const [route] = useState(parseRoute);
  if (route.view === "app" && route.id === "roses") return <RosesGift />;
  return <SignedInApp />;
}

function SignedInApp() {
  const [route, setRoute] = useState(parseRoute);
  const [lockHour] = useState(nightLockHour);
  const [copiedId, setCopiedId] = useState(null);
  // Null until someone signs in; nothing but the sign-in screen renders then.
  const [session, setSession] = useState(readSession);
  // Kept in memory only, and only until a forced password change uses it.
  const [givenPassword, setGivenPassword] = useState(null);
  // Remembered, so an admin can simply use the app as a user day to day rather
  // than only peeking. It never changes whose data is written — the server
  // files everything under whoever is signed in.
  const [viewAsUser, setViewAsUserState] = useState(readAsUser);
  const toggleAsUser = (on) => {
    setAsUser(on);
    setViewAsUserState(on);
  };
  const user = session?.user;
  const isAdmin = !!user?.admin;
  const asAdmin = isAdmin && !viewAsUser;
  const [showSettings, setShowSettings] = useState(false);
  // Start from whatever this device last saw so the list does not flicker or
  // sit empty offline, then refresh from the Worker.
  const [views, setViews] = useState(cachedViews);
  const [theme, setTheme] = useState(currentTheme);

  // Applied on mount too, not only on change: the stored choice has to reach
  // <html> before anything paints.
  useEffect(() => applyTheme(theme), [theme]);

  // A session ended elsewhere (sign-out, password change) lands back here.
  useEffect(() => {
    const onSignedOut = () => setSession(null);
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    // Picks up a role change without making anyone sign in again.
    refreshUser().then((u) => {
      if (!cancelled && u) setSession(readSession());
    });
    fetchViews().then((v) => {
      if (!cancelled && v) setViews(v);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Each person has their own list, so previewing shows YOUR user view, not hers.
  const myView = views && userId ? views[userId] : null;
  const isShared = (g) => (myView && g.id in myView ? myView[g.id] : g.shared !== false);
  const visibleApps = asAdmin ? APPS : APPS.filter(isShared);

  const copyLink = async (id) => {
    try {
      await navigator.clipboard.writeText(appLink(id));
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (route.view === "blank") {
    return <div style={{ background: TOKENS.bgDeep, minHeight: "100vh" }} />;
  }

  // The gift links never name the app (see scripts/prerender.mjs).
  const isGift = route.id === "birthday";
  if (!session) {
    return (
      <SignIn
        onSignedIn={(s, password) => {
          setGivenPassword(s.user.mustChange ? password : null);
          setSession(s);
        }}
        title={isGift ? null : undefined}
      />
    );
  }

  // A password the admin set has to be replaced before anything opens.
  if (session.user.mustChange) {
    return (
      <ChooseNewPassword
        user={session.user}
        givenPassword={givenPassword}
        onDone={() => {
          setGivenPassword(null);
          setSession(readSession());
        }}
        onSignedOut={() => {
          setGivenPassword(null);
          setSession(null);
        }}
      />
    );
  }

  // The card is a whole screen of its own — its own background, its own fonts,
  // nothing above it. Returned before the app chrome rather than inside it: a
  // greeting and a theme toggle framing a gift would undo it.
  if (route.view === "app" && route.id === "birthday") return <BirthdayGiftCard admin={asAdmin} />;

  const activeApp = route.view === "app" ? APPS.find((g) => g.id === route.id) : null;
  const isNight = !!activeApp?.night;
  const bare = !!activeApp?.bare;
  const myName = user.name;
  const locked = route.view === "app" && lockHour !== null;

  return (
    <div
      style={{ background: TOKENS.bgDeep, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}
      className="w-full flex flex-col items-center px-4 py-8"
    >
      <style>{`
        @keyframes cf-fade { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .cf-fade { animation: cf-fade 0.4s ease-out; }
        .sn-sun-btn:active { transform: scale(0.97); }
        @keyframes sn-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
        .sn-rays { animation: sn-pulse 2.4s ease-in-out infinite; }
        @keyframes cf-nudge {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(216,168,87,0); }
          50% { transform: scale(1.035); box-shadow: 0 0 16px 2px rgba(216,168,87,0.55); }
        }
        .cf-nudge { animation: cf-nudge 1.8s ease-in-out 1.2s infinite; }
        @keyframes db-twinkle { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.3; } }
        .db-star { animation: db-twinkle 2s ease-in-out infinite; }
        @keyframes fs-stamp { 0% { transform: scale(2.4) rotate(-18deg); opacity: 0; } 60% { transform: scale(0.92) rotate(-14deg); opacity: 1; } 100% { transform: scale(1) rotate(-14deg); opacity: 1; } }
        .fs-stamp-in { animation: fs-stamp 0.5s cubic-bezier(.3,1.4,.5,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .cf-fade, .sn-rays, .cf-nudge, .db-star, .fs-stamp-in { animation: none; }
        }
      `}</style>

      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label={theme === "light" ? "Switch to dark" : "Switch to light"}
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 40,
          width: 34,
          height: 34,
          borderRadius: 9999,
          border: `1px solid ${TOKENS.line}`,
          background: TOKENS.bgCard,
          color: TOKENS.muted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
      </button>

      <div className="w-full max-w-sm flex flex-col items-center">
        {!bare && (
          <>
        <div className="mb-2">
          {isNight ? <Moon size={18} color={TOKENS.gold} /> : <Sun size={18} color={TOKENS.gold} />}
        </div>
        <h1
          style={{
            color: TOKENS.cream,
            fontFamily: "'Fraunces', serif",
            fontWeight: 600,
            fontSize: 26,
            textAlign: "center",
          }}
          className="mb-1"
        >
          {isNight ? `Good Night, ${myName}` : `Hello, ${myName}`}
        </h1>
        <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-8">
          {isNight ? "something small before you sleep." : "a little something, whenever you need it."}
        </p>

          </>
        )}

        {locked ? (
          <div className="flex flex-col items-center" style={{ paddingTop: 12 }}>
            <Moon size={34} color={TOKENS.gold} style={{ opacity: 0.7, marginBottom: 14 }} />
            <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, textAlign: "center" }} className="mb-2">
              Not yet.
            </p>
            <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }}>
              This one opens after {String(lockHour).padStart(2, "0")}:00. Come back tonight.
            </p>
          </div>
        ) : showSettings && isAdmin ? (
          <SharedSettings apps={APPS} onBack={() => setShowSettings(false)} onSaved={setViews} />
        ) : route.view === "hub" ? (
          <>
            {asAdmin && (
              <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
                Each app has its own link — whoever opens it only sees that one app.
              </p>
            )}
            {visibleApps.some((g) => g.id === "garden") && (
              <GardenWidget me={userId} onOpen={() => setRoute({ view: "app", id: "garden" })} />
            )}
            <div className="w-full flex flex-col gap-3">
              {visibleApps.map((g, i) => {
                const Icon = g.icon;
                const startsGroup = i === 0 || visibleApps[i - 1].night !== g.night;
                return (
                  <React.Fragment key={g.id}>
                    {startsGroup && (
                      <span
                        style={{
                          color: TOKENS.muted,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1.6,
                          textTransform: "uppercase",
                          marginTop: i === 0 ? 0 : 10,
                          marginBottom: -4,
                        }}
                      >
                        {g.night ? "For the night" : "For the morning"}
                      </span>
                    )}
                  <div
                    style={{
                      background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                      border: `1px solid ${TOKENS.line}`,
                      borderRadius: 16,
                      padding: "8px 8px 8px 16px",
                    }}
                    className="w-full flex items-center gap-3"
                  >
                    <button
                      onClick={() => setRoute({ view: "app", id: g.id })}
                      style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: "8px 0" }}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${alpha(TOKENS.gold, "22")}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={19} color={TOKENS.gold} />
                      </div>
                      <div className="min-w-0">
                        <div style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600 }}>{g.title}</div>
                        <div style={{ color: TOKENS.muted, fontSize: 12.5, marginTop: 2 }}>{g.desc}</div>
                      </div>
                    </button>
                    {asAdmin && (
                    <button
                      onClick={() => copyLink(g.id)}
                      aria-label={`Copy the ${g.title} link`}
                      style={{ background: TOKENS.bgDeep, color: TOKENS.cream, border: `1px solid ${TOKENS.line}` }}
                      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
                    >
                      {copiedId === g.id ? <Check size={15} color={TOKENS.gold} /> : <Link2 size={15} />}
                    </button>
                    )}
                  </div>
                  </React.Fragment>
                );
              })}
            </div>
            {isAdmin && (
              <div className="flex flex-col items-center gap-1.5 mt-5">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      color: viewAsUser ? TOKENS.muted : TOKENS.gold,
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                    }}
                  >
                    {viewAsUser ? `USER VIEW · ${visibleApps.length}` : `ADMIN · ${APPS.length} apps`}
                  </span>
                  {!viewAsUser && (
                    <button
                      onClick={() => setShowSettings(true)}
                      style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700 }}
                    >
                      what she sees
                    </button>
                  )}
                  <button
                    onClick={() => toggleAsUser(!viewAsUser)}
                    style={{ color: TOKENS.muted, fontSize: 10.5, opacity: 0.8 }}
                  >
                    {viewAsUser ? "back to admin" : "view as user"}
                  </button>
                </div>
              </div>
            )}
            <AccountFooter user={user} onSignedOut={() => setSession(null)} />
          </>
        ) : (
          <>
            {route.id === "sun" && <SunApp />}
            {route.id === "daybreak" && <DaybreakApp />}
            {route.id === "agreement" && <AgreementApp />}
            {route.id === "this-or-that" && <ThisOrThatApp />}
            {route.id === "surprise" && <SurpriseBoxApp />}
            {route.id === "jar" && <VerseJarApp />}
            {route.id === "names" && <NamesApp />}
            {route.id === "khatm" && <KhatmApp identity={userId} />}
            {route.id === "quran" && <Quran identity={userId} />}
            {route.id === "zikr" && <ZikrApp me={userId} />}
            {route.id === "garden" && <GardenApp me={userId} onOpenApp={(id) => setRoute({ view: "app", id })} />}
            {route.id === "close-day" && <CloseDayApp />}
            {route.id === "three-things" && <ThreeThingsApp />}
            {route.id === "highlights" && <HighlightsApp />}
          </>
        )}
      </div>
    </div>
  );
}
