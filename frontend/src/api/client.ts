import createClient from "openapi-fetch"
import type { paths } from "./schema"

declare const __API_PATH__: string;
export const client = createClient<paths>({ baseUrl: __API_PATH__ })
