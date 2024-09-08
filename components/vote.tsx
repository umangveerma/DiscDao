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
import UserInfo from "@/components/UserInfo";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import toast from "react-hot-toast";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { umiInstance } from "@/lib/utils";
import { useCanvas } from "@/hooks/useCanvas";
import { createUser } from "@/lib/helpers";

export function Vote() {
  const { user } = useCanvas();
  const { publicKey, wallet, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    if (connected && isConnecting) {
      toast.success("Wallet connected successfully!");
      console.log("Wallet connected:", publicKey?.toString());
      setWalletConnected(true);
      setIsConnecting(false);
    }
  }, [connected, publicKey, isConnecting]);

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

    //  if (!user) {
    //    toast.error("DSCVR user not found.");
    //    return;
    //  }

    const umi = umiInstance.use(walletAdapterIdentity(wallet!.adapter));

    try {
      //TO DO check if user already has the souldbound NFT
      //TO DO check if user has already voted on this proposal

      // this function gives new NFT to user with first vote data
      const mint = await createUser(
        umi,
        "umang", //  user.username,
        vote,
        vote_value,
        "https://ipfs.dscvr.one/b2801e07-5fcb-486b-8149-9ee1b66f840b-bucket/lzhif9rwapy4uirzya.png" //  user.avatar!
      );

      console.log("vote casted successfully:", mint);
      toast.success("vote casted successfully!");
    } catch (error) {
      console.error("Error casting vote:", error);
      toast.error("Failed to cast vote.");
    }
  };

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
                    <span>{proposal.approved}% Approved</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(proposal.id, "yes")}
                    >
                      <ThumbsUpIcon className="w-5 h-5 mr-3 text-green-500" />{" "}
                      Vote Yes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(proposal.id, "no")}
                    >
                      <ThumbsDownIcon className="w-5 h-5 mr-3 text-red-500" />{" "}
                      Vote No
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="voters" className="py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">John Doe</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Total Votes: 25 | Approval Rating: 92%
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" />
                    <AvatarFallback>JA</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Jane Appleseed</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Total Votes: 18 | Approval Rating: 88%
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" />
                    <AvatarFallback>BO</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Bob Odenkirk</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Total Votes: 32 | Approval Rating: 85%
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" />
                    <AvatarFallback>EW</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Emily Wilkins</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Total Votes: 19 | Approval Rating: 91%
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <UserInfo />
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
