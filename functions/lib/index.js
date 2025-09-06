"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHeicToJpeg = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const sharp_1 = __importDefault(require("sharp"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
admin.initializeApp();
// HEIC → JPEG変換関数（大阪リージョン）
exports.convertHeicToJpeg = functions
    .region('asia-northeast2') // 大阪リージョン
    .runWith({
    timeoutSeconds: 120,
    memory: '512MB'
})
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
    const bucket = admin.storage().bucket('mms-student-meeting.appspot.com');
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const nameWithoutExt = path.basename(fileName, path.extname(fileName));
    // 一時ファイルパス
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const tempJpegPath = path.join(os.tmpdir(), `${nameWithoutExt}_converted.jpg`);
    try {
        // 1. HEICファイルをダウンロード
        console.log('Downloading HEIC file:', filePath);
        await bucket.file(filePath).download({
            destination: tempFilePath
        });
        // 2. Sharp でJPEG変換
        console.log('Converting to JPEG...');
        await (0, sharp_1.default)(tempFilePath)
            .jpeg({
            quality: 90,
            progressive: true,
            mozjpeg: true
        })
            .toFile(tempJpegPath);
        // 3. 変換済みJPEGをアップロード
        const jpegFilePath = path.join(fileDir, `${nameWithoutExt}_converted.jpg`);
        console.log('Uploading converted JPEG:', jpegFilePath);
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
        // 4. Firestoreにも変換済みファイル情報を記録
        const db = admin.firestore();
        const originalFileDoc = await db.collection('files')
            .where('fileName', '==', fileName)
            .limit(1)
            .get();
        if (!originalFileDoc.empty) {
            const doc = originalFileDoc.docs[0];
            await doc.ref.update({
                convertedFileName: `${nameWithoutExt}_converted.jpg`,
                convertedFileUrl: await bucket.file(jpegFilePath).getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500'
                }).then(urls => urls[0]),
                convertedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // 5. 一時ファイル削除
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(tempJpegPath);
        console.log('Successfully converted:', filePath, '->', jpegFilePath);
        return {
            success: true,
            originalPath: filePath,
            convertedPath: jpegFilePath
        };
    }
    catch (error) {
        console.error('Conversion error:', error);
        // エラー発生時も一時ファイルを削除
        try {
            if (fs.existsSync(tempFilePath))
                fs.unlinkSync(tempFilePath);
            if (fs.existsSync(tempJpegPath))
                fs.unlinkSync(tempJpegPath);
        }
        catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }
        throw error;
    }
});
//# sourceMappingURL=index.js.map