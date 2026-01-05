/**
 * Copyright (C) 2026 Jan Vorwerk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

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
