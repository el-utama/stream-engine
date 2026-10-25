// Server Encryption - Re-export Shared

import { EncryptionService, createEncryptionService, getEncryptionService, setEncryptionService } from '@stream-engine/shared/utils/encryption';
import { config } from '../config/index.js';

let initialized = false;

export function initEncryption(): EncryptionService {
  if (initialized) return getEncryptionService();
  const service = createEncryptionService(config.MASTER_KEY);
  setEncryptionService(service);
  initialized = true;
  return service;
}

export function getEncryption(): EncryptionService {
  if (!initialized) return initEncryption();
  return getEncryptionService();
}

export { EncryptionService };