import { StreamStatusResponse } from '../types';
import { getPlatformIcon } from '../utils';

interface RtmpTargetItemProps {
  platform: string;
  currentStatus: StreamStatusResponse;
  stream: {
    customRtmpUrls?: Record<string, { url: string; key: string }>;
  };
}

const RtmpTargetItem = ({ platform, currentStatus, stream }: RtmpTargetItemProps) => {
  const showLive = currentStatus.status === 'LIVE';
  const urls = stream.customRtmpUrls?.[platform];
  const showUrls = !!urls;
  const url = urls?.url;
  const key = urls?.key;
  
  return (
    <div key={platform} className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 font-medium text-white">
          {getPlatformIcon(platform)} {platform}
        </span>
        {showLive ? <span className="badge-success">Connected</span> : null}
      </div>
      {showUrls && url && key && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-dark-400">
            <span>URL:</span>
            <code className="text-white break-all">{url}</code>
          </div>
          <div className="flex justify-between text-dark-400">
            <span>Key:</span>
            <code className="text-white">{key}</code>
          </div>
        </div>
      )}
    </div>
  );
};

export { RtmpTargetItem };
