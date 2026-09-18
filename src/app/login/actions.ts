"use server";

import { login as loginCommand, logout as logoutCommand } from "@/features/auth/commands";

export async function login(formData: FormData) {
  return loginCommand(formData);
}

export async function logout() {
  return logoutCommand();
}
