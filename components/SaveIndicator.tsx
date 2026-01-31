import React, { useEffect, useState } from 'react';
import { Icons } from '../constants';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface SaveIndicatorProps {
    status: SaveStatus;
    lastSaved?: Date;
    onManualSave?: () => void;
}

/**
 * Visual indicator showing the current save status
 * Shows last saved time and allows manual save
 */
export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
    status,
    lastSaved,
    onManualSave
}) => {
    const [timeAgo, setTimeAgo] = useState<string>('');

    useEffect(() => {
        if (!lastSaved) return;

        const updateTimeAgo = () => {
            const now = new Date();
            const diffMs = now.getTime() - lastSaved.getTime();
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);

            if (diffSeconds < 60) {
                setTimeAgo('Just now');
            } else if (diffMinutes < 60) {
                setTimeAgo(`${diffMinutes}m ago`);
            } else if (diffHours < 24) {
                setTimeAgo(`${diffHours}h ago`);
            } else {
                setTimeAgo(lastSaved.toLocaleDateString());
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 30000);
        return () => clearInterval(interval);
    }, [lastSaved]);

    const statusConfig = {
        saved: {
            icon: Icons.Check,
            text: 'Saved',
            color: 'text-green-400',
            bg: 'bg-green-400/10',
        },
        saving: {
            icon: Icons.RotateCw,
            text: 'Saving...',
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
        },
        unsaved: {
            icon: Icons.Edit,
            text: 'Unsaved',
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
        },
        error: {
            icon: Icons.X,
            text: 'Error',
            color: 'text-red-400',
            bg: 'bg-red-400/10',
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${config.bg} ${config.color}
        transition-all duration-300
      `}
            role="status"
            aria-live="polite"
        >
            <Icon
                className={`w-4 h-4 ${status === 'saving' ? 'animate-spin' : ''}`}
                aria-hidden="true"
            />
            <span className="text-xs font-medium">{config.text}</span>

            {status === 'saved' && timeAgo && (
                <span className="text-xs text-gray-500">• {timeAgo}</span>
            )}

            {status === 'unsaved' && onManualSave && (
                <button
                    onClick={onManualSave}
                    className="ml-1 text-xs underline hover:no-underline"
                    aria-label="Save now"
                >
                    Save
                </button>
            )}
        </div>
    );
};

/**
 * Hook to manage save status
 */
export function useSaveStatus() {
    const [status, setStatus] = useState<SaveStatus>('saved');
    const [lastSaved, setLastSaved] = useState<Date>();

    const markUnsaved = () => setStatus('unsaved');
    const markSaving = () => setStatus('saving');
    const markSaved = () => {
        setStatus('saved');
        setLastSaved(new Date());
    };
    const markError = () => setStatus('error');

    return { status, lastSaved, markUnsaved, markSaving, markSaved, markError };
}

export default SaveIndicator;
