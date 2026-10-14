import { redirect } from "next/navigation";
export async function redirectAuth(
  path: string,
  parts: string[] | undefined,
  search: Record<string, string | string[] | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const suffix = parts?.length
    ? "/" + parts.map(encodeURIComponent).join("/")
    : "";
  redirect(path + suffix + (query.size ? "?" + query.toString() : ""));
}
