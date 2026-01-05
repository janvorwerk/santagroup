import { PersonClient } from "./person-client";
import { getPersonById } from "@/lib/server/pool";
import { notFound } from "next/navigation";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as it's now a Promise in Next.js
  const { id } = await params;
  
  // Server-side validation: check if person exists
  const personData = await getPersonById(id);
  
  if (!personData) {
    notFound();
  }

  // Client component will fetch the data using tRPC hooks
  return <PersonClient personId={id} />;
}

