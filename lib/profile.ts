import { api } from "@/lib/api";

export type UserProfile = {
  userId: string;
  fullName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getProfile() {
  const res = await api.get<{ data: UserProfile }>("/profile");
  return res.data.data;
}

export type UpdateProfileInput = {
  fullName?: string;
  companyName?: string;
  address?: string;
  avatar?: File | null;
};

export async function updateProfile(input: UpdateProfileInput) {
  const fd = new FormData();
  if (input.fullName !== undefined) fd.append("fullName", input.fullName);
  if (input.companyName !== undefined) fd.append("companyName", input.companyName);
  if (input.address !== undefined) fd.append("address", input.address);
  if (input.avatar) fd.append("avatar", input.avatar);

  const res = await api.patch<{ data: UserProfile; message: string }>("/profile", fd);
  return res.data.data;
}
