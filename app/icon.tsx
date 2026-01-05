import { ImageResponse } from "next/og";
import Logo from "@/lib/components/Logo";

// Image metadata
export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

// Image generation - ultra-bold gift icon for maximum favicon readability
export default function Icon() {
  return new ImageResponse(<Logo {...size} />, size);
}
