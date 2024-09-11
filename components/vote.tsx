"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardFooter,
  CardTitle,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PROPOSALS } from "@/lib/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import toast from "react-hot-toast";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { umiInstance } from "@/lib/utils";
import { useCanvas } from "@/hooks/useCanvas";
import { Loader2 } from "lucide-react";
import {
  createUser,
  updateUser,
  fetchNftsByOwner,
  hasUserVotedOnProposal,
  getProposalApprovalPercentage,
  getDaoVoterDetails,
  VoterDetail,
} from "@/lib/helpers";

export function Vote() {
  const { user } = useCanvas();
  const { publicKey, wallet, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [proposalApprovals, setProposalApprovals] = useState<{
    [key: string]: number;
  }>({});
  const [voterDetails, setVoterDetails] = useState<VoterDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingProposalId, setVotingProposalId] = useState<number | null>(null);

  useEffect(() => {
    if (connected && isConnecting) {
      toast.success("Wallet connected successfully!");
      console.log("Wallet connected:", publicKey?.toString());
      setWalletConnected(true);
      setIsConnecting(false);
    }
  }, [connected, publicKey, isConnecting]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const approvals: { [key: number]: number } = {};
      for (const proposal of PROPOSALS) {
        approvals[proposal.id] = await getProposalApprovalPercentage(
          umiInstance,
          proposal.id.toString()
        );
      }
      setProposalApprovals(approvals);

      const voters = await getDaoVoterDetails(umiInstance);
      setVoterDetails(voters);

      setIsLoading(false);
    }

    fetchData();
  }, []);

  const handleVote = async (vote: number, vote_value: string) => {
    if (!connected) {
      setIsConnecting(true);
      setVisible(true);
      return;
    }

    if (!publicKey) {
      console.error("Public key is not available.");
      toast.error("Failed to connect wallet.");
      return;
    }

    if (!user) {
      toast.error("DSCVR user not found.");
      return;
    }

    setVotingProposalId(vote);
    const umi = umiInstance.use(walletAdapterIdentity(wallet!.adapter));

    try {
      const nfts = await fetchNftsByOwner(umi, publicKey);
      console.log("nfts", nfts);

      const proposalIndex = vote.toString();
      if (nfts.length === 0) {
        const mint = await createUser(
          umi,
          user.username,
          proposalIndex,
          vote_value,
          user.avatar!
        );

        setVotingProposalId(null);
        console.log("vote casted successfully:", mint);
        toast.success("vote casted successfully!");
      } else {
        const hasVoted = await hasUserVotedOnProposal(nfts, proposalIndex);

        if (hasVoted) {
          toast.error("You have already voted on this proposal");
          setVotingProposalId(null);
        } else {
          const signature = await updateUser(
            umi,
            nfts[0],
            proposalIndex,
            vote_value
          );
          setVotingProposalId(null);
          console.log(
            "vote casted successfully! Transaction signature:",
            signature
          );
          toast.success("vote casted successfully!");
        }
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      toast.error("Failed to cast vote.");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">
            Wait a moment, Loading proposals and voter data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-3xl font-bold">DiscDao</h1>
      </div>
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-3xl font-bold text-center md:text-left">
          Vote And Earn Community Reputation NFT
        </h2>
      </div>
      <div className="flex justify-center items-center mb-6">
        <p className="text-center text-md mb-8">
          Seamlessly vote on DiscDao proposals on DSCVR and earn a soulbound
          NFT.
        </p>
      </div>
      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="border-b">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
        </TabsList>
        <TabsContent value="proposals" className="py-6">
          <div className="grid gap-6">
            {PROPOSALS.map((proposal) => (
              <Card key={proposal.id} className="p-4">
                <CardFooter className="flex items-center justify-between">
                  <CardTitle className="text-left">{proposal.name}</CardTitle>
                  <Badge variant="outline" className="bg-green-500 text-white">
                    {proposal.status}
                  </Badge>
                </CardFooter>
                <CardContent className="py-2">
                  <p className="text-muted-foreground">
                    {proposal.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsUpIcon className="w-5 h-5 text-green-500" />
                    <span>
                      {proposalApprovals[proposal.id].toFixed(2)}% Approved
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(proposal.id, "yes")}
                      disabled={votingProposalId === proposal.id}
                    >
                      {votingProposalId === proposal.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsUpIcon className="w-5 h-5 mr-3 text-green-500" />
                      )}
                      {votingProposalId === proposal.id
                        ? "Voting..."
                        : "Vote Yes"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(proposal.id, "no")}
                      disabled={votingProposalId === proposal.id}
                    >
                      {votingProposalId === proposal.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsDownIcon className="w-5 h-5 mr-3 text-red-500" />
                      )}
                      {votingProposalId === proposal.id
                        ? "Voting..."
                        : "Vote No"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="voters" className="py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {voterDetails.map((voter) => (
              <Card key={voter.username}>
                <CardHeader className="flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      {voter.image ? (
                        <AvatarImage src={voter.image} alt={voter.username} />
                      ) : (
                        <AvatarFallback>
                          {voter.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {voter.username}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Total Votes: {voter.totalVotes} | Approval Rating:{" "}
                        {voter.approvalRating?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ThumbsDownIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}

function ThumbsUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}
