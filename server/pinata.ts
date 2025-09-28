
import { PinataSDK } from "pinata";
import fs from "fs";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

export async function uploadFileToPinata(filePath: string, options: { name?: string } = {}) {
  const stream = fs.createReadStream(filePath);
  // V2 SDK: public upload with name
  let upload = pinata.upload.public.file(stream);
  if (options.name) {
    upload = upload.name(options.name);
  }
  const result = await upload;
  return result.cid;
}
