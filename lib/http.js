import { ServiceError } from "./claude.js";

const MAX_BODY_BYTES = 256 * 1024;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// 모든 서비스 API가 같은 방식으로 입력을 받고 오류를 돌려주도록 묶습니다.
export async function handle(context, run) {
  const { request, env } = context;
  try {
    // ACCESS_CODE를 설정하면 코드를 받은 고객만 쓸 수 있습니다 (API 비용 보호).
    if (env.ACCESS_CODE && request.headers.get("x-access-code") !== env.ACCESS_CODE) {
      throw new ServiceError(401, "이용 코드가 맞지 않습니다. 데모 신청 후 받은 코드를 입력해 주세요.");
    }
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) {
      throw new ServiceError(413, "입력이 너무 큽니다 (최대 256KB).");
    }
    let input;
    try {
      input = await request.json();
    } catch {
      throw new ServiceError(400, "JSON 형식의 요청이 아닙니다.");
    }
    return json(200, await run(input, env));
  } catch (error) {
    if (error instanceof ServiceError) return json(error.status, { error: error.message });
    console.error(error);
    return json(500, { error: "알 수 없는 오류가 발생했습니다." });
  }
}

export function requireText(value, name, maxChars) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ServiceError(400, `${name}을(를) 입력해 주세요.`);
  }
  if (value.length > maxChars) {
    throw new ServiceError(413, `${name}이(가) 너무 깁니다 (최대 ${maxChars.toLocaleString()}자).`);
  }
  return value;
}

export function optionalText(value, maxChars) {
  return typeof value === "string" ? value.slice(0, maxChars) : "";
}
