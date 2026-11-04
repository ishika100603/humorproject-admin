import { redirect } from "next/navigation";

// Photos and captions now live together on the Media page
export default function Images() {
  redirect("/media");
}
