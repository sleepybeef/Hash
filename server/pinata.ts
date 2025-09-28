
import fs from "fs";
import axios from "axios";
import FormData from "form-data";



export async function uploadFileToPinata(filePath: string, options: { name?: string } = {}) {
  // Use Pinata REST API for Node.js compatibility
  const buffer = await fs.promises.readFile(filePath);
  const form = new FormData();
  form.append('file', buffer, {
    filename: options.name || filePath.split('/').pop() || 'video.mp4',
    contentType: 'video/mp4',
  });

  // Optional: add metadata
  form.append('pinataMetadata', JSON.stringify({ name: options.name || 'video.mp4' }));

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    form,
    {
      maxBodyLength: Infinity,
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    }
  );
  return response.data.IpfsHash;
}
