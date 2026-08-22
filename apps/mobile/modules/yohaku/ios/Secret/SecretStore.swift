import Foundation
import Security

enum SecretStore {
  private static let service = "yohaku.secret"
  private static let expoServices = ["app:no-auth", "app"]

  static func get(_ key: String) throws -> String? {
    if let value = try read(service: service, account: key) {
      return value
    }
    let encoded = Data(key.utf8)
    for expoService in expoServices {
      guard let value = try readExpo(service: expoService, encodedKey: encoded) else {
        continue
      }
      try set(key, value)
      deleteExpo(service: expoService, encodedKey: encoded)
      return value
    }
    return nil
  }

  static func set(_ key: String, _ value: String) throws {
    guard let data = value.data(using: .utf8) else {
      throw SecretStoreError.encoding
    }
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
    ]
    let update: [String: Any] = [
      kSecValueData as String: data,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
    ]
    let status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
    if status == errSecSuccess {
      return
    }
    if status != errSecItemNotFound {
      throw SecretStoreError.keychain(status)
    }
    var add = query
    add[kSecValueData as String] = data
    add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
    let addStatus = SecItemAdd(add as CFDictionary, nil)
    guard addStatus == errSecSuccess else {
      throw SecretStoreError.keychain(addStatus)
    }
  }

  static func delete(_ key: String) {
    delete(service: service, account: key)
    let encoded = Data(key.utf8)
    for expoService in expoServices {
      deleteExpo(service: expoService, encodedKey: encoded)
    }
  }

  private static func read(service: String, account: String) throws -> String? {
    try read(service: service, accountValue: account)
  }

  private static func readExpo(service: String, encodedKey: Data) throws -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: encodedKey,
      kSecAttrGeneric as String: encodedKey,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnData as String: true,
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    if status == errSecItemNotFound {
      return nil
    }
    guard status == errSecSuccess else {
      throw SecretStoreError.keychain(status)
    }
    guard let data = item as? Data else {
      return nil
    }
    return String(data: data, encoding: .utf8)
  }

  private static func deleteExpo(service: String, encodedKey: Data) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: encodedKey,
      kSecAttrGeneric as String: encodedKey,
    ]
    SecItemDelete(query as CFDictionary)
  }

  private static func read(service: String, accountValue: Any) throws -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: accountValue,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnData as String: true,
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    if status == errSecItemNotFound {
      return nil
    }
    guard status == errSecSuccess else {
      throw SecretStoreError.keychain(status)
    }
    guard let data = item as? Data else {
      return nil
    }
    return String(data: data, encoding: .utf8)
  }

  private static func delete(service: String, account: String) {
    delete(service: service, accountValue: account)
  }

  private static func delete(service: String, accountValue: Any) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: accountValue,
    ]
    SecItemDelete(query as CFDictionary)
  }
}

enum SecretStoreError: Error {
  case encoding
  case keychain(OSStatus)
}
