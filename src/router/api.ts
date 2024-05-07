import { inject } from "@/core";
import { routeKey, routerKey } from "./router";

export const useRoute = () => inject(routeKey)!;
export const useRouter = () => inject(routerKey)!;
