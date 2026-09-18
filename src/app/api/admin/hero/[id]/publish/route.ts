import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ published: z.boolean() });

// A lightweight sibling to PATCH /api/admin/hero/[id] (which requires the
// full section form's payload) - just for the listing's quick
// Publish/Unpublish toggle, without opening each section.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const slide = await prisma.homeHeroSlide.update({ where: { id }, data: { published: body.published } });
  revalidatePath("/");
  return NextResponse.json({ slide });
}
