import { spawn } from "child_process";
import path from "path";

export async function convertMovToMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegArgs = [
      "-y", // overwrite
      "-i", inputPath,
      "-c:v", "libx264",
      "-profile:v", "baseline",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      outputPath,
    ];
    console.log("[ffmpeg-util] Spawning ffmpeg with args:", ffmpegArgs);
    console.log("[ffmpeg-util] Input path:", inputPath);
    console.log("[ffmpeg-util] Output path:", outputPath);
    const ffmpeg = spawn("ffmpeg", ffmpegArgs);
    ffmpeg.on("error", (err) => {
      console.error("[ffmpeg-util] ffmpeg process error:", err);
      reject(err);
    });
    ffmpeg.stderr.on("data", (data) => {
      console.error("[ffmpeg-util] ffmpeg stderr:", data.toString());
    });
    ffmpeg.on("close", (code) => {
      console.log(`[ffmpeg-util] ffmpeg exited with code ${code}`);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}
