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
    name: "Expand to New Regions",
    status: "Active",
    description:
      "Proposal to expand the platform's services to new regions, increasing global accessibility and user base.",
    votes: 0,
    approved: 0,
  },
];

export const collectionAddress = publicKey(
  "3zwaQAecf9tYkWgKVEmcwxPceXetyWgzQHtpJUa4b2Qb"
);
