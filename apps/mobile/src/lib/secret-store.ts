import { YohakuNative } from '@modules/yohaku'

export const secretStore = {
  deleteItem(key: string) {
    YohakuNative.secretDelete(key)
  },
  getItem(key: string): string | null {
    return YohakuNative.secretGet(key)
  },
  async getItemAsync(key: string): Promise<string | null> {
    return secretStore.getItem(key)
  },
  setItem(key: string, value: string) {
    YohakuNative.secretSet(key, value)
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    secretStore.setItem(key, value)
  },
}

export const secretStoreAsync = {
  deleteItem: (key: string) => {
    secretStore.deleteItem(key)
    return Promise.resolve()
  },
  getItem: (key: string) => Promise.resolve(secretStore.getItem(key)),
  setItem: (key: string, value: string) => {
    secretStore.setItem(key, value)
    return Promise.resolve()
  },
}
