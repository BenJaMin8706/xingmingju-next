import { NextRequest, NextResponse } from "next/server";
import { categories, categoryLabelMap, skills } from "@/lib/fortune-data";

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const activeCategory = searchParams.get("category") || "all";
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  const filteredSkills = skills.filter((skill) => {
    const categoryMatch = activeCategory === "all" || skill.category.includes(activeCategory);
    const categoryLabels = skill.category.map((category) => categoryLabelMap.get(category) || category).join(" ");
    const text = [skill.title, skill.teacher, skill.desc, skill.tag, categoryLabels].join(" ").toLowerCase();
    return categoryMatch && (!query || text.includes(query));
  });

  return NextResponse.json({ categories, skills: filteredSkills, total: skills.length });
}
