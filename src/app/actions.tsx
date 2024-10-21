"use server";
import { createAI, getMutableAIState } from "ai/rsc";
import type { CoreMessage, ToolInvocation, generateText } from "ai";
import type { ReactNode } from "react";
import { openai } from "@ai-sdk/openai";
import { Loader2 } from "lucide-react";
import { streamUI } from "ai/rsc";
import { BotCard, BotMessage } from "./llm/message";
import { z } from "zod";
//this is the system message we send to the LLM to initiate it
// this gives the LLM the context for the tool calling
type Service = {
	name: string;
	price: string;
	duration: string;
	description: string;
};

type Categories = {
	[category: string]: Service[];
};

const services = {
	categories: {
		Haircuts: [
			{
				name: "Quick Cut / Tips Cut",
				price: "€30",
				duration: "45 mins",
				description:
					"A fast trim focused on the tips of the hair, maintaining the current hairstyle.",
			},
			{
				name: "Short Cut + Wash & Style",
				price: "€40",
				duration: "1 hour",
				description:
					"Includes a wash, haircut for short hair, and a professional styling session.",
			},
			{
				name: "Long Cut + Wash & Dry",
				price: "€50",
				duration: "1 hour",
				description:
					"Includes a wash, haircut for long hair, and a blow-dry finish.",
			},
		],
		Balayage: [
			{
				name: "Balayage Short",
				price: "€150",
				duration: "3 hours",
				description:
					"Balayage technique for short hair, providing a natural, sun-kissed look.",
			},
			{
				name: "Balayage Long",
				price: "€175",
				duration: "3 hours",
				description:
					"Balayage technique for long hair, offering a seamless blend of highlights.",
			},
			{
				name: "Balayage Extra",
				price: "From €200",
				duration: "4 hours",
				description:
					"Extended balayage service for extra detail and customization.",
			},
		],
		// Add the rest of the categories...
	} as Categories,
};
const content = `
        You are a helpful receptionist at a hairsalon bot designed to assist users in scheduling appointments 
        and providing information about various hairdressing services, call \`get_salon_services\`
        Respond to users questions and help them schedule appointments.
        Assist them in scheduling appointments and offer suggestions tailored to their needs.
        When offering available times,call \`get_available_hours\`. 
        Present only the start times as options and ask users the day they would like to book and if they prefer morning, afternoon, or evening slots. 
        Ensure the offered times fall within the show times of 10:00 AM to 7:00 PM.
        After they have selected the hours ask for their name, email address and phone number to confirm the booking.
        Confirm the booking by providing the user with the details of the appointment and give the confirmation number QC12345.
        `;

export const sendMessage = async (
	messages: string,
): Promise<{
	id: number;
	role: "user" | "assistant";
	display: ReactNode;
}> => {
	const history = getMutableAIState<typeof AI>();

	history.update([
		...history.get(),
		{
			role: "user",
			content: messages,
		},
	]);

	const reply = await streamUI({
		model: openai("gpt-4-turbo"),
		messages: [
			{
				role: "system",
				content,
				toolInvocations: [],
			},
			...history.get(),
		] as CoreMessage[],
		initial: (
			<BotMessage className="items-center flex shrink-0 select-mone justify-center">
				<Loader2 className=" w-5 animate-spin stroke-zinc-900" />
			</BotMessage>
		),
		text: ({ content, done }) => {
			if (done) {
				history.done([...history.get(), { role: "assistant", content }]);
			}
			return <BotMessage>{content}</BotMessage>;
		},
		temperature: 0,
		tools: {
			// Record<string, tool>
			get_salon_services: {
				description:
				  "Get all the categories from a hair salon and use them to show to the user",
				parameters: z.object({
				  category: z
					.string()
					.describe("A specific category of services like 'haircut', 'balayage', 'highlights'")
				}),
				generate: async function* ({ category }: { category: string; }) {
					const selectedServices = services.categories[category] || [];
				console.log(selectedServices)
				  yield (
					<BotCard>
						loading....
					</BotCard>
				  );}
		}
	}
	});

	return {
		id: Date.now(),
		role: "assistant",
		display: reply.value,
	};
};

export type AIState = Array<{
	id?: number;
	name?: "get_available_hours" | "get_salon_services";
	role?: "user" | "assistant" | "system";
	content?: string;
}>;

export type UIState = Array<{
	id: number;
	role: "user" | "assistant";
	display: ReactNode;
	toolInvocations?: ToolInvocation[];
}>;
export const AI = createAI({
	initialAIState: [] as AIState,
	initialUIState: [
		{
			id: Date.now(),
			role: "assistant",
			display: (
				<BotMessage>
					Hello! I'm a helpful receptionist at a hair salon bot designed to
					assist users in scheduling appointments and providing information
					about various hairdressing services. How can I help you today?
				</BotMessage>
			),
		},
	] as UIState,
	actions: {
		sendMessage,
	},
});
