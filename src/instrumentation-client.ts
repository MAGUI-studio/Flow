import { installReactDevPerformanceFix } from "@/lib/react-dev-performance";

if (
  process.env.NODE_ENV === "development" &&
  typeof performance !== "undefined"
) {
  installReactDevPerformanceFix(performance, process.env.NODE_ENV);
}
