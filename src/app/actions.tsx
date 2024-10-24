"use server";
import { createAI, getMutableAIState } from "ai/rsc";
import type { CoreMessage, ToolInvocation, generateText } from "ai";
import type { ReactNode } from "react";
import { openai } from "@ai-sdk/openai";
import { Loader2 } from "lucide-react";
import { streamUI } from "ai/rsc";
import { BotCard, BotMessage } from "./llm/message";
import { z } from "zod";
import { HairSalonService } from "@/components/hair-salon-service";
//this is the system message we send to the LLM to initiate it
// this gives the LLM the context for the tool calling

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
		Highlights: [
			{
				name: "Highlight Half",
				price: "€165",
				duration: "3 hours",
				description:
					"Partial highlights for a subtle enhancement and dimension.",
			},
			{
				name: "Highlight Full",
				price: "From €200",
				duration: "4 hours",
				description: "Full head highlights for a dramatic transformation.",
			},
			{
				name: "Highlights Contour",
				price: "From €120",
				duration: "2 hours",
				description: "Face-framing highlights to enhance facial features.",
			},
		],
		Bleaching: [
			{
				name: "Shave & Bleach",
				price: "€120",
				duration: "2 hours",
				description:
					"Combines a professional shave with a full bleach treatment.",
			},
			{
				name: "Total Bleach Short",
				price: "€150",
				duration: "3 hours",
				description: "Complete bleach treatment for short hair.",
			},
			{
				name: "Total Bleach Medium",
				price: "€175",
				duration: "3 hours 30 mins",
				description: "Complete bleach treatment for medium-length hair.",
			},
			{
				name: "Total Bleach Long",
				price: "From €200",
				duration: "4 hours",
				description: "Complete bleach treatment for long hair.",
			},
			{
				name: "Root Bleach Touch-up",
				price: "€140",
				duration: "3 hours",
				description: "Touch-up service focusing on bleaching the roots.",
			},
			{
				name: "Bleach Re-Do",
				price: "From €170",
				duration: "4 hours",
				description: "Correctional bleach service for previous bleach jobs.",
			},
		],
		Coloring: [
			{
				name: "Color Block",
				price: "From €140",
				duration: "2 hours 30 mins",
				description: "Bold color blocks for a striking and modern look.",
			},
			{
				name: "Toner Refresh",
				price: "€60",
				duration: "1 hour",
				description: "Refreshes color tones and neutralizes brassiness.",
			},
			{
				name: "Hair Color",
				price: "From €110",
				duration: "2 hours",
				description:
					"Full hair coloring service with a wide range of color options.",
			},
			{
				name: "Color Design",
				price: "From €115",
				duration: "2 hours",
				description:
					"Customized color design for unique and personalized looks.",
			},
			{
				name: "Color Root Touch-Up",
				price: "€85",
				duration: "1 hour 30 mins",
				description: "Touch-up service focusing on coloring the roots.",
			},
		],
		Treatments: [
			{
				name: "Styling",
				price: "€40",
				duration: "15 mins",
				description: "Professional styling session for various occasions.",
			},
			{
				name: "Olaplex №1 & №2",
				price: "€50",
				duration: "15 mins",
				description: "Bond-repair treatment using Olaplex products.",
			},
		],
		Consultations: [
			{
				name: "General Consultation",
				price: "€0",
				duration: "15 mins",
				description: "Free consultation to discuss hair goals and services.",
			},
			{
				name: "Bleach test",
				price: "€0",
				duration: "15 mins",
				description: "Test to check hair compatibility with bleach.",
			},
		],
	},
};

const content = `
        You are a helpful receptionist at a hairsalon bot designed to assist users in scheduling appointments 
        and providing information about various hairdressing services provided in the services json below. 
        Use this information to respond to users questions and help them schedule appointments.
        Services: ${JSON.stringify(services, null, 2)}.
		Present the services available, call \`get_salon_services\`.
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
		model: openai("gpt-4o"),
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
			// // Record<string, tool>
			// get_salon_services: {
			// 	description: "Fetch available salon service categories",
			// 	parameters: 
			// 		z.object({
			// 			category: z
			// 				.string()
			// 				.describe(
			// 					'The name of the category, example: "Haircuts","Balayage","Highlights",',),
			// 		}),// Use the Zod schema to validate input
			// 	generate: async function* ({ category }: { category: string }) {
			// 		console.log(category);
			// 		yield <BotCard>Loading....</BotCard>;
			// 		return null; // [!code highlight:5]
			// 	},
			// },
			get_salon_services: {
				description: "Fetch available salon service categories",
				
				// Wrap the array in an object
				parameters: z.object({
				  categories: z.array(z.object({
					category: z
					  .string()
					  .describe('The name of the category, example: "Haircuts", "Balayage", "Highlights",')
				  }))
				}), // Use the Zod schema to validate input
				
				generate: async function* ({ categories }: { categories: { category: string }[] }) {
				  // `categories` is an array of objects
				  console.log(categories); // This will log the array of categories	
				  const categoryNames = categories.map(item => (<div key={item.category}>{item.category}</div>));

				  const categoryNamesString = categories.map(item => item.category).join(", ");
				// This will log the list of categories
				  yield <BotCard>Loading...</BotCard>;
				  history.done([...history.get(), { role: "assistant", name: "get_salon_services", content: "here are the available services" }]);
				 return <BotCard>{categoryNames}</BotCard>; 
			  },
			}
		},
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
