import { NextResponse } from "next/server";
import { twStorage } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const schema = await twStorage.upload(data);
    const url = twStorage.resolveScheme(schema);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading JSON data:", error);
    return NextResponse.json(
      { error: "Error uploading JSON data" },
      { status: 500 }
    );
  }
}
