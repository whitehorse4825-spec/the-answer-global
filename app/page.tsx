import { redirect } from "next/navigation";

export default function RootPage() {
  // locale-based routing: `/` -> `/ko`
  redirect("/ko");
}
