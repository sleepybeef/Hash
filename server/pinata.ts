import PinataClient from '@pinata/sdk';
import fs from 'fs';
import path from 'path';

const pinata = new PinataClient({
  pinataApiKey: process.env.VITE_PINATA_API_KEY || process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.VITE_PINATA_API_SECRET || process.env.PINATA_API_SECRET,
});

export async function uploadFileToPinata(filePath: string, options: { name?: string } = {}) {
  const stream = fs.createReadStream(filePath);
  const pinataOptions: any = {};
  if (options.name) {
    pinataOptions.pinataMetadata = { name: options.name };
  }
  const result = await pinata.pinFileToIPFS(stream, pinataOptions);
  return result.IpfsHash;
}
