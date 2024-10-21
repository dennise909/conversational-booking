"use client";

import { Button } from "@/components/ui/button";
import { ChatList } from "@/components/ui/chat-list";
import ChatScrollAnchor from "@/components/ui/chat-scroll-anchor";
import { useEnterSubmit } from "@/lib/use-enter-submit";
import { useActions, useUIState } from "ai/rsc";
import { ArrowDownIcon, PlusIcon } from "lucide-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import type { AI } from "./actions";
import { UserMessage } from "./llm/message";

const chatSchema = z.object({
	message: z.string().min(1, "Message must not be empty"),
});

export type ChatInput = z.infer<typeof chatSchema>;

export default function Home() {
	const form = useForm<ChatInput>();
	const { formRef, onKeyDown } = useEnterSubmit();
	const [messages, setMessages] = useUIState<typeof AI>();
	const { sendMessage } = useActions<typeof AI>();

	const onSubmit: SubmitHandler<ChatInput> = async (data) => {
		const value = data.message.trim();
		formRef.current?.reset();
		if (!value) return;

		setMessages((currentMessages) => [
			...currentMessages,
			{
				id: Date.now(),
				role: "user",
				display: <UserMessage>{value}</UserMessage>,
			},
		]);
		try {
			const responseMessage = await sendMessage(value);
			setMessages((currentMessages) => [...currentMessages, responseMessage]);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<main>
			<div className="pb-[200px] pt-5 pt-10">
				<ChatList messages={messages} />
				<ChatScrollAnchor />
			</div>
			<div
				className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b
      from-muted/30 from-0% to-muted/30 to-50% peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-300px pb-2"
			>
				<div className="mx-auto sm:max-w-2xl sm:px-4">
					<div className="px-3 flex justify-center flex-col py-2 space-y-4 border-y shadow-lg bg-backgroundd sm:rounded-xl sm:border md:py-4 bg-white">
						<form
							ref={formRef}
							onSubmit={form.handleSubmit(onSubmit)}
							action=""
						>
							<div className="relative flex flex-col w-full overflow-hidden max-h-60 grow bg-background sm:rounded-md border">
								<TextareaAutosize
									tabIndex={0}
									onKeyDown={onKeyDown}
									placeholder="Type a message..."
									className="min-h-[60px] w-full resize-none bg-transparent pl-4 pr-16 py-[1.3rem]
              focus-within:outline-none sm:text-sm"
									autoFocus
									spellCheck={false}
									autoComplete="off"
									autoCorrect="off"
									rows={1}
									{...form.register("message")}
								/>
								<div className="absolute right-0 top-4 sm:right-4">
									<Button
										type="submit"
										size="icon"
										disabled={form.watch("message") === ""}
									>
										<ArrowDownIcon className="w-5 h-5" />
										<span className="sr-only">Send message</span>
									</Button>
								</div>
							</div>
						</form>

						<Button
							variant="outline"
							size="lg"
							className="p-4 mt-4 rounded-full bg-background"
							onClick={(event) => {
								event.preventDefault();
								window.location.reload();
							}}
						>
							<PlusIcon className="w-5 h-5" />
							<span>New chat</span>
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
