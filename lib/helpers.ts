import {
  create,
  fetchCollection,
  fetchAsset,
  AssetV1,
  update,
  fetchAssetsByCollection,
} from "@metaplex-foundation/mpl-core";
import axios from "axios";
import { createSignerFromKeypair } from "@metaplex-foundation/umi";
import { generateSigner, Umi, PublicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { collectionAddress } from "@/lib/constants";

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

export const mintNft = async (
  umi: Umi,
  collectionAddress: PublicKey,
  username: string,
  metadataUri: string
) => {
  try {
    const collection = await fetchCollection(umi, collectionAddress);
    const assetSigner = generateSigner(umi);

    const collectionAuthoritySigner = createSignerFromKeypair(
      umi,
      umi.eddsa.createKeypairFromSecretKey(
        base58.serialize(process.env.COLLECTION_AUTHORITY_SECRET_KEY!)
      )
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
    const collectionAuthoritySigner = createSignerFromKeypair(
      umi,
      umi.eddsa.createKeypairFromSecretKey(
        base58.serialize(process.env.COLLECTION_AUTHORITY_SECRET_KEY!)
      )
    );

    const res = await update(umi, {
      asset: asset,
      collection: collection,
      uri: metadataUri,
      authority: collectionAuthoritySigner,
    }).sendAndConfirm(umi, {
      confirm: {
        commitment: "confirmed",
      },
    });

    return {
      signature: base58.deserialize(res.signature)[0],
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

export const fetchNftsHandler = async (
  umi: Umi,
  collectionAddress: PublicKey
) => {
  try {
    const assets = await fetchAssetsByCollection(umi, collectionAddress);
    assets.forEach(async (asset) => {
      const res = await axios.get(asset.uri);
      const data = res.data as {
        name: string;
        image: string;
        attributes: [
          {
            latest_vote: string;
          }
        ];
      };

      console.log(data.attributes[0].latest_vote);
    });
  } catch (err: any) {
    throw new Error(err);
  }
};

export const fetchNftsByOwner = async (umi: Umi, owner: SolanaPublicKey) => {
  const assets = await fetchAssetsByCollection(umi, collectionAddress);
  const ownerAssets: AssetV1[] = [];

  assets.forEach((asset) => {
    if (asset.owner.toString() == owner.toString()) {
      ownerAssets.push(asset);
    }
  });

  return ownerAssets;
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
