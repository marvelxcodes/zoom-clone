import DashboardShell from "@/components/DashboardShell";
import JoinForm from "@/components/JoinForm";
import { api } from "@/lib/api";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ meetingId?: string; pwd?: string }>;
}) {
  const params = await searchParams;
  const me = await api.me().catch(() => null);
  return (
    <DashboardShell activeNav="Home">
      <div className="mx-auto flex max-w-md flex-col items-stretch px-6 pt-16">
        <h1 className="text-[24px] font-semibold text-zoom-heading mb-6">
          Join Meeting
        </h1>
        <JoinForm
          initialMeetingId={params.meetingId ?? ""}
          initialPasscode={params.pwd ?? ""}
          currentUserName={me?.name ?? "You"}
        />
      </div>
    </DashboardShell>
  );
}
