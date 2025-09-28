
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

export async function uploadToPinata(file: File) {
  // V2 SDK: public upload
  const upload = await pinata.upload.public.file(file);
  return upload.cid; // This is the CID
}
