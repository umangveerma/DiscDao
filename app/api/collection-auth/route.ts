import { NextResponse } from "next/server";

export async function POST() {
  try {
    const collectionAuthoritySecretKey =
      process.env.COLLECTION_AUTHORITY_SECRET_KEY;

    if (!collectionAuthoritySecretKey) {
      throw new Error("Collection authority secret key is not set");
    }

    return NextResponse.json({
      key: collectionAuthoritySecretKey,
    });
  } catch (error) {
    console.error("Error creating auth signer:", error);
    return NextResponse.json(
      { error: "Failed to create auth signer" },
      { status: 500 }
    );
  }
}
