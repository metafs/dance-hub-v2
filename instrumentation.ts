import { validateEnvironment } from "./src/lib/env";

export async function register() {
  validateEnvironment();
}
