import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  X,
  MapPin,
  Users,
  Star,
  DollarSign,
  Clock,
  CheckCircle,
  Settings,
  ChevronRight,
  Link2,
  Copy,
  Check,
  Smartphone,
  Wifi,
  Play,
  ThumbsDown,
  Zap,
  Timer,
  RotateCcw,
  Sparkles,
  Ban,
  Truck,
  Bookmark,
  Share2,
  ExternalLink,
  Phone,
  Navigation,
  UtensilsCrossed,
  Eye,
  ChevronDown,
  Trophy,
} from "lucide-react";
import { supabase, getDeviceId, generatePartnerCode } from "./lib/supabase";
import {
  RESTAURANTS,
  CUISINES,
  CATEGORIES,
  DIETARY_OPTIONS,
  OCCASIONS,
  isOpenNow,
} from "./data/restaurants";
import { DeliveryOrder } from "./components/DeliveryOrder";

const VETO_LIMIT = 3;

// localStorage helpers
function loadSetting(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveSetting(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function App() {
  // ── Step / view management ──
  const [step, setStep] = useState("welcome");

  // ── User identity ──
  const [myName, setMyName] = useState(() => loadSetting("rs_name", ""));
  const [myUserId, setMyUserId] = useState(null);
  const [partnerCode, setPartnerCode] = useState(null);
  const [partnerId, setPartnerId] = useState(() =>
    loadSetting("rs_partner_id", null),
  );
  const [partnerName, setPartnerName] = useState(() =>
    loadSetting("rs_partner_name", ""),
  );
  const [linkCode, setLinkCode] = useState("");
  const [linkError, setLinkError] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Mode: local (pass & play) or remote (Supabase) ──
  const [mode, setMode] = useState("local");
  const [player2Name, setPlayer2Name] = useState("");
  const [remoteSession, setRemoteSession] = useState(null);
  const [partnerDone, setPartnerDone] = useState(false);

  // ── Filters ──
  const [selectedCuisines, setSelectedCuisines] = useState(() =>
    loadSetting("rs_cuisines", []),
  );
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(10);
  const [priceRange, setPriceRange] = useState([1, 2, 3, 4]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState(() =>
    loadSetting("rs_dietary", []),
  );
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [openNowOnly, setOpenNowOnly] = useState(false);

  // ── Detail view (tap to expand) ──
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Tiebreaker ──
  const [tiebreakerMode, setTiebreakerMode] = useState(false);
  const [tiebreakerPool, setTiebreakerPool] = useState([]);

  // ── Game state ──
  const [restaurants, setRestaurants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [player1Likes, setPlayer1Likes] = useState(new Set());
  const [player2Likes, setPlayer2Likes] = useState(new Set());
  const [swipeDir, setSwipeDir] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const cardRef = useRef(null);

  // ── Veto power ──
  const [player1Vetoes, setPlayer1Vetoes] = useState(0);
  const [player2Vetoes, setPlayer2Vetoes] = useState(0);
  const [vetoFlash, setVetoFlash] = useState(false);

  // ── Timer ──
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);

  // ── Settings panel ──
  const [showSettings, setShowSettings] = useState(false);

  // ── Favorites / Saved ──
  const [favorites, setFavorites] = useState(() =>
    loadSetting("rs_favorites", []),
  );
  const [showFavorites, setShowFavorites] = useState(false);

  // ── Delivery ──
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // ═══ EFFECTS ═══

  // Save settings when they change
  useEffect(() => {
    saveSetting("rs_name", myName);
  }, [myName]);
  useEffect(() => {
    saveSetting("rs_cuisines", selectedCuisines);
  }, [selectedCuisines]);
  useEffect(() => {
    saveSetting("rs_dietary", selectedDietary);
  }, [selectedDietary]);
  useEffect(() => {
    saveSetting("rs_partner_id", partnerId);
  }, [partnerId]);
  useEffect(() => {
    saveSetting("rs_partner_name", partnerName);
  }, [partnerName]);
  useEffect(() => {
    saveSetting("rs_favorites", favorites);
  }, [favorites]);

  // Initialize user in Supabase
  useEffect(() => {
    const initUser = async () => {
      const deviceId = getDeviceId();
      if (!deviceId) return;

      const { data: existing } = await supabase
        .from("rs_users")
        .select("*")
        .eq("device_id", deviceId)
        .single();

      if (existing) {
        setMyUserId(existing.id);
        setPartnerCode(existing.partner_code);
        if (existing.partner_id) {
          setPartnerId(existing.partner_id);
          const { data: partner } = await supabase
            .from("rs_users")
            .select("name")
            .eq("id", existing.partner_id)
            .single();
          if (partner) setPartnerName(partner.name);
        }
      } else {
        const code = generatePartnerCode();
        const { data: newUser } = await supabase
          .from("rs_users")
          .insert({
            device_id: deviceId,
            name: myName || "User",
            partner_code: code,
          })
          .select()
          .single();
        if (newUser) {
          setMyUserId(newUser.id);
          setPartnerCode(newUser.partner_code);
        }
      }
    };
    initUser();
  }, []);

  // Sync user name to Supabase
  useEffect(() => {
    if (myUserId && myName) {
      supabase
        .from("rs_users")
        .update({ name: myName, updated_at: new Date().toISOString() })
        .eq("id", myUserId);
    }
  }, [myName, myUserId]);

  // Timer logic
  useEffect(() => {
    if (
      timerEnabled &&
      (step === "player1" || step === "player2" || step === "remote-swiping")
    ) {
      setTimeLeft(timerSeconds);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSwipe("left"); // auto-nope on timeout
            return timerSeconds;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerEnabled, step, currentIndex, timerSeconds]);

  // Subscribe to partner swipes (remote mode)
  useEffect(() => {
    if (step !== "remote-swiping" && step !== "remote-waiting") return;
    if (!remoteSession || !partnerId) return;

    const channel = supabase
      .channel(`rs_swipes_${remoteSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rs_swipes",
          filter: `session_id=eq.${remoteSession.id}`,
        },
        (payload) => {
          const swipe = payload.new;
          if (swipe.user_id === partnerId) {
            if (swipe.direction === "right") {
              setPlayer2Likes((prev) => new Set(prev).add(swipe.restaurant_id));
            }
            // Check if partner is done (all restaurants swiped)
            // Simple heuristic: count swipes
          }
          if (swipe.direction === "done") {
            setPartnerDone(true);
            if (step === "remote-waiting") {
              setStep("remote-results");
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [step, remoteSession, partnerId]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(timerSeconds);
  };

  // ═══ PARTNER LINKING ═══

  const linkPartner = async () => {
    setLinkError("");
    if (!linkCode || linkCode.length !== 6) {
      setLinkError("Enter a 6-character code");
      return;
    }
    const { data: partner } = await supabase
      .from("rs_users")
      .select("*")
      .eq("partner_code", linkCode)
      .single();
    if (!partner) {
      setLinkError("Code not found");
      return;
    }
    if (partner.id === myUserId) {
      setLinkError("That's your own code!");
      return;
    }
    await supabase
      .from("rs_users")
      .update({ partner_id: partner.id })
      .eq("id", myUserId);
    await supabase
      .from("rs_users")
      .update({ partner_id: myUserId })
      .eq("id", partner.id);
    setPartnerId(partner.id);
    setPartnerName(partner.name);
    setLinkCode("");
  };

  const unlinkPartner = async () => {
    if (partnerId) {
      await supabase
        .from("rs_users")
        .update({ partner_id: null })
        .eq("id", myUserId);
      await supabase
        .from("rs_users")
        .update({ partner_id: null })
        .eq("id", partnerId);
    }
    setPartnerId(null);
    setPartnerName("");
  };

  const copyCode = () => {
    if (partnerCode) {
      navigator.clipboard.writeText(partnerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ═══ CUISINE / FILTER TOGGLES ═══

  const toggleCuisine = (id) => {
    setSelectedCuisines((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const togglePrice = (level) => {
    setPriceRange((prev) =>
      prev.includes(level)
        ? prev.filter((p) => p !== level)
        : [...prev, level].sort(),
    );
  };

  // ═══ FAVORITES ═══

  const addToFavorites = (restaurant) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.restaurant.id === restaurant.id)) return prev;
      return [
        ...prev,
        { restaurant, addedAt: new Date().toISOString(), visited: false },
      ];
    });
  };

  const removeFromFavorites = (id) => {
    setFavorites((prev) => prev.filter((f) => f.restaurant.id !== id));
  };

  const toggleVisited = (id) => {
    setFavorites((prev) =>
      prev.map((f) =>
        f.restaurant.id === id ? { ...f, visited: !f.visited } : f,
      ),
    );
  };

  // ═══ FETCH / FILTER RESTAURANTS ═══

  const fetchRestaurants = async () => {
    setStep("loading");

    let filtered = [...RESTAURANTS];

    // Filter by cuisines
    if (selectedCuisines.length > 0) {
      filtered = filtered.filter((r) =>
        r.cuisineIds.some((c) => selectedCuisines.includes(c)),
      );
    }

    // Filter by category
    if (selectedCategory !== "popular") {
      const catFiltered = filtered.filter(
        (r) => r.category === selectedCategory,
      );
      if (catFiltered.length >= 3) filtered = catFiltered;
    }

    // Filter by dietary
    if (selectedDietary.length > 0) {
      filtered = filtered.filter((r) =>
        selectedDietary.every(
          (d) => r.dietary?.includes(d) || r.dietary?.includes(d + "-options"),
        ),
      );
    }

    // Filter by occasion
    if (selectedOccasion) {
      const occFiltered = filtered.filter((r) =>
        r.occasions?.includes(selectedOccasion),
      );
      if (occFiltered.length >= 3) filtered = occFiltered;
    }

    // Filter by open now
    if (openNowOnly) {
      filtered = filtered.filter((r) => isOpenNow(r));
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter((r) => r.rating >= minRating);
    }

    // Filter by distance
    filtered = filtered.filter((r) => r.distance <= maxDistance);

    // Filter by price
    filtered = filtered.filter((r) => priceRange.includes(r.priceLevel));

    // Shuffle
    filtered = filtered.sort(() => Math.random() - 0.5);

    // Ensure at least some restaurants
    if (filtered.length < 3) {
      filtered = [...RESTAURANTS].sort(() => Math.random() - 0.5).slice(0, 10);
    }

    setRestaurants(filtered);
    setCurrentIndex(0);
    setPlayer1Likes(new Set());
    setPlayer2Likes(new Set());
    setPlayer1Vetoes(0);
    setPlayer2Vetoes(0);

    // Create remote session if needed
    if (mode === "remote" && partnerId && myUserId) {
      const { data: session } = await supabase
        .from("rs_sessions")
        .insert({
          user1_id: myUserId,
          user2_id: partnerId,
          cuisines: selectedCuisines,
          categories: [selectedCategory],
          restaurant_ids: filtered.map((r) => r.id),
        })
        .select()
        .single();
      if (session) setRemoteSession(session);
    }

    setTimeout(() => {
      setStep(mode === "remote" ? "remote-swiping" : "player1");
    }, 800);
  };

  // ═══ SWIPE HANDLING ═══

  const handleDragStart = () => {
    setIsDragging(true);
  };
  const handleDrag = (_, info) => {
    setDragX(info.offset.x);
  };
  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    setDragX(0);
    const threshold = 80;
    if (info.offset.x > threshold) {
      handleSwipe("right");
    } else if (info.offset.x < -threshold) {
      handleSwipe("left");
    }
  };

  const handleSwipe = useCallback(
    async (direction) => {
      if (swipeDir) return;
      const restaurant = restaurants[currentIndex];
      if (!restaurant) return;

      setSwipeDir(direction);
      haptic(direction === "right" ? "medium" : "light");

      if (direction === "right") {
        if (step === "player1" || step === "remote-swiping") {
          setPlayer1Likes((prev) => new Set(prev).add(restaurant.id));
        } else {
          setPlayer2Likes((prev) => new Set(prev).add(restaurant.id));
        }
      }

      // Save to Supabase if remote
      if (step === "remote-swiping" && remoteSession && myUserId) {
        await supabase.from("rs_swipes").insert({
          session_id: remoteSession.id,
          user_id: myUserId,
          restaurant_id: restaurant.id,
          direction,
        });
      }

      setTimeout(() => {
        setSwipeDir(null);
        if (currentIndex + 1 >= restaurants.length) {
          if (step === "player1") {
            setStep("handoff");
          } else if (step === "player2") {
            setStep("results");
          } else if (step === "remote-swiping") {
            // Signal done
            if (remoteSession && myUserId) {
              supabase.from("rs_swipes").insert({
                session_id: remoteSession.id,
                user_id: myUserId,
                restaurant_id: 0,
                direction: "done",
              });
            }
            setStep(partnerDone ? "remote-results" : "remote-waiting");
          }
        } else {
          setCurrentIndex((prev) => prev + 1);
          if (timerEnabled) setTimeLeft(timerSeconds);
        }
      }, 250);
    },
    [
      swipeDir,
      restaurants,
      currentIndex,
      step,
      remoteSession,
      myUserId,
      partnerDone,
      timerEnabled,
      timerSeconds,
    ],
  );

  const handleSuperVeto = () => {
    const vetoCount =
      step === "player1" || step === "remote-swiping"
        ? player1Vetoes
        : player2Vetoes;
    if (vetoCount >= VETO_LIMIT) return;

    if (step === "player1" || step === "remote-swiping") {
      setPlayer1Vetoes((prev) => prev + 1);
    } else {
      setPlayer2Vetoes((prev) => prev + 1);
    }

    haptic("heavy");
    setVetoFlash(true);
    setTimeout(() => setVetoFlash(false), 600);
    handleSwipe("left");
  };

  const startPlayer2 = () => {
    setCurrentIndex(0);
    setStep("player2");
  };

  const resetGame = () => {
    setStep("welcome");
    setRestaurants([]);
    setPlayer1Likes(new Set());
    setPlayer2Likes(new Set());
    setCurrentIndex(0);
    setPlayer2Name("");
    setRemoteSession(null);
    setPartnerDone(false);
    setMode("local");
    setPlayer1Vetoes(0);
    setPlayer2Vetoes(0);
    setTiebreakerMode(false);
    setTiebreakerPool([]);
    setDetailOpen(false);
    resetTimer();
  };

  // Haptic feedback helper
  const haptic = (style = "light") => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(
          style === "heavy" ? 50 : style === "medium" ? 30 : 15,
        );
      }
    } catch {}
  };

  // Dietary toggle
  const toggleDietary = (id) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  // Start tiebreaker round (when no matches found)
  const startTiebreaker = () => {
    // Pool = restaurants at least one player liked, sorted by total likes
    const pool = restaurants
      .filter((r) => player1Likes.has(r.id) || player2Likes.has(r.id))
      .sort((a, b) => {
        const aScore =
          (player1Likes.has(a.id) ? 1 : 0) + (player2Likes.has(b.id) ? 1 : 0);
        const bScore =
          (player1Likes.has(b.id) ? 1 : 0) + (player2Likes.has(b.id) ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 5);

    if (pool.length === 0) return;

    setTiebreakerPool(pool);
    setTiebreakerMode(true);
    setRestaurants(pool);
    setCurrentIndex(0);
    setPlayer1Likes(new Set());
    setPlayer2Likes(new Set());
    setPlayer1Vetoes(0);
    setPlayer2Vetoes(0);
    setStep("player1");
  };

  // Share results
  const shareResults = async () => {
    const text =
      matches.length > 0
        ? `We matched on ${matches.length} restaurant${matches.length !== 1 ? "s" : ""} with Restinder! 🍽️\n${matches.map((r) => `• ${r.name} (${r.cuisine}, ${"$".repeat(r.priceLevel)})`).join("\n")}`
        : "We couldn't agree on a restaurant! 😂 Try Restinder to settle it.";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Restinder Results", text });
        return;
      } catch {}
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  // ═══ COMPUTED ═══

  const matches = restaurants.filter(
    (r) => player1Likes.has(r.id) && player2Likes.has(r.id),
  );
  const currentRestaurant = restaurants[currentIndex];
  const progress =
    restaurants.length > 0
      ? Math.round((currentIndex / restaurants.length) * 100)
      : 0;
  const currentPlayer =
    step === "player1" || step === "remote-swiping"
      ? myName || "Player 1"
      : player2Name || partnerName || "Player 2";

  // ═══ RENDER ═══

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-brand-pink/10 blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-brand-purple/10 blur-[120px]" />

      {/* Top bar (welcome) */}
      {step === "welcome" && (
        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
          {favorites.length > 0 && (
            <button
              onClick={() => setShowFavorites(true)}
              className="h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors px-3 gap-1.5"
            >
              <Bookmark className="w-4 h-4 text-brand-pink fill-brand-pink" />
              <span className="text-white text-xs font-medium">
                {favorites.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5 text-brand-muted" />
          </button>
        </div>
      )}

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-5 z-30 w-72 glass rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-white font-bold text-sm">Your Settings</h3>
            <div className="text-xs text-brand-muted space-y-2">
              <p>
                <span className="text-white">Name:</span> {myName || "Not set"}
              </p>
              <p>
                <span className="text-white">Cuisines:</span>{" "}
                {selectedCuisines.length
                  ? selectedCuisines
                      .map((c) => CUISINES.find((x) => x.id === c)?.name)
                      .join(", ")
                  : "None"}
              </p>
              <p>
                <span className="text-white">Partner:</span>{" "}
                {partnerName ? `${partnerName} (linked)` : "Not linked"}
              </p>
            </div>
            {partnerName && partnerId && (
              <button
                onClick={unlinkPartner}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Unlink partner
              </button>
            )}
            <p className="text-brand-muted/50 text-xs">
              Settings auto-save between sessions.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ═══════════ STEP 1: Welcome ═══════════ */}
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center z-10 max-w-md w-full"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-bg mb-4 shadow-lg shadow-brand-pink/30">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold gradient-text mb-3">Restinder</h1>
            <p className="text-brand-muted text-lg mb-6">
              Swipe right on dinner. Together.
            </p>

            {/* Name input */}
            <div className="glass rounded-2xl p-5 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-brand-muted focus:outline-none focus:border-brand-purple/50"
              />
              {partnerName && partnerId ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Link2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium flex-1 text-left">
                    Linked with {partnerName}
                  </span>
                  <button
                    onClick={() => setStep("partner")}
                    className="text-xs text-brand-muted hover:text-white"
                  >
                    Manage
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStep("partner")}
                  className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                >
                  <Link2 className="w-4 h-4 text-brand-purple" />
                  <span className="text-brand-muted text-sm flex-1">
                    Link partner for remote play
                  </span>
                  <ChevronRight className="w-4 h-4 text-brand-muted/50" />
                </button>
              )}
            </div>

            {/* Mode picker */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => {
                  setMode("local");
                  setStep("cuisines");
                }}
                disabled={!myName}
                className="flex-1 glass rounded-2xl p-4 text-left hover:bg-white/5 transition-colors disabled:opacity-30 border-2 border-transparent hover:border-brand-purple/30"
              >
                <Smartphone className="w-5 h-5 text-brand-purple mb-2" />
                <p className="text-white font-semibold text-sm">Same Phone</p>
                <p className="text-brand-muted text-xs mt-0.5">
                  Pass &amp; play
                </p>
              </button>
              <button
                onClick={() => {
                  setMode("remote");
                  setStep("cuisines");
                }}
                disabled={!myName || !partnerId}
                className="flex-1 glass rounded-2xl p-4 text-left hover:bg-white/5 transition-colors disabled:opacity-30 border-2 border-transparent hover:border-brand-pink/30"
              >
                <Wifi className="w-5 h-5 text-brand-pink mb-2" />
                <p className="text-white font-semibold text-sm">Own Phones</p>
                <p className="text-brand-muted text-xs mt-0.5">
                  {partnerId ? `With ${partnerName}` : "Link partner first"}
                </p>
              </button>
            </div>
            <p className="text-brand-muted/40 text-xs">
              Stop arguing. Start eating.
            </p>
          </motion.div>
        )}

        {/* ═══════════ PARTNER LINKING ═══════════ */}
        {step === "partner" && (
          <motion.div
            key="partner"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="text-center z-10 max-w-md w-full"
          >
            <Link2 className="w-12 h-12 text-brand-purple mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Link Your Partner
            </h2>
            <p className="text-brand-muted text-sm mb-6">
              Share your code or enter theirs to connect
            </p>

            <div className="glass rounded-2xl p-5 mb-4">
              <p className="text-brand-muted text-xs mb-2">Your partner code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold tracking-[0.3em] text-white">
                  {partnerCode || "..."}
                </span>
                <button
                  onClick={copyCode}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-brand-muted" />
                  )}
                </button>
              </div>
              <p className="text-brand-muted/50 text-xs mt-2">
                Send this to your partner
              </p>
            </div>

            <div className="glass rounded-2xl p-5 mb-4">
              <p className="text-brand-muted text-xs mb-2">
                Enter partner&apos;s code
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ABC123"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-center text-xl font-mono tracking-widest placeholder-brand-muted/30 focus:outline-none focus:border-brand-purple/50 uppercase"
                />
                <button
                  onClick={linkPartner}
                  className="gradient-bg text-white font-semibold py-3 px-5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Link
                </button>
              </div>
              {linkError && (
                <p className="text-red-400 text-xs mt-2">{linkError}</p>
              )}
            </div>

            {partnerName && partnerId && (
              <div className="glass rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">
                        {partnerName}
                      </p>
                      <p className="text-green-400 text-xs">Linked</p>
                    </div>
                  </div>
                  <button
                    onClick={unlinkPartner}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep("welcome")}
              className="w-full glass text-white font-semibold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}

        {/* ═══════════ STEP 2: Cuisines + Filters ═══════════ */}
        {step === "cuisines" && (
          <motion.div
            key="cuisines"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="text-center z-10 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              What are you craving?
            </h2>
            <p className="text-brand-muted text-sm mb-4">
              Pick cuisines or skip for a surprise mix
            </p>

            {/* Category picker */}
            <div className="mb-4">
              <p className="text-brand-muted text-xs mb-2 text-left font-medium uppercase tracking-wider">
                Category
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm transition-all ${selectedCategory === cat.id ? "bg-brand-purple/20 border-2 border-brand-purple text-white" : "glass border-2 border-transparent text-brand-muted hover:text-white"}`}
                  >
                    <span className="mr-1.5">{cat.emoji}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
              <p className="text-brand-muted/60 text-xs mt-1">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.desc}
              </p>
            </div>

            {/* Cuisine grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {CUISINES.map((cuisine) => {
                const selected = selectedCuisines.includes(cuisine.id);
                return (
                  <button
                    key={cuisine.id}
                    onClick={() => toggleCuisine(cuisine.id)}
                    className={`rounded-xl py-3 px-2 text-center transition-all ${selected ? "bg-white/10 border-2 border-brand-pink" : "glass border-2 border-transparent hover:bg-white/5"}`}
                  >
                    <span className="text-xl">{cuisine.emoji}</span>
                    <p className="text-white text-xs mt-1">{cuisine.name}</p>
                    {selected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-pink mx-auto mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Occasion picker */}
            <div className="mb-3">
              <p className="text-brand-muted text-xs mb-2 text-left font-medium uppercase tracking-wider">
                What&apos;s the occasion?
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedOccasion(null)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm transition-all ${!selectedOccasion ? "bg-brand-pink/20 border-2 border-brand-pink text-white" : "glass border-2 border-transparent text-brand-muted hover:text-white"}`}
                >
                  🎲 Any
                </button>
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() =>
                      setSelectedOccasion(
                        selectedOccasion === occ.id ? null : occ.id,
                      )
                    }
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm transition-all ${selectedOccasion === occ.id ? "bg-brand-pink/20 border-2 border-brand-pink text-white" : "glass border-2 border-transparent text-brand-muted hover:text-white"}`}
                  >
                    <span className="mr-1">{occ.emoji}</span>
                    {occ.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary restrictions */}
            <div className="mb-3">
              <p className="text-brand-muted text-xs mb-2 text-left font-medium uppercase tracking-wider">
                Dietary Needs
              </p>
              <div className="flex gap-2 flex-wrap">
                {DIETARY_OPTIONS.map((diet) => {
                  const active = selectedDietary.includes(diet.id);
                  return (
                    <button
                      key={diet.id}
                      onClick={() => toggleDietary(diet.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${active ? "bg-green-500/20 border-2 border-green-500 text-green-300" : "glass border-2 border-transparent text-brand-muted hover:text-white"}`}
                    >
                      <span className="mr-1">{diet.emoji}</span>
                      {diet.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Open Now toggle + Deal Breakers */}
            <div className="glass rounded-2xl p-4 mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm">Open Now Only</span>
                </div>
                <button
                  onClick={() => setOpenNowOnly(!openNowOnly)}
                  className={`w-12 h-7 rounded-full transition-all relative ${openNowOnly ? "bg-green-500" : "bg-white/10"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${openNowOnly ? "left-6" : "left-1"}`}
                  />
                </button>
              </div>
            </div>

            {/* Deal Breaker Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full glass rounded-2xl p-3 mb-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-white text-sm font-medium flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" /> Deal Breakers
                {(minRating > 0 ||
                  maxDistance < 10 ||
                  priceRange.length < 4) && (
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                )}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-brand-muted transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="glass rounded-2xl p-4 space-y-4">
                    {/* Min rating */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm">Min Rating</span>
                        <span className="text-brand-purple text-sm font-bold">
                          {minRating > 0 ? `${minRating}+` : "Any"}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={4.5}
                        step={0.5}
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        className="w-full accent-brand-purple h-1"
                      />
                    </div>
                    {/* Max distance */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm">Max Distance</span>
                        <span className="text-brand-purple text-sm font-bold">
                          {maxDistance} mi
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        className="w-full accent-brand-purple h-1"
                      />
                    </div>
                    {/* Price range */}
                    <div>
                      <p className="text-white text-sm mb-2">Price Range</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((level) => (
                          <button
                            key={level}
                            onClick={() => togglePrice(level)}
                            className={`flex-1 py-2 rounded-lg text-sm transition-all ${priceRange.includes(level) ? "bg-brand-purple/20 border border-brand-purple text-white" : "bg-white/5 border border-white/10 text-brand-muted"}`}
                          >
                            {"$".repeat(level)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "local" && (
              <div className="glass rounded-2xl p-4 mb-3">
                <input
                  type="text"
                  placeholder="Partner's name (for pass & play)"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-brand-muted focus:outline-none focus:border-brand-purple/50"
                />
              </div>
            )}

            {/* Game options: Timer & Veto */}
            <div className="glass rounded-2xl p-4 mb-4 space-y-3">
              <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-muted" /> Game Options
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-brand-purple" />
                  <span className="text-white text-sm">Speed Round</span>
                </div>
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`w-12 h-7 rounded-full transition-all relative ${timerEnabled ? "bg-brand-purple" : "bg-white/10"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${timerEnabled ? "left-6" : "left-1"}`}
                  />
                </button>
              </div>
              {timerEnabled && (
                <div className="flex items-center gap-3">
                  <span className="text-brand-muted text-xs w-8">
                    {timerSeconds}s
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={5}
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                    className="flex-1 accent-brand-purple h-1"
                  />
                  <span className="text-brand-muted text-xs">per card</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-white text-sm">Super Vetoes</span>
                </div>
                <span className="text-yellow-400 text-sm font-bold">
                  {VETO_LIMIT} each
                </span>
              </div>
            </div>

            <button
              onClick={fetchRestaurants}
              disabled={mode === "local" && !player2Name}
              className="w-full gradient-bg text-white font-semibold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-brand-pink/20 disabled:opacity-30"
            >
              <Play className="w-5 h-5" /> Start Swiping
            </button>
          </motion.div>
        )}

        {/* ═══════════ Loading ═══════════ */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <div className="animate-spin w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-brand-muted text-lg">
              Finding restaurants for you...
            </p>
          </motion.div>
        )}

        {/* ═══════════ SWIPING (no card left — transitioning) ═══════════ */}
        {(step === "player1" ||
          step === "player2" ||
          step === "remote-swiping") &&
          !currentRestaurant && (
            <motion.div
              key="swiping-done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center z-10"
            >
              <Sparkles className="w-12 h-12 text-brand-pink mx-auto mb-4 animate-pulse" />
              <p className="text-brand-muted text-lg">Tallying choices…</p>
            </motion.div>
          )}

        {/* ═══════════ SWIPING ═══════════ */}
        {(step === "player1" ||
          step === "player2" ||
          step === "remote-swiping") &&
          currentRestaurant && (
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="z-10 max-w-sm w-full flex flex-col min-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-brand-purple font-medium text-sm">
                  {currentPlayer}&apos;s turn
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: VETO_LIMIT }).map((_, i) => (
                      <Zap
                        key={i}
                        className={`w-4 h-4 transition-colors ${i < VETO_LIMIT - (step === "player1" || step === "remote-swiping" ? player1Vetoes : player2Vetoes) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                      />
                    ))}
                  </div>
                  <span className="text-brand-muted text-sm">
                    {currentIndex + 1}/{restaurants.length}
                  </span>
                </div>
              </div>

              {/* Timer bar */}
              {timerEnabled && (
                <>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className={`h-full rounded-full transition-colors ${timeLeft <= 5 ? "bg-red-500" : timeLeft <= 10 ? "bg-yellow-400" : "bg-green-400"}`}
                      animate={{ width: `${(timeLeft / timerSeconds) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-center mb-2">
                    <span
                      className={`text-sm font-mono font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-brand-muted"}`}
                    >
                      <Timer className="w-3.5 h-3.5 inline mr-1" />
                      {timeLeft}s
                    </span>
                  </div>
                </>
              )}

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full gradient-bg rounded-full"
                  animate={{ width: `${progress}%` }}
                />
              </div>

              {/* Card */}
              <div className="flex-1 flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    ref={cardRef}
                    key={currentRestaurant.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      x:
                        swipeDir === "right"
                          ? 400
                          : swipeDir === "left"
                            ? -400
                            : 0,
                      rotate:
                        swipeDir === "right"
                          ? 15
                          : swipeDir === "left"
                            ? -15
                            : 0,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: swipeDir ? 0.25 : 0.2 }}
                    drag={!swipeDir ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.9}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    className="w-full cursor-grab active:cursor-grabbing touch-none"
                    style={{ rotate: isDragging ? dragX * 0.05 : 0 }}
                  >
                    {/* Drag direction indicators */}
                    {isDragging && dragX > 30 && (
                      <div
                        className="absolute top-6 left-6 z-20 border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-15deg]"
                        style={{ opacity: Math.min(dragX / 100, 1) }}
                      >
                        <span className="text-green-400 font-bold text-2xl">
                          LIKE
                        </span>
                      </div>
                    )}
                    {isDragging && dragX < -30 && (
                      <div
                        className="absolute top-6 right-6 z-20 border-4 border-red-400 rounded-xl px-4 py-2 rotate-[15deg]"
                        style={{ opacity: Math.min(Math.abs(dragX) / 100, 1) }}
                      >
                        <span className="text-red-400 font-bold text-2xl">
                          NOPE
                        </span>
                      </div>
                    )}

                    <div className="glass rounded-3xl overflow-hidden shadow-2xl">
                      <div className="relative h-[280px]">
                        <img
                          src={currentRestaurant.image}
                          alt={currentRestaurant.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent" />
                        {swipeDir === "right" && (
                          <div className="absolute top-6 left-6 border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-15deg]">
                            <span className="text-green-400 font-bold text-2xl">
                              LIKE
                            </span>
                          </div>
                        )}
                        {swipeDir === "left" && (
                          <div className="absolute top-6 right-6 border-4 border-red-400 rounded-xl px-4 py-2 rotate-[15deg]">
                            <span className="text-red-400 font-bold text-2xl">
                              NOPE
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {isOpenNow(currentRestaurant) && (
                            <div className="glass rounded-full px-2.5 py-1 flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-green-400 font-bold text-xs">
                                Open
                              </span>
                            </div>
                          )}
                          <div className="glass rounded-full px-2.5 py-1 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-white font-bold text-xs">
                              {currentRestaurant.rating}
                            </span>
                          </div>
                          <div className="glass rounded-full px-2.5 py-1">
                            <span className="text-white font-bold text-xs">
                              {"$".repeat(currentRestaurant.priceLevel)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-xl font-bold text-white">
                            {currentRestaurant.name}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailOpen(true);
                            }}
                            className="ml-2 flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-brand-muted" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-brand-muted text-xs mb-2 flex-wrap">
                          <span>{currentRestaurant.cuisine}</span>
                          <span>&middot;</span>
                          <span>{currentRestaurant.distance} mi</span>
                          <span>&middot;</span>
                          <span>
                            <Clock className="w-3 h-3 inline" />{" "}
                            {currentRestaurant.waitTime} min
                          </span>
                          {currentRestaurant.dietary?.length > 0 && (
                            <>
                              <span>&middot;</span>
                              <span className="text-green-400">
                                {currentRestaurant.dietary
                                  .slice(0, 2)
                                  .map((d) => {
                                    const opt = DIETARY_OPTIONS.find((o) =>
                                      d.startsWith(o.id),
                                    );
                                    return opt ? opt.emoji : "";
                                  })
                                  .join("")}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          {currentRestaurant.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md bg-white/5 text-brand-muted text-xs border border-white/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-brand-muted text-sm line-clamp-2 mb-2">
                          {currentRestaurant.description}
                        </p>
                        {currentRestaurant.popularDishes && (
                          <div className="flex gap-1.5 flex-wrap">
                            {currentRestaurant.popularDishes
                              .slice(0, 3)
                              .map((dish) => (
                                <span
                                  key={dish}
                                  className="px-2.5 py-1 rounded-full bg-brand-blue/20 text-brand-blue text-xs font-medium"
                                >
                                  {dish}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Veto flash overlay */}
              <AnimatePresence>
                {vetoFlash && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-yellow-400/10 z-50 pointer-events-none flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Zap className="w-24 h-24 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex justify-center items-center gap-5 py-5">
                <button
                  onClick={() => handleSwipe("left")}
                  className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center active:scale-90 transition-all"
                >
                  <ThumbsDown className="w-7 h-7 text-red-400" />
                </button>
                <button
                  onClick={handleSuperVeto}
                  disabled={
                    (step === "player1" || step === "remote-swiping"
                      ? player1Vetoes
                      : player2Vetoes) >= VETO_LIMIT
                  }
                  className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${(step === "player1" || step === "remote-swiping" ? player1Vetoes : player2Vetoes) >= VETO_LIMIT ? "bg-gray-800/50 border-2 border-gray-700 opacity-40 cursor-not-allowed" : "bg-yellow-500/10 border-2 border-yellow-500/40 hover:bg-yellow-500/20"}`}
                >
                  <Zap className="w-5 h-5 text-yellow-400" />
                </button>
                <button
                  onClick={() => handleSwipe("right")}
                  className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center active:scale-90 transition-all"
                >
                  <Heart className="w-8 h-8 text-green-400" />
                </button>
              </div>
            </motion.div>
          )}

        {/* ═══════════ Remote: Waiting ═══════════ */}
        {step === "remote-waiting" && (
          <motion.div
            key="remote-waiting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center z-10 max-w-sm w-full"
          >
            <div className="animate-spin w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              You&apos;re done!
            </h2>
            <p className="text-brand-muted mb-6">
              Waiting for {partnerName || "your partner"} to finish...
            </p>
            {partnerDone && (
              <button
                onClick={() => setStep("remote-results")}
                className="gradient-bg text-white font-semibold py-3 px-8 rounded-xl"
              >
                See Results
              </button>
            )}
          </motion.div>
        )}

        {/* ═══════════ Handoff (local) ═══════════ */}
        {step === "handoff" && (
          <motion.div
            key="handoff"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10 max-w-sm w-full"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
              className="text-6xl mb-6"
            >
              📱
            </motion.div>
            <h2 className="text-3xl font-bold gradient-text mb-3">
              Pass the phone!
            </h2>
            <p className="text-brand-muted text-lg mb-2">
              Hand it to{" "}
              <span className="text-white font-semibold">
                {player2Name || "Player 2"}
              </span>
            </p>
            <p className="text-brand-muted/60 text-sm mb-8">
              Don&apos;t peek! {myName || "Player 1"}&apos;s choices are hidden.
            </p>
            <button
              onClick={startPlayer2}
              className="w-full gradient-bg text-white font-semibold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-brand-pink/20"
            >
              I&apos;m {player2Name || "Player 2"} — Start Swiping{" "}
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* ═══════════ RESULTS ═══════════ */}
        {(step === "results" || step === "remote-results") && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center z-10 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            {matches.length > 0 ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <Sparkles className="w-16 h-16 text-brand-pink mx-auto mb-3" />
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: [
                          "#ff6b9d",
                          "#c084fc",
                          "#60a5fa",
                          "#34d399",
                          "#fbbf24",
                        ][i % 5],
                        left: "50%",
                        top: "50%",
                      }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x:
                          Math.cos((i * 30 * Math.PI) / 180) *
                          (80 + Math.random() * 40),
                        y:
                          Math.sin((i * 30 * Math.PI) / 180) *
                          (80 + Math.random() * 40),
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  ))}
                </motion.div>
                <h2 className="text-3xl font-bold gradient-text mb-1">
                  {matches.length} Match{matches.length !== 1 ? "es" : ""}!
                </h2>
                <p className="text-brand-muted mb-5">
                  You both want to eat here 🎉
                </p>
                <div className="space-y-3 mb-6">
                  {matches.map((restaurant, i) => {
                    const inFavorites = favorites.some(
                      (f) => f.restaurant.id === restaurant.id,
                    );
                    return (
                      <motion.div
                        key={restaurant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="glass rounded-2xl overflow-hidden"
                      >
                        <div className="flex items-start gap-3 p-4">
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          />
                          <div className="flex-1 text-left min-w-0">
                            <h3 className="text-white font-bold text-sm">
                              {restaurant.name}
                            </h3>
                            <p className="text-brand-muted text-xs mb-1">
                              {restaurant.cuisine} &middot; ⭐{" "}
                              {restaurant.rating} &middot; {restaurant.distance}{" "}
                              mi &middot; {"$".repeat(restaurant.priceLevel)}
                            </p>
                            <div className="flex gap-1 flex-wrap mb-2">
                              {restaurant.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full gradient-bg text-white text-xs font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRestaurant(restaurant);
                                  setStep("delivery");
                                }}
                                className="px-3 py-1 rounded-lg bg-brand-purple/20 text-brand-purple text-xs font-medium hover:bg-brand-purple/30 transition-colors flex items-center gap-1"
                              >
                                <Truck className="w-3 h-3" /> Order
                              </button>
                              <button
                                onClick={() =>
                                  inFavorites
                                    ? removeFromFavorites(restaurant.id)
                                    : addToFavorites(restaurant)
                                }
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${inFavorites ? "bg-green-500/20 text-green-400" : "bg-brand-pink/20 text-brand-pink hover:bg-brand-pink/30"}`}
                              >
                                {inFavorites ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Bookmark className="w-3 h-3" />
                                )}
                                {inFavorites ? "Saved" : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <MapPin className="w-16 h-16 text-brand-muted mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">
                  No Matches
                </h2>
                <p className="text-brand-muted mb-4">
                  You two have very different taste!
                </p>
                {!tiebreakerMode && (
                  <button
                    onClick={startTiebreaker}
                    className="w-full bg-yellow-500/20 border-2 border-yellow-500/40 text-yellow-300 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500/30 transition-colors mb-4"
                  >
                    <Trophy className="w-5 h-5" /> Tiebreaker Round
                  </button>
                )}
                {tiebreakerMode && (
                  <p className="text-brand-muted/60 text-sm mb-4">
                    Even after the tiebreaker, no agreement! Try different
                    filters.
                  </p>
                )}
              </>
            )}

            <div className="space-y-3">
              <button
                onClick={shareResults}
                className="w-full glass text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/10"
              >
                <Share2 className="w-4 h-4" /> Share Results
              </button>
              <button
                onClick={resetGame}
                className="w-full gradient-bg text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              {favorites.length > 0 && (
                <button
                  onClick={() => {
                    resetGame();
                    setTimeout(() => setShowFavorites(true), 100);
                  }}
                  className="w-full glass text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-brand-pink" /> View Saved (
                  {favorites.length})
                </button>
              )}
            </div>

            <div className="mt-4 glass rounded-xl p-4">
              <p className="text-brand-muted text-xs">
                <span className="text-white font-medium">
                  {myName || "Player 1"}
                </span>{" "}
                liked {player1Likes.size} &middot;{" "}
                <span className="text-white font-medium">
                  {player2Name || partnerName || "Player 2"}
                </span>{" "}
                liked {player2Likes.size} &middot; {restaurants.length} total
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══════════ Delivery ═══════════ */}
        {step === "delivery" && selectedRestaurant && (
          <motion.div
            key="delivery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full max-w-md"
          >
            <DeliveryOrder
              restaurant={selectedRestaurant}
              onBack={() => setStep("results")}
              onDeliveryCreated={(delivery) =>
                console.log("Delivery created:", delivery)
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ Restaurant Detail Overlay ═══════════ */}
      <AnimatePresence>
        {detailOpen && currentRestaurant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-brand-bg border-t border-white/10 rounded-t-3xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Hero image */}
              <div className="relative h-[200px] mx-4 rounded-2xl overflow-hidden mb-4">
                <img
                  src={currentRestaurant.image}
                  alt={currentRestaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-2xl font-bold text-white">
                    {currentRestaurant.name}
                  </h2>
                  <p className="text-brand-muted text-sm">
                    {currentRestaurant.cuisine} &middot;{" "}
                    {"$".repeat(currentRestaurant.priceLevel)}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-8 space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass rounded-xl p-3 text-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">
                      {currentRestaurant.rating}
                    </p>
                    <p className="text-brand-muted text-xs">
                      {currentRestaurant.reviews} reviews
                    </p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <Navigation className="w-5 h-5 text-brand-purple mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">
                      {currentRestaurant.distance} mi
                    </p>
                    <p className="text-brand-muted text-xs">away</p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <Clock className="w-5 h-5 text-brand-pink mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">
                      {currentRestaurant.waitTime}
                    </p>
                    <p className="text-brand-muted text-xs">min wait</p>
                  </div>
                </div>

                {/* Open status & hours */}
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${isOpenNow(currentRestaurant) ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                      />
                      <span
                        className={`font-medium text-sm ${isOpenNow(currentRestaurant) ? "text-green-400" : "text-red-400"}`}
                      >
                        {isOpenNow(currentRestaurant) ? "Open Now" : "Closed"}
                      </span>
                    </div>
                    <span className="text-brand-muted text-sm">
                      {currentRestaurant.hours}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-brand-muted text-sm leading-relaxed">
                  {currentRestaurant.description}
                </p>

                {/* Popular dishes */}
                {currentRestaurant.popularDishes && (
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-brand-pink" />{" "}
                      Popular Dishes
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {currentRestaurant.popularDishes.map((dish) => (
                        <span
                          key={dish}
                          className="px-3 py-1.5 rounded-full bg-brand-blue/20 text-brand-blue text-xs font-medium"
                        >
                          {dish}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dietary info */}
                {currentRestaurant.dietary?.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-2">
                      Dietary
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {currentRestaurant.dietary.map((d) => {
                        const opt = DIETARY_OPTIONS.find((o) =>
                          d.startsWith(o.id),
                        );
                        return opt ? (
                          <span
                            key={d}
                            className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20"
                          >
                            {opt.emoji}{" "}
                            {d.includes("-options")
                              ? `${opt.name} Options`
                              : opt.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {currentRestaurant.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-white/5 text-brand-muted text-xs border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Contact & directions */}
                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-brand-muted flex-shrink-0" />
                    <span className="text-white text-sm">
                      {currentRestaurant.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-brand-muted flex-shrink-0" />
                    <span className="text-white text-sm">
                      {currentRestaurant.phone}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(currentRestaurant.name + " " + currentRestaurant.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 glass rounded-xl py-3 text-center text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <Navigation className="w-4 h-4" /> Directions
                  </a>
                  <a
                    href={`tel:${currentRestaurant.phone}`}
                    className="flex-1 glass rounded-xl py-3 text-center text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                </div>

                <button
                  onClick={() => setDetailOpen(false)}
                  className="w-full gradient-bg text-white font-semibold py-3 rounded-xl text-sm"
                >
                  Back to Swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ Favorites Panel (slide-over) ═══════════ */}
      <AnimatePresence>
        {showFavorites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFavorites(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-brand-bg border-l border-white/10 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-6 h-6 text-brand-pink fill-brand-pink" />{" "}
                    Saved
                  </h2>
                  <button
                    onClick={() => setShowFavorites(false)}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white text-lg">✕</span>
                  </button>
                </div>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-brand-muted mx-auto mb-3" />
                    <p className="text-brand-muted">
                      No saved restaurants yet.
                    </p>
                    <p className="text-brand-muted/60 text-sm mt-1">
                      Match restaurants and save them here!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 mb-4">
                      <span className="text-brand-muted text-sm">
                        {favorites.filter((f) => !f.visited).length} to try
                        &middot; {favorites.filter((f) => f.visited).length}{" "}
                        visited
                      </span>
                    </div>
                    <div className="space-y-3">
                      {favorites.map((item) => (
                        <div
                          key={item.restaurant.id}
                          className={`glass rounded-2xl overflow-hidden transition-opacity ${item.visited ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-start gap-3 p-4">
                            <img
                              src={item.restaurant.image}
                              alt={item.restaurant.name}
                              className="w-14 h-20 object-cover rounded-xl flex-shrink-0"
                            />
                            <div className="flex-1 text-left min-w-0">
                              <h3
                                className={`font-bold text-sm ${item.visited ? "text-brand-muted line-through" : "text-white"}`}
                              >
                                {item.restaurant.name}
                              </h3>
                              <p className="text-brand-muted text-xs mb-2">
                                {item.restaurant.cuisine} &middot; ⭐{" "}
                                {item.restaurant.rating}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    toggleVisited(item.restaurant.id)
                                  }
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${item.visited ? "bg-green-500/20 text-green-400" : "bg-white/5 text-brand-muted hover:text-white"}`}
                                >
                                  {item.visited ? "✓ Visited" : "Mark visited"}
                                </button>
                                <button
                                  onClick={() =>
                                    removeFromFavorites(item.restaurant.id)
                                  }
                                  className="px-3 py-1 rounded-lg bg-white/5 text-red-400/60 text-xs hover:text-red-400 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
