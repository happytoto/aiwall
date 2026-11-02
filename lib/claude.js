import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

export const MODEL = "claude-opus-5-5";

export class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// 한 번의 요청으로 스키마에 맞는 JSON 결과를 받습니다.
// 보안 분석은 분류기가 거절할 수 있어서, 거절 시 Anthropic 권장 모델로 넘기는 fallbacks를 켭니다.
export async function runStructured(env, { system, user, schema, effort = "medium", maxTokens = 16000 }) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new ServiceError(503, "서비스 설정이 끝나지 않았습니다 (ANTHROPIC_API_KEY 없음).");
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let message;
  try {
    message = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: user }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      throw new ServiceError(429, "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      throw new ServiceError(503, "서비스 인증 설정에 문제가 있습니다.");
    }
    if (error instanceof Anthropic.BadRequestError) {
      throw new ServiceError(400, "요청을 처리할 수 없습니다. 입력을 줄이거나 바꿔 주세요.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new ServiceError(502, "AI 분석 서버에 일시적인 문제가 있습니다.");
    }
    throw error;
  }

  if (message.stop_reason === "refusal") {
    throw new ServiceError(422, "이 입력은 분석할 수 없습니다. 방어 목적의 자사 시스템 로그인지 확인해 주세요.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new ServiceError(413, "결과가 너무 깁니다. 입력을 나눠서 보내 주세요.");
  }
  if (!message.parsed_output) {
    throw new ServiceError(502, "AI 결과를 읽지 못했습니다. 다시 시도해 주세요.");
  }
  return message.parsed_output;
}
