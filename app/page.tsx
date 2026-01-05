import ReadmeMDX from "@/content/README.mdx";
import Gift from "@/lib/components/Logo";
import { HomeClient } from "./home-client";

export default function Home() {
  return (
    <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="flex flex-col gap-2 md:col-span-3 items-center">
        <h1 className="text-5xl font-bold text-zinc-900 flex gap-2 items-center">
          <Gift aria-hidden className="h-full w-auto" />
          <span>Santa Group</span>
        </h1>
        <p className="text-xl text-zinc-600">Organise tes échanges de cadeaux</p>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-4 prose prose-gray md:col-span-2">
        <ReadmeMDX />
      </div>
      <HomeClient className="max-h-fit" />
    </main>
  );
}
