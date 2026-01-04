"use client";
import { Button } from "@/lib/components/Button";

export function SantaUi() {
  return (
    <Button
      className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
      onPress={() => alert("React Aria Components are working!")}
    >
      Test React Aria Button
    </Button>
  );
}
