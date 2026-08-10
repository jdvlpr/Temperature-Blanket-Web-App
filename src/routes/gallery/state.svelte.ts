import type { GalleryPalette } from '$lib/utils/color-utils';
import type {
  GalleryPageInfo,
  GalleryProjectNode,
  PopularProject,
} from '$lib/utils/gallery-utils';

class GalleryState {
  search = $state('');
  filteredYarn = $state(null);
  filteredBrandId = $state('');
  filteredYarnId = $state('');
  palettesContainOnlyFilteredYarn = $state(false);
  filteredPatternType = $state('');
  orderBy = $state('DESC');
  projects: GalleryProjectNode[] = $state([]);
  displayedProjects: GalleryProjectNode[] = $state([]);
  popularProjects: PopularProject[] = $state([]);
  gallery: { pageInfo?: GalleryPageInfo } = $state({});
  timePeriod = $state(0.25);

  getYarnSearch = ({
    brandId,
    yarnId,
  }: {
    brandId: string;
    yarnId: string;
  }) => {
    if (brandId && yarnId) return `${brandId}-${yarnId}`;
    else if (brandId) return brandId;
    else if (yarnId) return yarnId;
    return '';
  };
}

class YarnPaletteGalleryState {
  search = $state('');
  filteredBrandId = $state('');
  filteredYarnId = $state('');
  palettesContainOnlyFilteredYarn = $state(false);
  orderBy = $state('DESC');
  projects: GalleryProjectNode[] = $state([]);
  palettes: GalleryPalette[] = $state([]);
  popularPalettes: GalleryPalette[] = $state([]);
  gallery: { pageInfo?: GalleryPageInfo } = $state({});
  timePeriod = $state(0.25);

  getYarnSearch = ({
    brandId,
    yarnId,
  }: {
    brandId: string;
    yarnId: string;
  }) => {
    if (brandId && yarnId) return `${brandId}-${yarnId}`;
    else if (brandId) return brandId;
    else if (yarnId) return yarnId;
    return '';
  };
}

export const galleryState = new GalleryState();
export const yarnPaletteGalleryState = new YarnPaletteGalleryState();
