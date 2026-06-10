import apiClient from "../api/client";
import { tokenManager } from "./tokenManager";
import type { User } from "../../modules/auth/types";

interface AuthPayload {
  user: User;
  access_token: string;
  refresh_token: string;
}

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthPayload> {
    const { data } = await apiClient.post<AuthPayload>("/auth/register", {
      name,
      email,
      password,
    });
    await tokenManager.saveTokens(data.access_token, data.refresh_token);
    return data;
  },

  async login(email: string, password: string): Promise<AuthPayload> {
    const { data } = await apiClient.post<AuthPayload>("/auth/login", {
      email,
      password,
    });
    await tokenManager.saveTokens(data.access_token, data.refresh_token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      await tokenManager.clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
};
