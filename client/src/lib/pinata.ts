import PinataClient from '@pinata/sdk';

const pinata = new PinataClient({
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY,
  pinataSecretApiKey: import.meta.env.VITE_PINATA_API_SECRET,
});

export async function uploadToPinata(file: File) {
  const data = new FormData();
  data.append('file', file);

  const result = await pinata.pinFileToIPFS(data);
  return result.IpfsHash; // This is the CID
}
