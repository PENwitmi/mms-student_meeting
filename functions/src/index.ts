import { storage } from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

admin.initializeApp();

// HEIC → JPEG変換関数（シンプルな実装）
export const convertHeicToJpeg = storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    
    // ファイルパスとコンテンツタイプのチェック
    if (!filePath || !contentType) {
      console.log('No file path or content type');
      return null;
    }
    
    // HEIC/HEIFファイル以外はスキップ
    if (!filePath.match(/\.(heic|heif)$/i)) {
      console.log('Not a HEIC file:', filePath);
      return null;
    }
    
    // 既に変換済みファイルの場合はスキップ（無限ループ防止）
    if (filePath.includes('_converted')) {
      console.log('Already converted file');
      return null;
    }
    
    const bucket = admin.storage().bucket(object.bucket);
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const nameWithoutExt = path.basename(fileName, path.extname(fileName));
    
    // 一時ファイルパス
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const tempJpegPath = path.join(os.tmpdir(), `${nameWithoutExt}_converted.jpg`);
    
    try {
      // 1. HEICファイルをダウンロード
      console.log('Downloading:', filePath);
      await bucket.file(filePath).download({
        destination: tempFilePath
      });
      
      // 2. Sharp でJPEG変換（シンプルな設定）
      console.log('Converting to JPEG...');
      await sharp(tempFilePath)
        .jpeg({
          quality: 90,
          progressive: true,
          mozjpeg: true
        })
        .toFile(tempJpegPath);
      
      // 3. 変換済みJPEGをアップロード
      const jpegFilePath = path.join(fileDir, `${nameWithoutExt}_converted.jpg`);
      console.log('Uploading JPEG:', jpegFilePath);
      
      await bucket.upload(tempJpegPath, {
        destination: jpegFilePath,
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            originalFile: filePath,
            convertedAt: new Date().toISOString()
          }
        }
      });
      
      // 4. 一時ファイル削除
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(tempJpegPath);
      
      console.log('Successfully converted:', filePath, '->', jpegFilePath);
      return { success: true, jpegPath: jpegFilePath };
      
    } catch (error) {
      console.error('Conversion error:', error);
      // エラー発生時も一時ファイルを削除
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(tempJpegPath)) fs.unlinkSync(tempJpegPath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      throw error;
    }
  });