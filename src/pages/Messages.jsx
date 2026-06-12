import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import MyBBConversationList from "@/components/messages/MyBBConversationList";
import MyBBChatView from "@/components/messages/MyBBChatView";
import MyBBNewMessageModal from "@/components/messages/MyBBNewMessageModal";

export default function Messages() {
  const { mybbUser } = useMyBBAuth();
  const [activeThread, setActiveThread] = useState(null); // { pmid, fromUsername }
  const [showCompose, setShowCompose] = useState(false);
  const queryClient = useQueryClient();

  const { data: pmsData, isLoading, refetch } = useQuery({
    queryKey: ["mybb-pms", mybbUser?.username],
    queryFn: async () => {
      const res = await base44.functions.invoke("mybbMessages", {
        action: "get_pms",
        username: mybbUser.username,
        password: mybbUser.password,
      });
      return res.data?.pms || [];
    },
    enabled: !!mybbUser?.password,
    refetchInterval: 15000,
  });

  const pms = pmsData || [];

  if (!mybbUser?.password) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">Please re-login to access your messages.</p>
      </div>
    );
  }

  if (activeThread) {
    return (
      <MyBBChatView
        pmid={activeThread.pmid}
        fromUsername={activeThread.fromUsername}
        subject={activeThread.subject}
        mybbUser={mybbUser}
        onBack={() => {
          setActiveThread(null);
          queryClient.invalidateQueries({ queryKey: ["mybb-pms", mybbUser?.username] });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Messages"
        rightAction={
          <button
            onClick={() => setShowCompose(true)}
            className="p-2 text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <MyBBConversationList
          pms={pms}
          onSelect={(pm) => setActiveThread({ pmid: pm.pmid, fromUsername: pm.fromuser, subject: pm.subject })}
          onCompose={() => setShowCompose(true)}
        />
      )}

      {showCompose && (
        <MyBBNewMessageModal
          mybbUser={mybbUser}
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            queryClient.invalidateQueries({ queryKey: ["mybb-pms", mybbUser?.username] });
          }}
        />
      )}
    </div>
  );
}