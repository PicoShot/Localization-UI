import { useState, useCallback } from "react";
import { Card, Flex, Text, Button } from "@radix-ui/themes";
import { LocaleBlocSerializer, LocaleData } from "../lib/bloc";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile, readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

interface DragDropZoneProps {
  onParsed: (data: LocaleData[]) => void;
  onError: (error: string) => void;
}

export function DragDropZone({ onParsed, onError }: DragDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  // Helper to read standard web File objects sequentially
  const processWebFiles = async (files: File[]) => {
    const parsedFiles: LocaleData[] = [];
    for (const file of files) {
      if (!file.name.endsWith(".bloc")) continue;
      try {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const validation = LocaleBlocSerializer.validateBuffer(uint8Array);
        if (validation.isValid) {
          parsedFiles.push(LocaleBlocSerializer.deserialize(uint8Array));
        }
      } catch (err) {
        console.error("Parse error on file", file.name, err);
      }
    }

    if (parsedFiles.length === 0) {
      onError("No valid BLOC files found.");
    } else {
      onParsed(parsedFiles);
    }
    setIsProcessing(false);
  };

  const getFilesFromDataTransferItems = async (
    items: DataTransferItemList,
  ): Promise<File[]> => {
    const files: File[] = [];
    const queue: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) queue.push(item);
    }

    while (queue.length > 0) {
      const entry = queue.shift();
      if (entry.isFile && entry.name.endsWith(".bloc")) {
        const file = await new Promise<File>((resolve) => entry.file(resolve));
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise<any[]>((resolve) => {
          // readEntries needs to be called recurrently to get all, but 1 call gets 100 which is fine mostly.
          reader.readEntries((results: any[]) => resolve(results));
        });
        queue.push(...entries);
      }
    }
    return files;
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      setIsProcessing(true);

      try {
        const files = await getFilesFromDataTransferItems(e.dataTransfer.items);
        await processWebFiles(files);
      } catch (err: any) {
        onError("Drag logic error: " + err.message);
        setIsProcessing(false);
      }
    },
    [onParsed, onError],
  );

  // Helper for reading absolute paths obtained from Tauri Dialog
  const readBlocFilesFromPaths = async (
    paths: string[],
  ): Promise<Uint8Array[]> => {
    const buffers: Uint8Array[] = [];
    for (const p of paths) {
      if (p.endsWith(".bloc")) {
        try {
          const buf = await readFile(p);
          buffers.push(buf);
        } catch {}
      } else {
        try {
          const entries = await readDir(p);
          const subPaths: string[] = [];
          for (const entry of entries) {
            if (entry.isDirectory || entry.name.endsWith(".bloc")) {
              subPaths.push(await join(p, entry.name));
            }
          }
          if (subPaths.length > 0) {
            const subBuffers = await readBlocFilesFromPaths(subPaths);
            buffers.push(...subBuffers);
          }
        } catch {}
      }
    }
    return buffers;
  };

  const processTauriPaths = async (paths: string[]) => {
    setIsProcessing(true);
    try {
      const buffers = await readBlocFilesFromPaths(paths);
      const parsedFiles: LocaleData[] = [];

      for (const buffer of buffers) {
        const validation = LocaleBlocSerializer.validateBuffer(buffer);
        if (validation.isValid) {
          parsedFiles.push(LocaleBlocSerializer.deserialize(buffer));
        }
      }

      if (parsedFiles.length === 0) {
        onError("No valid BLOC files found at the selected path(s).");
      } else {
        onParsed(parsedFiles);
      }
    } catch (err: any) {
      onError("Failed to read selected files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileSelect = async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: "BLOC Files", extensions: ["bloc"] }],
    });
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      // Note: the "open" dialog with plugin-dialog returns either string or null. Oh wait, v2 might return an array of objects or strings
      // to be safe let's extract standard path property if it's an object else assume it's string.
      const stringPaths = paths.map((p: any) =>
        typeof p === "string" ? p : p.path,
      );

      await processTauriPaths(stringPaths);
    }
  };

  const triggerFolderSelect = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      const stringPaths = paths.map((p: any) =>
        typeof p === "string" ? p : p.path,
      );
      await processTauriPaths(stringPaths);
    }
  };

  return (
    <Card
      size="4"
      style={{
        border: isDragActive
          ? "2px dashed var(--accent-a9)"
          : "2px dashed var(--gray-a6)",
        backgroundColor: isDragActive ? "var(--accent-a3)" : "var(--gray-a2)",
        transition: "all 0.2s ease-in-out",
        minHeight: "150px",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="4"
        style={{ height: "100%" }}
      >
        <Flex direction="column" align="center" gap="1">
          <Text size="5" weight="bold" color={isDragActive ? "blue" : "gray"}>
            {isProcessing
              ? "Processing..."
              : isDragActive
                ? "Drop files now!"
                : "Drag & Drop BLOC files or folders"}
          </Text>
          <Text size="2" color="gray">
            All files within folders will be extracted
          </Text>
        </Flex>

        <Flex gap="3" mt="2">
          <Button
            disabled={isProcessing}
            onClick={triggerFileSelect}
            variant="surface"
          >
            Select Files
          </Button>
          <Button
            disabled={isProcessing}
            onClick={triggerFolderSelect}
            variant="surface"
          >
            Select Folder
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
