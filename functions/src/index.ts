import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();

// HEIC → JPEG変換関数（大阪リージョン）
export const convertHeicToJpeg = functions
  .region('asia-northeast2')  // 大阪リージョン
  .storage
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
    
    console.log('HEIC file detected:', filePath);
    console.log('Note: Actual conversion requires sharp package installation');
    
    // TODO: Sharp パッケージをインストール後、変換処理を実装
    // npm install sharp @types/sharp
    
    return { 
      message: 'HEIC file detected (conversion not yet implemented)',
      filePath: filePath,
      status: 'pending_implementation'
    };
  });