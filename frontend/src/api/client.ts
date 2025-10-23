import createClient from "openapi-fetch"
import type { paths } from "./schema"

declare const __BASE_PATH__: string;
export const client = createClient<paths>({ baseUrl: __BASE_PATH__ })
