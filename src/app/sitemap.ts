//src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl(), lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}