import { reactive } from "vue";

interface GalleryState {
    [cellId: string]: {
        currentIndex: number;
        maxIndex: number;
    };
}

const galleryState = reactive<GalleryState>({});

export function useGalleryState() {
    const setGalleryIndex = (cellId: string, index: number, maxIndex: number) => {
        if (!galleryState[cellId]) {
            galleryState[cellId] = { currentIndex: 0, maxIndex: 0 };
        }
        galleryState[cellId].currentIndex = index;
        galleryState[cellId].maxIndex = maxIndex;
    };

    const getGalleryIndex = (cellId: string): number => {
        return galleryState[cellId]?.currentIndex ?? 0;
    };

    const getMaxGalleryIndex = (cellId: string): number => {
        return galleryState[cellId]?.maxIndex ?? 0;
    };

    const hasGalleryState = (cellId: string): boolean => {
        return cellId in galleryState;
    };

    const clearGalleryState = (cellId: string) => {
        if (galleryState[cellId]) {
            delete galleryState[cellId];
        }
    };

    const clearAllGalleryState = () => {
        Object.keys(galleryState).forEach((key) => {
            delete galleryState[key];
        });
    };

    return {
        setGalleryIndex,
        getGalleryIndex,
        getMaxGalleryIndex,
        hasGalleryState,
        clearGalleryState,
        clearAllGalleryState,
    };
}
