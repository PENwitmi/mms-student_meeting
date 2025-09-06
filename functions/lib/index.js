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
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHeicToJpeg = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// HEIC → JPEG変換関数（大阪リージョン）
exports.convertHeicToJpeg = functions
    .region('asia-northeast2') // 大阪リージョン
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
//# sourceMappingURL=index.js.map