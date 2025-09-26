import PinataClient from '@pinata/sdk';
import fs from 'fs';
import path from 'path';

const pinata = new PinataClient({
  pinataApiKey: process.env.VITE_PINATA_API_KEY || process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.VITE_PINATA_API_SECRET || process.env.PINATA_API_SECRET,
});

export async function uploadFileToPinata(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const result = await pinata.pinFileToIPFS(stream);
  return result.IpfsHash;
}
