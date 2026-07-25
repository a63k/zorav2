export interface BunnyVideoMetadata {
  libraryId: string;
  videoId: string;
  title: string;
  length?: number;
  resolution?: string;
  playbackUrl: string;
  hlsUrl: string;
  directMp4Url: string;
  thumbnailUrl: string;
  status: 'created' | 'uploading' | 'encoding' | 'finished' | 'error';
  encodeProgress?: number;
}

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY || process.env.NEXT_PUBLIC_BUNNY_API_KEY || '';
const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '';
const BUNNY_PULL_ZONE_CDN = process.env.BUNNY_STREAM_CDN_URL || 'https://vz-zora-cdn.b-cdn.net';

export class BunnyStreamService {
  private apiKey: string;
  private libraryId: string;

  constructor(apiKey?: string, libraryId?: string) {
    this.apiKey = apiKey || BUNNY_API_KEY;
    this.libraryId = libraryId || BUNNY_LIBRARY_ID;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.libraryId);
  }

  public getLibraryId(): string {
    return this.libraryId;
  }

  /**
   * Create video entry in Bunny Stream Library
   */
  public async createVideo(title: string): Promise<{ videoId: string; libraryId: string }> {
    if (!this.isConfigured()) {
      // Mock video ID for testing environment without Bunny keys
      const mockVideoId = `bunny_vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      return { videoId: mockVideoId, libraryId: this.libraryId || 'demo_library' };
    }

    const url = `https://video.bunnycdn.com/library/${this.libraryId}/videos`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        AccessKey: this.apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Bunny Stream createVideo failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return { videoId: data.guid, libraryId: this.libraryId };
  }

  /**
   * Upload video binary content to Bunny Stream
   */
  public async uploadVideoBinary(
    libraryId: string,
    videoId: string,
    binaryData: ArrayBuffer | Buffer,
    onProgress?: (progressPercent: number) => void
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      // Simulate fast upload progress for demo
      if (onProgress) {
        onProgress(30);
        await new Promise((r) => setTimeout(r, 200));
        onProgress(70);
        await new Promise((r) => setTimeout(r, 200));
        onProgress(100);
      }
      return true;
    }

    const url = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

    // Node / Next API PUT fetch upload
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: this.apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: binaryData as any,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Bunny Stream upload binary failed (${res.status}): ${errText}`);
    }

    if (onProgress) onProgress(100);
    return true;
  }

  /**
   * Poll encoding status of uploaded video
   */
  public async checkVideoStatus(libraryId: string, videoId: string): Promise<BunnyVideoMetadata> {
    const playbackUrl = `https://player.mediadelivery.net/play/${libraryId}/${videoId}`;
    const hlsUrl = `${BUNNY_PULL_ZONE_CDN}/${videoId}/playlist.m3u8`;
    const directMp4Url = `${BUNNY_PULL_ZONE_CDN}/${videoId}/play_720p.mp4`;
    const thumbnailUrl = `${BUNNY_PULL_ZONE_CDN}/${videoId}/thumbnail.jpg`;

    if (!this.isConfigured()) {
      return {
        libraryId,
        videoId,
        title: 'Demo Stream',
        length: 120,
        resolution: '1080p',
        playbackUrl,
        hlsUrl,
        directMp4Url,
        thumbnailUrl,
        status: 'finished',
        encodeProgress: 100,
      };
    }

    const url = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        AccessKey: this.apiKey,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Bunny Stream check status failed: ${res.statusText}`);
    }

    const data = await res.json();
    // Bunny status code: 0 = Created, 1 = Uploading, 2 = Processing, 3 = Transcoding Finished, 4 = Error
    let status: BunnyVideoMetadata['status'] = 'created';
    if (data.status === 1) status = 'uploading';
    else if (data.status === 2) status = 'encoding';
    else if (data.status === 3) status = 'finished';
    else if (data.status === 4) status = 'error';

    return {
      libraryId,
      videoId,
      title: data.title || '',
      length: data.length,
      resolution: data.resolution,
      playbackUrl,
      hlsUrl,
      directMp4Url,
      thumbnailUrl,
      status,
      encodeProgress: data.encodeProgress || (status === 'finished' ? 100 : 50),
    };
  }

  /**
   * List all existing videos already uploaded to Bunny Stream Library
   */
  public async listLibraryVideos(): Promise<{ guid: string; title: string; length?: number }[]> {
    if (!this.isConfigured()) return [];

    try {
      const url = `https://video.bunnycdn.com/library/${this.libraryId}/videos?itemsPerPage=100`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          AccessKey: this.apiKey,
          accept: 'application/json',
        },
      });

      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        guid: item.guid,
        title: item.title,
        length: item.length,
      }));
    } catch (err) {
      console.error('Error fetching Bunny Stream library videos:', err);
      return [];
    }
  }
}
