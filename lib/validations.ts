import { z } from "zod"

export const testCaseSchema = z.object({
    input: z.string().min(1, "Input is required"),
    expectedOutput: z.string().optional().nullable(),
    keywords: z.array(z.string()).optional().default([]),
    description: z.string().optional().nullable(),
})

export type TestCaseInput = z.infer<typeof testCaseSchema>
