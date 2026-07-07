import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import MeetingRoom from "@/components/MeetingRoom";

export default async function MeetingRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ meetingId: string }>;
  searchParams: Promise<{
    name?: string;
    muted?: string;
    video?: string;
    pwd?: string;
    host?: string;
  }>;
}) {
  const { meetingId } = await params;
  const sp = await searchParams;

  let meeting;
  try {
    meeting = await api.meeting(meetingId);
  } catch {
    notFound();
  }

  const me = await api.me().catch(() => null);

  const isHost = !!(me && me.id === meeting.host_id);
  const preferredName =
    sp.name || (isHost || sp.host === "1" ? me?.name ?? "" : "");
  const passcode = sp.pwd || (isHost ? meeting.passcode : null) || null;

  return (
    <MeetingRoom
      meeting={meeting}
      currentUserName={me?.name ?? "Guest"}
      preferredName={preferredName}
      isHostShortcut={isHost || sp.host === "1"}
      preferredMuted={sp.muted !== "0"}
      preferredVideoOn={sp.video === "1"}
      passcode={passcode}
    />
  );
}
