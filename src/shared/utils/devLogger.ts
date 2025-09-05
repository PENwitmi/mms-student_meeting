/**
 * 開発環境用のログユーティリティ
 * 本番環境では自動的にログが無効化される
 */

const isDevelopment = import.meta.env.DEV;

export const dev = {
  log: (context: string, message: string, data?: any) => {
    if (isDevelopment) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      const prefix = `[${timestamp}] [${context}]`;
      
      if (data !== undefined) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  },
  
  warn: (context: string, message: string, data?: any) => {
    if (isDevelopment) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      const prefix = `[${timestamp}] [${context}]`;
      
      if (data !== undefined) {
        console.warn(`${prefix} ⚠️ ${message}`, data);
      } else {
        console.warn(`${prefix} ⚠️ ${message}`);
      }
    }
  },
  
  error: (context: string, message: string, error?: any) => {
    if (isDevelopment) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      const prefix = `[${timestamp}] [${context}]`;
      
      if (error !== undefined) {
        console.error(`${prefix} ❌ ${message}`, error);
      } else {
        console.error(`${prefix} ❌ ${message}`);
      }
    }
  }
};