"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toNullableIso(dateString?: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function createShareLink(
  packetId: string,
  expiresAt?: string | null
): Promise<ActionResult<{ token: string }>> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Share links are disabled in this build." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const { data: packet, error: packetError } = await supabase
    .from("data_packets")
    .select("id, owner_id")
    .eq("id", packetId)
    .single();

  if (packetError || !packet) {
    return { success: false, error: "Packet not found." };
  }

  if (packet.owner_id !== user.id) {
    return { success: false, error: "You do not own this packet." };
  }

  const token = randomUUID();
  const { error } = await supabase.from("data_packet_shares").insert({
    packet_id: packetId,
    share_type: "link",
    share_token: token,
    expires_at: toNullableIso(expiresAt),
    created_by: user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { token } };
}

export async function createInvite(
  packetId: string,
  email: string,
  expiresAt?: string | null
): Promise<ActionResult<{ email: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    return { success: false, error: "Please enter a valid email." };
  }

  const { data: packet, error: packetError } = await supabase
    .from("data_packets")
    .select("id, owner_id")
    .eq("id", packetId)
    .single();

  if (packetError || !packet) {
    return { success: false, error: "Packet not found." };
  }

  if (packet.owner_id !== user.id) {
    return { success: false, error: "You do not own this packet." };
  }

  const { error } = await supabase.from("data_packet_shares").insert({
    packet_id: packetId,
    share_type: "invite",
    invited_email: normalized,
    expires_at: toNullableIso(expiresAt),
    created_by: user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { email: normalized } };
}
