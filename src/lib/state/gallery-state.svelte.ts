import type { GalleryPalette } from '#lib/utils/color-utils.js';
import {
  POPULAR_DAYS,
  type GalleryPageInfo,
  type GalleryProjectNode,
  type GallerySort,
  type PaletteGalleryNode,
} from '#lib/utils/gallery-utils.js';

/**
 * The filters and sort both pages share: someone looking for a yarn's popular
 * projects who switches to palettes is still looking for that yarn's popular ones.
 */
class GalleryFilters {
  search = $state('');
  filteredBrandId = $state('');
  filteredYarnId = $state('');
  palettesContainOnlyFilteredYarn = $state(false);
  orderBy = $state<GallerySort>('POPULAR');
  /** Popular counts views in the last … days */
  popularDays = $state(POPULAR_DAYS);

  /** The filters and sort as one value, to tell whether a page's results are for them */
  get key() {
    return JSON.stringify([
      this.search,
      this.filteredBrandId,
      this.filteredYarnId,
      this.palettesContainOnlyFilteredYarn,
      this.orderBy,
      this.orderBy === 'POPULAR' ? this.popularDays : null,
    ]);
  }

  get active() {
    return !!(this.search || this.filteredBrandId || this.filteredYarnId);
  }

  clear() {
    this.search = '';
    this.filteredBrandId = '';
    this.filteredYarnId = '';
    this.palettesContainOnlyFilteredYarn = false;
  }
}

export const galleryFilters = new GalleryFilters();

const getYarnSearch = ({
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

/** A tab's view of the shared filters */
class SharedFilters {
  get search() {
    return galleryFilters.search;
  }
  set search(value) {
    galleryFilters.search = value;
  }
  get filteredBrandId() {
    return galleryFilters.filteredBrandId;
  }
  set filteredBrandId(value) {
    galleryFilters.filteredBrandId = value;
  }
  get filteredYarnId() {
    return galleryFilters.filteredYarnId;
  }
  set filteredYarnId(value) {
    galleryFilters.filteredYarnId = value;
  }
  get palettesContainOnlyFilteredYarn() {
    return galleryFilters.palettesContainOnlyFilteredYarn;
  }
  set palettesContainOnlyFilteredYarn(value) {
    galleryFilters.palettesContainOnlyFilteredYarn = value;
  }
  get orderBy() {
    return galleryFilters.orderBy;
  }
  set orderBy(value) {
    galleryFilters.orderBy = value;
  }
  get popularDays() {
    return galleryFilters.popularDays;
  }
  set popularDays(value) {
    galleryFilters.popularDays = value;
  }
  /** The filters this page's results were found with */
  loadedFor = $state<string | null>(null);
  getYarnSearch = getYarnSearch;
}

class GalleryState extends SharedFilters {
  filteredPatternType = $state('');
  projects: GalleryProjectNode[] = $state([]);
  displayedProjects: GalleryProjectNode[] = $state([]);
  gallery: { pageInfo?: GalleryPageInfo } = $state({});
  layout = $state<'grid' | 'list'>('grid');
}

class YarnPaletteGalleryState extends SharedFilters {
  projects: PaletteGalleryNode[] = $state([]);
  palettes: GalleryPalette[] = $state([]);
  gallery: { pageInfo?: GalleryPageInfo } = $state({});
  layout = $state<'grid' | 'list'>('grid');
}

export const galleryState = new GalleryState();
export const yarnPaletteGalleryState = new YarnPaletteGalleryState();
