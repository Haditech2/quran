import { SettingsState, ProgressState, OfflineSurahManifest } from '@/types';
import { requestVoid } from '@/services/apiClient';

export async function syncDeviceState(params: {
  deviceId: string;
  settings: SettingsState;
  progress: ProgressState;
  downloads: OfflineSurahManifest[];
}): Promise<void> {
  try {
    await requestVoid(`/api/sync/progress/${params.deviceId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settings: params.settings,
        progress: params.progress,
        downloads: params.downloads,
      }),
    });
  } catch {
    return;
  }
}
