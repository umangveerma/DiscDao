"use client";

import { useCanvas } from "@/hooks/useCanvas";
import { useWallet } from "@solana/wallet-adapter-react";

const UserInfo = () => {
  const { user, isLoading } = useCanvas();
  const { publicKey } = useWallet();

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return (
      <div>No DSCVR user data found</div>
    );
  }

  return (
    <div>
      <h2>User Info</h2>
      <p>Username: {user.username}</p>
      {user.avatar && <img src={user.avatar} alt={user.username} />}
      <h3>Wallet Info</h3>
      <p>
        {publicKey
          ? `Connected Wallet: ${publicKey.toString()}`
          : "No wallet connected"}
      </p>
    </div>
  );
};

export default UserInfo;