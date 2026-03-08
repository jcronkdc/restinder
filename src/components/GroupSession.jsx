import React, { useState } from "react";
import { ArrowLeft, Users, Copy, Check, Share2 } from "lucide-react";
import { generateSessionId } from "../utils/session";

export function GroupSession({ mode, onComplete, onCancel }) {
  const [userName, setUserName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "create") {
      if (!generatedCode) {
        const code = generateSessionId();
        setGeneratedCode(code);
        return;
      }
      onComplete(userName);
    } else {
      onComplete(sessionId, userName);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = (code) => {
    if (navigator.share) {
      navigator
        .share({
          title: "Restinder Session",
          text: `Join my Restinder session! Code: ${code}`,
        })
        .catch(() => {});
    } else {
      copyCode(code);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {mode === "create"
                ? "Create Group Session"
                : "Join Group Session"}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {mode === "create"
                  ? "Start Swiping Together"
                  : "Join Your Friends"}
              </h2>
              <p className="text-gray-600">
                {mode === "create"
                  ? "Create a session and share the code with your group"
                  : "Enter the session code to start swiping with your group"}
              </p>
            </div>

            {!generatedCode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="userName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                    required
                  />
                </div>

                {mode === "join" && (
                  <div>
                    <label
                      htmlFor="sessionId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Session Code
                    </label>
                    <input
                      type="text"
                      id="sessionId"
                      value={sessionId}
                      onChange={(e) =>
                        setSessionId(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. ABC123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg tracking-widest text-center font-mono"
                      maxLength={6}
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                >
                  {mode === "create" ? "Create Session" : "Join Session"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Share this code with your group:
                  </p>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4">
                    <p className="text-4xl font-mono font-bold tracking-widest text-gray-800">
                      {generatedCode}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => copyCode(generatedCode)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copied ? "Copied!" : "Copy Code"}</span>
                  </button>
                  <button
                    onClick={() => shareCode(generatedCode)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                <button
                  onClick={() => onComplete(userName)}
                  className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                >
                  Start Swiping
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {mode === "create"
                  ? "Each person will swipe independently and find matches together"
                  : "Make sure everyone in your group has the same session code"}
              </p>
            </div>

            {mode === "create" && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  How it works:
                </h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Create a session and share the code</li>
                  <li>2. Everyone swipes through restaurants independently</li>
                  <li>3. Find matches that everyone likes</li>
                  <li>4. Choose your perfect dining spot!</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
