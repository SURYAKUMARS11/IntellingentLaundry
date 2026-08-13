import WhatsAppSession from '../models/WhatsAppSession';
import { proto, BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';

export const useMongoAuthState = async () => {
  const writeData = async (data: any, key: string) => {
    try {
      const serialized = JSON.stringify(data, BufferJSON.replacer);
      await WhatsAppSession.findOneAndUpdate(
        { key },
        { key, value: serialized },
        { upsert: true, new: true }
      );
    } catch (err: any) {
      console.error(`[MongoAuthState Write Error for ${key}]:`, err.message);
    }
  };

  const readData = async (key: string) => {
    try {
      const doc = await WhatsAppSession.findOne({ key });
      if (!doc || !doc.value) return null;
      return JSON.parse(doc.value, BufferJSON.reviver);
    } catch (err: any) {
      console.error(`[MongoAuthState Read Error for ${key}]:`, err.message);
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      await WhatsAppSession.deleteOne({ key });
    } catch (err: any) {
      console.error(`[MongoAuthState Remove Error for ${key}]:`, err.message);
    }
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [id: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<any>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => {
      return writeData(creds, 'creds');
    },
    clearState: async () => {
      try {
        await WhatsAppSession.deleteMany({});
      } catch (err: any) {
        console.error('[MongoAuthState Clear Error]:', err.message);
      }
    },
  };
};
