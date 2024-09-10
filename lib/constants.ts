import { publicKey } from "@metaplex-foundation/umi";

export const PROPOSALS = [
  {
    id: 1,
    name: "Implement Decentralized",
    status: "Active",
    description:
      "Proposal to transition the platform to a decentralized governance model, allowing token holders to participate in key decisions.",
    votes: 0,
    approved: 0,
  },
  {
    id: 2,
    name: "Launch Non-Fungible Dad Token (NFDT)",
    status: "Active",
    description:
      "Proposal to mint unique tokens representing dad jokes.",
    votes: 0,
    approved: 0,
  },
  {
    id: 3,
    name: "Dad Joke Generator",
    status: "Active",
    description:
      "Proposal to build an AI app that generates dad jokes about smart contracts and developers - Why don't programmers like nature? It has too many bugs!",
    votes: 0,
    approved: 0,
  },
];

export const collectionAddress = publicKey(
  "3zwaQAecf9tYkWgKVEmcwxPceXetyWgzQHtpJUa4b2Qb"
);
