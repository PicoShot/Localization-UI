import { deflateSync, inflateSync } from "fflate";

/**
 * LocaleData interface defining the structure of localization data
 */
export interface LocaleData {
  version: number;
  languageCode: string;
  translations: Record<string, string | string[] | null | undefined>;
}

// Magic bytes "BLOC"
const MAGIC = new Uint8Array([0x42, 0x4c, 0x4f, 0x43]);
const VERSION = 1;
const LANGUAGE_CODE_SIZE = 12;

// Flags
const FLAG_COMPRESSED = 0x01;

function computeCrc32(data: Uint8Array, offset: number, count: number): number {
  const polynomial = 0xedb88320;
  let crc = 0xffffffff;

  for (let i = offset; i < offset + count; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ polynomial;
      } else {
        crc >>>= 1;
      }
    }
  }
  return ~crc >>> 0;
}

function getVarIntSize(value: number): number {
  if (value <= 0x7f) return 1;
  if (value <= 0x3fff) return 2;
  if (value <= 0x1fffff) return 3;
  if (value <= 0xfffffff) return 4;
  return 5;
}

/**
 * BLOC (Binary Localization Container) format serializer.
 * Optimized binary format with optional compression and string deduplication.
 */
export class LocaleBlocSerializer {
  /**
   * Serializes locale data to BLOC format with optional compression.
   */
  static serialize(data: LocaleData, compress: boolean = true): Uint8Array {
    if (!data || !data.translations) {
      throw new Error("Invalid locale data");
    }

    const stringPool = this.buildStringPool(data.translations);
    const stringToId = this.buildStringToIdMap(stringPool);

    const stringPoolBytes = stringPool.map((str) =>
      new TextEncoder().encode(str),
    );

    const entryTableSize = this.calculateEntryTableSize(data.translations);
    const stringPoolSize = this.calculateStringPoolSize(stringPoolBytes);
    const headerSize = 32;
    const uncompressedSize = headerSize + entryTableSize + stringPoolSize + 4; // header + table + pool + footer (CRC)

    const stringPoolOffset = headerSize + entryTableSize;
    const uncompressedData = new Uint8Array(uncompressedSize);
    const view = new DataView(
      uncompressedData.buffer,
      uncompressedData.byteOffset,
      uncompressedData.byteLength,
    );

    // Write header
    this.writeHeader(
      view,
      data.languageCode,
      Object.keys(data.translations).length,
      stringPool.length,
      stringPoolOffset,
      false,
    );
    let offset = headerSize;

    // Write entry table
    offset = this.writeEntryTable(view, offset, data.translations, stringToId);

    // Write string pool
    this.writeStringPool(uncompressedData, offset, stringPoolBytes);

    // Compute and write CRC32 over the uncompressed data so far (excluding the 4 bytes for CRC itself)
    const crc = computeCrc32(uncompressedData, 0, uncompressedData.length - 4);
    view.setUint32(uncompressedData.length - 4, crc, true);

    if (compress) {
      // Deflate using raw DEFLATE matching C#'s DeflateStream
      const compressed = deflateSync(uncompressedData, {
        level: 9,
      });

      if (compressed.length < uncompressedData.length - 4) {
        const result = new Uint8Array(32 + compressed.length);
        const resultView = new DataView(
          result.buffer,
          result.byteOffset,
          result.byteLength,
        );

        // Write header with uncompressed size in the stringPoolOffset field
        this.writeHeader(
          resultView,
          data.languageCode,
          Object.keys(data.translations).length,
          stringPool.length,
          uncompressedData.length,
          true,
        );

        // Write compressed data directly after header
        result.set(compressed, 32);

        return result;
      }
    }

    return uncompressedData;
  }

