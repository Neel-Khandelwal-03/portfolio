import { AdminPageHeader } from "@/components/admin/shell";
import { MessageList } from "@/app/admin/(dashboard)/messages/message-list";
import { EmptyState } from "@/components/ui";
import { listContactMessages } from "@/services/portfolio";

export default async function MessagesAdminPage() {
  const messages = await listContactMessages();

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description="Submissions from the contact form on your portfolio."
      />

      {messages.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Anything sent through the contact form arrives here."
        />
      ) : (
        <MessageList messages={messages} />
      )}
    </>
  );
}
