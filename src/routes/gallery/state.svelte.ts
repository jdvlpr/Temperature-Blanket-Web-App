import type { GalleryPalette } from '#lib/utils/color-utils.js';
import type {
  GalleryOrder,
  GalleryPageInfo,
  GalleryProjectNode,
  PaletteGalleryNode,
  PopularProject,
} from '#lib/utils/gallery-utils.js';

/**
 * The filters both tabs share: someone looking for a yarn's projects who
 * switches to palettes is still looking for that yarn.
 */
class GalleryFilters {
  search = $state('');
  filteredBrandId = $state('');
  filteredYarnId = $state('');
  palettesContainOnlyFilteredYarn = $state(false);
  /** Popular in the last … months */
  timePeriod = $state(0.25);

  /** The filters as one value, to tell whether a tab's results are for them */
  get key() {
    return JSON.stringify([
      this.search,
      this.filteredBrandId,
      this.filteredYarnId,
      this.palettesContainOnlyFilteredYarn,
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
  get timePeriod() {
    return galleryFilters.timePeriod;
  }
  set timePeriod(value) {
    galleryFilters.timePeriod = value;
  }
  /** The filters this tab's results were found with */
  loadedFor = $state<string | null>(null);
  /** The popular period this tab's featured items are for */
  popularFor = $state<number | null>(null);
  getYarnSearch = getYarnSearch;
}

class GalleryState extends SharedFilters {
  filteredPatternType = $state('');
  orderBy = $state<GalleryOrder>('DESC');
  projects: GalleryProjectNode[] = $state([]);
  displayedProjects: GalleryProjectNode[] = $state([]);
  popularProjects: PopularProject[] = $state([]);
  gallery: { pageInfo?: GalleryPageInfo } = $state({});
  layout = $state<'grid' | 'list'>('grid');
}

class YarnPaletteGalleryState extends SharedFilters {
  orderBy = $state<GalleryOrder>('DESC');
  projects: PaletteGalleryNode[] = $state([]);
  palettes: GalleryPalette[] = $state([]);
  popularPalettes: GalleryPalette[] = $state([]);
  gallery: { pageInfo?: GalleryPageInfo } = $state({});
  layout = $state<'grid' | 'list'>('grid');
}

export const galleryState = new GalleryState();
export const yarnPaletteGalleryState = new YarnPaletteGalleryState();
