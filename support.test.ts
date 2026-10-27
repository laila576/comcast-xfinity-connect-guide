import { describe, it, expect } from "vitest";
import { z } from "zod";

const supportSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  category: z.enum(["internet", "billing", "mobile", "tv-streaming", "accessibility", "other"]),
  message: z.string().trim().min(10).max(2000)
});

describe("support request validation", () => {
  it("accepts a well-formed request", () => {
    expect(supportSchema.safeParse({name:"Taylor",email:"taylor@example.com",category:"internet",message:"My home connection is not working."}).success).toBe(true);
  });
  it("rejects invalid email and short messages", () => {
    expect(supportSchema.safeParse({name:"T",email:"not-an-email",category:"internet",message:"Help"}).success).toBe(false);
  });
  it("rejects unexpected categories", () => {
    expect(supportSchema.safeParse({name:"Taylor",email:"taylor@example.com",category:"account-password",message:"Please help me find support."}).success).toBe(false);
  });
});
