import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
const chat = openai.chat.completions;

export default chat;
