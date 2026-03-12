import { create } from "zustand";
import { check, Update } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";

interface UpdateState {
  updateAvailable: boolean;
  updateDetails: Update | null;
  isChecking: boolean;
  isUpdating: boolean;
  checkUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  updateAvailable: false,
  updateDetails: null,
  isChecking: false,
  isUpdating: false,

  checkUpdate: async () => {
    try {
      set({ isChecking: true });
      const update = await check();
      if (update) {
        console.log(`Update ${update.version} found!`);
        set({ updateAvailable: true, updateDetails: update });
      } else {
        set({ updateAvailable: false, updateDetails: null });
      }
    } catch (err) {
      console.error("Failed to check for updates:", err);
    } finally {
      set({ isChecking: false });
    }
  },

  installUpdate: async () => {
    const { updateDetails } = get();
    if (!updateDetails) return;

    try {
      const yes = await ask(
        `Update to ${updateDetails.version} is available!\n\nRelease notes:\n${updateDetails.body}`,
        {
          title: "Update Available",
          kind: "info",
          okLabel: "Update Now",
          cancelLabel: "Cancel",
        },
      );

      if (yes) {
        set({ isUpdating: true });

        let downloaded = 0;
        let contentLength = 0;
        await updateDetails.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength || 0;
              console.log(`started downloading ${contentLength} bytes`);
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case "Finished":
              console.log("download finished");
              break;
          }
        });

        // Prompt the user to restart the application
        await message(
          "Update installed successfully. Please restart the application to apply the update.",
          { title: "Update Installed" },
        );

        set({ updateAvailable: false, updateDetails: null });
      }
    } catch (err) {
      console.error("Failed to install update:", err);
      await message(`Failed to install update: ${err}`, {
        title: "Update Error",
        kind: "error",
      });
    } finally {
      set({ isUpdating: false });
    }
  },
}));
