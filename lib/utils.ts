import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const umiInstance = createUmi(process.env.NEXT_PUBLIC_RPC_URL!, {
  commitment: "confirmed",
});

export const twStorage = new ThirdwebStorage({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});
