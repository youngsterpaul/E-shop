-- Add DELETE policy for chat_messages (allow admins to delete messages)
CREATE POLICY "Admins can delete messages"
ON public.chat_messages
FOR DELETE
USING (is_any_admin(auth.uid()));

-- Add DELETE policy for chat_conversations (allow admins to delete conversations)
CREATE POLICY "Admins can delete conversations"
ON public.chat_conversations
FOR DELETE
USING (is_any_admin(auth.uid()));