import {
  create,
  fetchCollection,
  fetchAsset,
  update,
  fetchAssetsByCollection,
} from "@metaplex-foundation/mpl-core";
import axios from "axios";
import { generateSigner, PublicKey, Umi } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { collectionAddress } from "@/lib/constants";

export const uploadJsonData = async (data: Object) => {
  const response = await fetch("/api/", {
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

    console.log("mintAddress:", assetSigner.publicKey.toString());

    const res = await create(umi, {
      asset: assetSigner,
      collection: collection,
      name: username,
      uri: metadataUri,
      plugins: [
        {
          type: "PermanentFreezeDelegate",
          frozen: true,
        },
      ],
    }).sendAndConfirm(umi);

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

    const res = await update(umi, {
      asset: asset,
      collection: collection,
      uri: metadataUri,
    }).sendAndConfirm(umi);

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

export const createUser = async (
  umi: Umi,
  username: string,
  vote: number,
  vote_value: string,
  avatar: string
) => {
  try {
    const nftMetadataCid = await uploadJsonData({
      name: username,
      image: avatar,
      attributes: [
        {
          [vote]: vote_value,
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
