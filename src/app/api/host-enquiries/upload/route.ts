import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import {
  ENQUIRY_MAX_PHOTO_BYTES,
  ENQUIRY_PATH_PREFIX,
  ENQUIRY_PHOTO_TYPES,
} from "@/lib/enquiryPhotos";

// Anyone registering their interest can attach photos, so this endpoint is public. It only ever
// hands out upload permission for small image files inside the enquiries folder.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(ENQUIRY_PATH_PREFIX) || pathname.includes("..")) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: ENQUIRY_PHOTO_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: ENQUIRY_MAX_PHOTO_BYTES,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
