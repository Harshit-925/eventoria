/**
 * @file app/api/plan/route.ts
 * POST /api/plan
 * Generates a full structured Event Plan (budget, timeline, vendors, ideas).
 */

import { NextResponse } from "next/server";
import { eventPlanRequestSchema } from "@/lib/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { classifyQuery } from "@/lib/classifier";
import { generateEventPlan } from "@/lib/gemini";
import type { ApiErrorResponse, PlanApiResponse } from "@/types/event";

export async function POST(request: Request): Promise<NextResponse<PlanApiResponse | ApiErrorResponse>> {
  try {
    const ip = getClientIp(request.headers);
    const rateCheck = checkRateLimit(ip, "plan");

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before generating another event plan.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        {
          status: 429,
          headers: rateCheck.headers,
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Malformed JSON payload.",
          code: "INVALID_JSON",
        },
        { status: 400, headers: rateCheck.headers }
      );
    }

    const validation = eventPlanRequestSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

      return NextResponse.json(
        {
          error: "Invalid event plan request parameters.",
          code: "VALIDATION_ERROR",
          details,
        },
        { status: 400, headers: rateCheck.headers }
      );
    }

    const planRequest = validation.data;
    const classification = classifyQuery(
      `${planRequest.eventType} ${planRequest.description}`,
      true
    );

    const { plan, model } = await generateEventPlan(planRequest);

    return NextResponse.json(
      {
        plan,
        model,
        classification: {
          complexity: classification.complexity,
          model: classification.model,
        },
      },
      {
        status: 200,
        headers: rateCheck.headers,
      }
    );
  } catch (err) {
    console.error("Unhandled error in /api/plan:", err);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while generating your plan. Please try again.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
