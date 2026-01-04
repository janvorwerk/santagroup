import { SantaUi } from "./client";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">Welcome to Santa</h1>
          <p className="text-xl text-gray-600">
            A modern web application built with Next.js 16, React 19, Tailwind CSS 4, and Drizzle ORM
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Tech Stack</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Next.js 16 with App Router
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              React 19
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Tailwind CSS 4
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              React Aria Components 1.14
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Drizzle ORM with Neon PostgreSQL
            </li>
          </ul>

          <div className="pt-4">
            <SantaUi />
          </div>
        </div>
      </div>
    </main>
  );
}
