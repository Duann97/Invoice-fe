"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type ProfileResponse =
  | {
      id?: string;
      fullName?: string | null;
      companyName?: string | null;
      address?: string | null;
      avatarUrl?: string | null;
      user?: { email?: string | null } | null;
    }
  | any;

const MAX_AVATAR_MB = 2;

function isAxiosUnauthorized(err: any) {
  return err?.response?.status === 401;
}

// ✅ helper: kalau server ngasih kosong/null/undefined, pakai fallback (nilai input user)
function preferText(serverValue: any, fallback: string) {
  if (serverValue === undefined || serverValue === null) return fallback;
  const s = String(serverValue);
  return s.trim() === "" ? fallback : s;
}

export default function ProfilePage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // editable fields
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // keep initial snapshot for "no changes" guard
  const initialRef = useRef({
    fullName: "",
    companyName: "",
    address: "",
    avatarUrl: "",
  });

  const fetchProfile = async () => {
    setErr(null);
    setInfo(null);
    setLoading(true);

    try {
      const t = token ?? "";
      if (!t) {
        router.replace("/login");
        return;
      }

      // asumsi endpoint: GET /profile
      const res = await api.get("/profile", {
        headers: { Authorization: `Bearer ${t}` },
      });

      const data = res.data?.data ?? res.data;
      setProfile(data);

      const nextFullName = (data?.fullName ?? "").toString();
      const nextCompanyName = (data?.companyName ?? "").toString();
      const nextAddress = (data?.address ?? "").toString();
      const nextAvatarUrl = (data?.avatarUrl ?? "").toString();

      setFullName(nextFullName);
      setCompanyName(nextCompanyName);
      setAddress(nextAddress);
      setAvatarUrl(nextAvatarUrl);

      initialRef.current = {
        fullName: nextFullName,
        companyName: nextCompanyName,
        address: nextAddress,
        avatarUrl: nextAvatarUrl,
      };
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Gagal load profile.";
      setErr(msg);

      if (isAxiosUnauthorized(e)) {
        clearToken();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickAvatar = (file: File | null) => {
    setErr(null);
    setInfo(null);

    if (!file) {
      setAvatarFile(null);
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErr("Format avatar harus JPG/PNG/WEBP.");
      return;
    }

    const maxBytes = MAX_AVATAR_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErr(`Ukuran avatar maksimal ${MAX_AVATAR_MB}MB.`);
      return;
    }

    setAvatarFile(file);

    // preview di UI (tanpa upload dulu)
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
  };

  const hasChanges = () => {
    const init = initialRef.current;
    const changedText =
      fullName.trim() !== init.fullName.trim() ||
      companyName.trim() !== init.companyName.trim() ||
      address.trim() !== init.address.trim();

    const changedAvatar = !!avatarFile; // kalau ada file berarti berubah
    return changedText || changedAvatar;
  };

  const onSave = async () => {
    setErr(null);
    setInfo(null);

    const t = token ?? "";
    if (!t) {
      router.replace("/login");
      return;
    }

    // ✅ Guard: jangan kirim request kosong (ini biang error "Request body is required")
    if (!hasChanges()) {
      setErr("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setSaving(true);
    try {
      // Kalau upload avatar: pakai FormData
      if (avatarFile) {
        const fd = new FormData();
        fd.append("fullName", fullName.trim());
        fd.append("companyName", companyName.trim());
        fd.append("address", address.trim());
        fd.append("avatar", avatarFile);

        // penting: JANGAN set Content-Type manual.
        const res = await api.patch("/profile", fd, {
          headers: {
            Authorization: `Bearer ${t}`,
          },
        });

        const updated = res.data?.data ?? res.data;

        // ✅ SAFE MERGE: kalau server balikin kosong, jangan overwrite input user
        const merged = {
          ...(profile ?? {}),
          ...(updated ?? {}),
          fullName: preferText(updated?.fullName, fullName.trim()),
          companyName: preferText(updated?.companyName, companyName.trim()),
          address: preferText(updated?.address, address.trim()),
          avatarUrl: preferText(updated?.avatarUrl, avatarUrl),
        };

        setProfile(merged);
        setInfo(res.data?.message ?? "Profile berhasil diupdate.");

        const updatedFullName = (merged?.fullName ?? "").toString();
        const updatedCompanyName = (merged?.companyName ?? "").toString();
        const updatedAddress = (merged?.address ?? "").toString();
        const updatedAvatarUrl = (merged?.avatarUrl ?? "").toString();

        setFullName(updatedFullName);
        setCompanyName(updatedCompanyName);
        setAddress(updatedAddress);
        if (updatedAvatarUrl) setAvatarUrl(updatedAvatarUrl);

        initialRef.current = {
          fullName: updatedFullName,
          companyName: updatedCompanyName,
          address: updatedAddress,
          avatarUrl: updatedAvatarUrl || initialRef.current.avatarUrl,
        };

        setAvatarFile(null);
        return;
      }

      // Kalau tidak upload avatar: kirim JSON biasa
      const payload = {
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        address: address.trim(),
      };

      const res = await api.patch("/profile", payload, {
        headers: { Authorization: `Bearer ${t}` },
      });

      const updated = res.data?.data ?? res.data;

      // ✅ SAFE MERGE (ini yang bikin address gak ilang)
      const merged = {
        ...(profile ?? {}),
        ...(updated ?? {}),
        fullName: preferText(updated?.fullName, payload.fullName),
        companyName: preferText(updated?.companyName, payload.companyName),
        address: preferText(updated?.address, payload.address),
        avatarUrl: preferText(updated?.avatarUrl, avatarUrl),
      };

      setProfile(merged);
      setInfo(res.data?.message ?? "Profile berhasil diupdate.");

      const updatedFullName = (merged?.fullName ?? "").toString();
      const updatedCompanyName = (merged?.companyName ?? "").toString();
      const updatedAddress = (merged?.address ?? "").toString();
      const updatedAvatarUrl = (merged?.avatarUrl ?? "").toString();

      setFullName(updatedFullName);
      setCompanyName(updatedCompanyName);
      setAddress(updatedAddress);
      setAvatarUrl(updatedAvatarUrl);

      initialRef.current = {
        fullName: updatedFullName,
        companyName: updatedCompanyName,
        address: updatedAddress,
        avatarUrl: updatedAvatarUrl,
      };
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Gagal update profile.";
      setErr(msg);

      if (isAxiosUnauthorized(e)) {
        clearToken();
        router.replace("/login");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">User Profile</h1>
          <p className="mt-1 text-sm text-white/70">
            Update fullName, companyName, address, dan avatar.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Back
        </Link>
      </div>

      {err ? (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      {info ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {info}
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        {loading ? (
          <div className="text-sm text-white/70">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="avatar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                    No Avatar
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Avatar</div>
                <div className="mt-1 text-xs text-white/60">
                  JPG/PNG/WEBP, max {MAX_AVATAR_MB}MB.
                </div>

                <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                  Choose File
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                  />
                </label>

                {avatarFile ? (
                  <div className="mt-2 text-xs text-white/60">
                    Selected: {avatarFile.name}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/80">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className="text-sm text-white/80">Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                  placeholder="Nama perusahaan"
                />
              </div>

              <div>
                <label className="text-sm text-white/80">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                  placeholder="Alamat"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={fetchProfile}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                disabled={loading || saving}
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={onSave}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                disabled={loading || saving}
                title="Simpan perubahan profile"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Debug helper (optional) */}
            {/* <pre className="text-xs text-white/40">{JSON.stringify(profile, null, 2)}</pre> */}
          </div>
        )}
      </div>
    </div>
  );
}
