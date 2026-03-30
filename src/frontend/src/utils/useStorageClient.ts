import { HttpAgent } from "@icp-sdk/core/agent";
import { useRef } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "./StorageClient";

let clientPromise: Promise<StorageClient> | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    })();
  }
  return clientPromise;
}

export function useStorageClient() {
  const uploadImage = useRef(
    async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
      const client = await getStorageClient();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await client.putFile(bytes, onProgress);
      return client.getDirectURL(hash);
    },
  ).current;

  return { uploadImage };
}
