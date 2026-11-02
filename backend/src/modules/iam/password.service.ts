import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
@Injectable()
export class PasswordService {
  async hash(value: string): Promise<string> {
    const salt = randomBytes(16);
    const key = (await scrypt(value, salt, 64)) as Buffer;
    return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
  }
  async verify(value: string, encoded: string): Promise<boolean> {
    const [algorithm, saltHex, keyHex] = encoded.split(':');
    if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = (await scrypt(value, Buffer.from(saltHex, 'hex'), expected.length)) as Buffer;
    return timingSafeEqual(expected, actual);
  }
}
