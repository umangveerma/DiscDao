import {
  create,
  fetchCollection,
  fetchAsset,
  AssetV1,
  update,
  fetchAssetsByCollection,
} from "@metaplex-foundation/mpl-core";
import axios from "axios";
import { RateLimiter } from "limiter";
import NodeCache from "node-cache";
import {
  generateSigner,
  Umi,
  PublicKey,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { collectionAddress } from "@/lib/constants";

const limiter = new RateLimiter({ tokensPerInterval: 5, interval: "second" });
const cache = new NodeCache({ stdTTL: 5 }); // Cache for 60 seconds

async function fetchAssetsWithRateLimit(
  umi: Umi,
  collectionAddress: PublicKey
): Promise<AssetV1[]> {
  const cacheKey = `assets-${collectionAddress.toString()}`;
  const cachedAssets = cache.get<AssetV1[]>(cacheKey);

  if (cachedAssets) {
    return cachedAssets;
  }

  await limiter.removeTokens(1);
  const assets = await fetchAssetsByCollection(umi, collectionAddress);
  cache.set(cacheKey, assets);
  return assets;
}

async function updateMetadata(
  uri: string,
  proposalIndex: string,
  voteValue: string
) {
  const response = await axios.get(uri);
  const metadata = response.data;

  if (!metadata.attributes) {
    metadata.attributes = [];
  }

  metadata.attributes.push({ [proposalIndex]: voteValue });

  return metadata;
}

async function getAuthSigner(): Promise<string> {
  const response = await fetch("/api/collection-auth", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to get auth signer public key");
  }
  const data = await response.json();
  return data.key;
}

export const uploadJsonData = async (data: Object) => {
  const response = await fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to upload JSON data");
  }

  const result = await response.json();
  return result.url;
};

export const fetchNftsByOwner = async (umi: Umi, owner: SolanaPublicKey) => {
  const assets = await fetchAssetsWithRateLimit(umi, collectionAddress);
  const ownerAssets: AssetV1[] = [];

  assets.forEach((asset) => {
    if (asset.owner.toString() == owner.toString()) {
      ownerAssets.push(asset);
    }
  });

  return ownerAssets;
};

export const hasUserVotedOnProposal = async (
  nfts: AssetV1[],
  proposalIndex: string
): Promise<boolean> => {
  if (nfts.length === 0) return false;

  const nft = nfts[0];
  try {
    const response = await axios.get(nft.uri);
    const metadata = response.data;

    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      return metadata.attributes.some((attr: any) =>
        attr.hasOwnProperty(proposalIndex)
      );
    }
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
  }

  return false;
};

