import SparkMD5 from 'spark-md5';

/**
 * 计算 Fast-MD5: MD5(file_size + first_64KB_content)
 * Fast-MD5 is a quick hash method that combines file size with first 64KB of content
 * for efficient deduplication without reading the entire file.
 * 
 * @param file 要计算哈希的文件
 * @param onProgress 进度回调 (0-100)
 * @returns Promise<string> 32字符的MD5哈希值
 */
export async function computeFastMd5(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const fileSize = file.size;
  const chunkSize = Math.min(64 * 1024, fileSize); // 64KB 或文件大小
  
  onProgress?.(0);
  
  // 读取前 64KB
  const chunk = file.slice(0, chunkSize);
  const chunkBuffer = await chunk.arrayBuffer();
  
  onProgress?.(50);
  
  // 组合: file_size (8 bytes little-endian) + first_64KB
  const sizeBuffer = new ArrayBuffer(8);
  new DataView(sizeBuffer).setBigUint64(0, BigInt(fileSize), true);
  
  const combined = new Uint8Array(8 + chunkBuffer.byteLength);
  combined.set(new Uint8Array(sizeBuffer), 0);
  combined.set(new Uint8Array(chunkBuffer), 8);
  
  // 计算 MD5
  const spark = new SparkMD5.ArrayBuffer();
  spark.append(combined);
  
  onProgress?.(100);
  
  return spark.end();
}