  /**
   * Deserializes BLOC format data.
   */
  static deserialize(data: Uint8Array): LocaleData {
    if (!data || data.length < 36) {
      // Header (32) + CRC32 (4)
      throw new Error("Data too short");
    }

    // Verify magic
    if (
      data[0] !== MAGIC[0] ||
      data[1] !== MAGIC[1] ||
      data[2] !== MAGIC[2] ||
      data[3] !== MAGIC[3]
    ) {
      throw new Error("Invalid BLOC magic");
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    // Check version
    const version = view.getUint16(4, true);
    if (version !== VERSION) {
      throw new Error(`Version ${version} not supported`);
    }

    // Check compression flag
    const flags = view.getUint16(6, true);
    const isCompressed = (flags & FLAG_COMPRESSED) !== 0;

    let uncompressedData: Uint8Array;

    if (isCompressed) {
      if (data.length < 36) throw new Error("Compressed data too short");

      const uncompressedSize = view.getUint32(28, true);
      if (uncompressedSize < 0 || uncompressedSize > 100_000_000) {
        // 100MB sanity check
        throw new Error("Invalid uncompressed size");
      }

      const compressedPayload = data.subarray(32);
      uncompressedData = inflateSync(compressedPayload, {
        out: new Uint8Array(uncompressedSize),
      });
    } else {
      uncompressedData = data;
    }

    const uncompressedView = new DataView(
      uncompressedData.buffer,
      uncompressedData.byteOffset,
      uncompressedData.byteLength,
    );

    // Read header
    const header = this.readHeader(uncompressedView);

    // Read entry table
    const translations = this.readEntryTable(
      uncompressedData,
      32,
      header.entryCount,
      header.stringPoolOffset,
      header.stringCount,
    );

    return {
      version: header.version,
      languageCode: header.languageCode,
      translations,
    };
  }

  /**
   * Validates a BLOC file buffer by checking magic, version, and CRC32 checksum.
   * Returns an object indicating success and containing the extracted language code.
   */
  static validateBuffer(data: Uint8Array): {
    isValid: boolean;
    languageCode: string | null;
  } {
    try {
      if (!data || data.length < 36)
        return { isValid: false, languageCode: null };

      if (
        data[0] !== MAGIC[0] ||
        data[1] !== MAGIC[1] ||
        data[2] !== MAGIC[2] ||
        data[3] !== MAGIC[3]
      ) {
        return { isValid: false, languageCode: null };
      }

      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const version = view.getUint16(4, true);
      if (version !== VERSION) return { isValid: false, languageCode: null };

      const langBytes = data.subarray(8, 8 + LANGUAGE_CODE_SIZE);
      let langLen = 0;
      while (langLen < LANGUAGE_CODE_SIZE && langBytes[langLen] !== 0)
        langLen++;
      const decoder = new TextDecoder("ascii");
      const languageCode = decoder.decode(langBytes.subarray(0, langLen));

      const flags = view.getUint16(6, true);
      const isCompressed = (flags & FLAG_COMPRESSED) !== 0;

      if (isCompressed) {
        // For compressed files, we can't easily validate CRC without decompressing
        if (data.length < 40) return { isValid: false, languageCode: null };
        return { isValid: true, languageCode };
      }

      // Validate CRC32 for uncompressed files
      const storedCrc = view.getUint32(data.length - 4, true);
      const computedCrc = computeCrc32(data, 0, data.length - 4);

      return {
        isValid: storedCrc === computedCrc,
        languageCode: storedCrc === computedCrc ? languageCode : null,
      };
    } catch {
      return { isValid: false, languageCode: null };
    }
  }

  private static buildStringPool(
    translations: Record<string, string | string[] | null | undefined>,
  ): string[] {
    const pool = new Set<string>();

    for (const [key, value] of Object.entries(translations)) {
      pool.add(key);

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== null && item !== undefined) pool.add(String(item));
        }
      } else if (value !== null && value !== undefined) {
        pool.add(String(value));
      }
    }

    return Array.from(pool);
  }

  private static buildStringToIdMap(pool: string[]): Map<string, number> {
    const map = new Map<string, number>();
    for (let i = 0; i < pool.length; i++) {
      map.set(pool[i], i);
    }
    return map;
  }

  private static calculateEntryTableSize(
    translations: Record<string, string | string[] | null | undefined>,
  ): number {
    let size = 0;
    for (const value of Object.values(translations)) {
      size += 4; // Key ID

      if (Array.isArray(value)) {
        size += 4; // Array header
        size += value.length * 4; // Item IDs
      } else {
        size += 4; // String ID
      }
    }
    return size;
  }

  private static calculateStringPoolSize(poolBytes: Uint8Array[]): number {
    let size = 0;
    for (const bytes of poolBytes) {
      size += getVarIntSize(bytes.length);
      size += bytes.length;
    }
    return size;
  }

  private static writeHeader(
    view: DataView,
    languageCode: string,
    entryCount: number,
    stringCount: number,
    stringPoolOffset: number,
    compressed: boolean,
  ) {
    let offset = 0;
    view.setUint8(offset++, MAGIC[0]);
    view.setUint8(offset++, MAGIC[1]);
    view.setUint8(offset++, MAGIC[2]);
    view.setUint8(offset++, MAGIC[3]);

    view.setUint16(offset, VERSION, true);
    offset += 2;

    const flags = compressed ? FLAG_COMPRESSED : 0;
    view.setUint16(offset, flags, true);
    offset += 2;

    const langBytes = new TextEncoder().encode(languageCode || "en");
    for (let i = 0; i < LANGUAGE_CODE_SIZE; i++) {
      view.setUint8(offset++, i < langBytes.length ? langBytes[i] : 0);
    }

    view.setUint32(offset, entryCount, true);
    offset += 4;

    view.setUint32(offset, stringCount, true);
    offset += 4;

    view.setUint32(offset, stringPoolOffset, true);
  }

  private static writeEntryTable(
    view: DataView,
    offset: number,
    translations: Record<string, string | string[] | null | undefined>,
    stringToId: Map<string, number>,
  ): number {
    for (const [key, value] of Object.entries(translations)) {
      // Key ID
      view.setUint32(offset, stringToId.get(key) || 0, true);
      offset += 4;

      // Value
      if (Array.isArray(value)) {
        view.setUint32(offset, (0x80000000 | value.length) >>> 0, true);
        offset += 4;
        for (const item of value) {
          const strVal =
            item !== null && item !== undefined ? String(item) : "";
          view.setUint32(offset, stringToId.get(strVal) || 0, true);
          offset += 4;
        }
      } else {
        const strVal =
          value !== null && value !== undefined ? String(value) : "";
        view.setUint32(offset, stringToId.get(strVal) || 0, true);
        offset += 4;
      }
    }
    return offset;
  }

  private static writeStringPool(
    data: Uint8Array,
    offset: number,
    poolBytes: Uint8Array[],
  ): number {
    for (const bytes of poolBytes) {
      offset = this.writeVarInt(data, offset, bytes.length);
      data.set(bytes, offset);
      offset += bytes.length;
    }
    return offset;
  }

  private static writeVarInt(
    data: Uint8Array,
    offset: number,
    value: number,
  ): number {
    while (value >= 0x80) {
      data[offset++] = (value | 0x80) & 0xff; // Set highest bit
      value >>>= 7;
    }
    data[offset++] = value & 0x7f; // Last byte
    return offset;
  }

  private static readHeader(view: DataView) {
    let offset = 4; // Skip magic

    const version = view.getUint16(offset, true);
    offset += 2;

    offset += 2; // Skip flags

    const langBytes = new Uint8Array(
      view.buffer,
      view.byteOffset + offset,
      LANGUAGE_CODE_SIZE,
    );
    let len = 0;
    while (len < LANGUAGE_CODE_SIZE && langBytes[len] !== 0) len++;
    const decoder = new TextDecoder("ascii");
    const languageCode = decoder.decode(langBytes.subarray(0, len));
    offset += LANGUAGE_CODE_SIZE;

    const entryCount = view.getUint32(offset, true);
    offset += 4;

    const stringCount = view.getUint32(offset, true);
    offset += 4;

    const stringPoolOffset = view.getUint32(offset, true);

    return { version, languageCode, entryCount, stringCount, stringPoolOffset };
  }

  private static readEntryTable(
    data: Uint8Array,
    offset: number,
    entryCount: number,
    stringPoolOffset: number,
    stringCount: number,
  ): Record<string, string | string[] | null | undefined> {
    const translations: Record<string, string | string[] | null | undefined> =
      {};

    const stringPool = this.readStringPool(data, stringPoolOffset, stringCount);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    for (let i = 0; i < entryCount; i++) {
      const keyId = view.getUint32(offset, true);
      offset += 4;
      const valueRef = view.getUint32(offset, true);
      offset += 4;

      const key = stringPool[keyId];

      if ((valueRef & 0x80000000) !== 0) {
        const count = valueRef & 0x7fffffff;
        const list: string[] = [];
        for (let j = 0; j < count; j++) {
          const itemId = view.getUint32(offset, true);
          offset += 4;
          list.push(stringPool[itemId]);
        }
        translations[key] = list;
      } else {
        translations[key] = stringPool[valueRef];
      }
    }

    return translations;
  }

  private static readStringPool(
    data: Uint8Array,
    offset: number,
    count: number,
  ): string[] {
    const pool: string[] = [];
    const decoder = new TextDecoder("utf-8");

    for (let i = 0; i < count; i++) {
      const { value: length, newOffset } = this.readVarInt(data, offset);
      offset = newOffset;

      if (length > 100000) {
        throw new Error(`Invalid string length: ${length}`);
      }

      const bytes = data.subarray(offset, offset + length);
      pool.push(decoder.decode(bytes));
      offset += length;
    }

    return pool;
  }

  private static readVarInt(
    data: Uint8Array,
    offset: number,
  ): { value: number; newOffset: number } {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = data[offset++];
      result |= (b & 0x7f) << shift;
      shift += 7;
    } while ((b & 0x80) !== 0);
    return { value: result >>> 0, newOffset: offset };
  }
}