export const mintNft = async (
  umi: Umi,
  collectionAddress: PublicKey,
  username: string,
  metadataUri: string
) => {
  try {
    const collection = await fetchCollection(umi, collectionAddress);
    const assetSigner = generateSigner(umi);

    const authSigner = await getAuthSigner();
    const collectionAuthoritySigner = createSignerFromKeypair(
      umi,
      umi.eddsa.createKeypairFromSecretKey(base58.serialize(authSigner))
    );

    console.log("mintAddress:", assetSigner.publicKey.toString());
    console.log("payer:", umi.payer.publicKey.toString());

    const res = await create(umi, {
      asset: assetSigner,
      collection: collection,
      payer: umi.payer,
      owner: umi.payer.publicKey,
      name: username,
      uri: metadataUri,
      authority: collectionAuthoritySigner,
      plugins: [
        {
          type: "PermanentFreezeDelegate",
          frozen: true,
        },
      ],
    }).sendAndConfirm(umi, {
      confirm: {
        commitment: "confirmed",
      },
    });

    console.log("mint tx:", base58.deserialize(res.signature)[0]);

    return {
      signature: base58.deserialize(res.signature)[0],
      address: assetSigner.publicKey,
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

export const updateNft = async (
  umi: Umi,
  collectionAddress: PublicKey,
  assetAddress: PublicKey,
  metadataUri: string
) => {
  try {
    const collection = await fetchCollection(umi, collectionAddress);
    const asset = await fetchAsset(umi, assetAddress);
    const authSigner = await getAuthSigner();
    const collectionAuthoritySigner = createSignerFromKeypair(
      umi,
      umi.eddsa.createKeypairFromSecretKey(base58.serialize(authSigner))
    );
    const res = await update(umi, {
      asset: asset,
      name: asset.name,
      collection: collection,
      uri: metadataUri,
      authority: collectionAuthoritySigner,
    }).sendAndConfirm(umi);

    return {
      signature: base58.deserialize(res.signature)[0],
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

export const createUser = async (
  umi: Umi,
  username: string,
  proposal_index: string,
  vote_value: string,
  avatar: string
) => {
  try {
    const nftMetadataCid = await uploadJsonData({
      name: username,
      image: avatar,
      attributes: [
        {
          [proposal_index]: vote_value,
        },
      ],
      properties: {
        files: [
          {
            uri: avatar,
            type: "image/png",
          },
        ],
        category: null,
      },
    });

    console.log("metadata url:", nftMetadataCid);

    const mintNftRes = await mintNft(
      umi,
      collectionAddress,
      username,
      nftMetadataCid
    );

    return mintNftRes.signature;
  } catch (err) {
    console.log(err);
    throw new Error("TX creation failed");
  }
};

export const updateUser = async (
  umi: Umi,
  nft: AssetV1,
  proposalIndex: string,
  voteValue: string
): Promise<string> => {
  try {
    const updatedMetadata = await updateMetadata(
      nft.uri,
      proposalIndex,
      voteValue
    );

    const newMetadataUri = await uploadJsonData(updatedMetadata);

    console.log("new metadata uri:", newMetadataUri);

    const updateResult = await updateNft(
      umi,
      collectionAddress,
      nft.publicKey as PublicKey,
      newMetadataUri
    );

    return updateResult.signature;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

export async function getProposalApprovalPercentage(
  umi: Umi,
  proposalId: string
): Promise<number> {
  const assets = await fetchAssetsWithRateLimit(umi, collectionAddress);

  let yesVotes = 0;
  let totalVotes = 0;

  for (const asset of assets) {
    const response = await axios.get(asset.uri);
    const metadata = response.data;
    if (metadata && metadata.attributes) {
      const proposalVote = metadata.attributes.find(
        (attr: any) => proposalId in attr
      );
      if (proposalVote) {
        totalVotes++;
        if (proposalVote[proposalId] === "yes") {
          yesVotes++;
        }
      }
    }
  }

  return totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
}

export async function getDaoVoterDetails(umi: Umi): Promise<VoterDetail[]> {
  const assets = await fetchAssetsWithRateLimit(umi, collectionAddress);

  const voterMap = new Map<string, VoterDetail>();

  for (const asset of assets) {
    const owner = asset.owner.toString();
    const response = await axios.get(asset.uri);
    const metadata = response.data;

    if (metadata) {
      let voterDetail = voterMap.get(owner) || {
        totalVotes: 0,
        yesVotes: 0,
        username: metadata.name || "Unknown",
        image: metadata.image || undefined,
      };

      if (metadata.attributes) {
        metadata.attributes.forEach((attr: any) => {
          const proposalId = Object.keys(attr)[0];
          voterDetail.totalVotes++;
          if (attr[proposalId] === "yes") {
            voterDetail.yesVotes++;
          }
        });
      }

      voterMap.set(owner, voterDetail);
    }
  }

  return Array.from(voterMap.values()).map((detail) => ({
    ...detail,
    approvalRating:
      detail.totalVotes > 0 ? (detail.yesVotes / detail.totalVotes) * 100 : 0,
  }));
}

export interface VoterDetail {
  username: string;
  totalVotes: number;
  yesVotes: number;
  approvalRating?: number;
  image?: string;
}
