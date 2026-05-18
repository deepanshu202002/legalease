"use client";

import { useState, useCallback, memo } from "react";

type ChildProps = {
    onAction: () => void;
};

// ✅ Child component
const Child = memo(({ onAction }: ChildProps) => {
    console.log("Child rendered");

    return (
        <div className="mt-6 p-4 border rounded-xl bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">
                Child Component (check re-renders)
            </p>

            <button
                onClick={onAction}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
                Run Child Function
            </button>
        </div>
    );
});

export default function UseCallbackTestPage() {
    const [text, setText] = useState("");
    const [analyzedText, setAnalyzedText] = useState("");
    const [count, setCount] = useState(0);

    // ✅ Analyze function
    const handleAnalyze = useCallback(() => {
        setAnalyzedText(text);
    }, [text]);

    // ✅ Child function
    const handleChildAction = useCallback(() => {
        alert(`Child received text: ${text}`);
    }, [text]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-start justify-center p-10">

            {/* ✅ Main Card */}
            <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6 relative z-10">

                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    useCallback Test Playground
                </h1>

                {/* ✅ Input */}
                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">
                        Enter Text
                    </label>

                    <input
                        type="text"
                        value={text}
                        onChange={(e) => {
                            console.log("Typing:", e.target.value); // debug
                            setText(e.target.value);
                        }}
                        placeholder="Type something..."
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* ✅ Buttons */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={handleAnalyze}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Analyze
                    </button>

                    <button
                        onClick={() => setCount((prev) => prev + 1)}
                        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        Re-render ({count})
                    </button>
                </div>

                {/* ✅ Output */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-500">Current Text</p>
                    <p className="text-gray-800 font-medium mb-3">
                        {text || "—"}
                    </p>

                    <p className="text-sm text-gray-500">Analyzed Text</p>
                    <p className="text-green-600 font-medium">
                        {analyzedText || "—"}
                    </p>
                </div>

                {/* ✅ Child */}
                <Child onAction={handleChildAction} />

            </div>
        </div>
    );
}