import { redirect } from "next/navigation";

export default function StoryStudioRedirectPage() {
  redirect("/dashboard/characters");
}
