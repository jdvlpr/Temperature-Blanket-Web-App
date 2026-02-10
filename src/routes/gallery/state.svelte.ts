class GalleryState {
  search = $state('');
  filteredYarn = $state(null);
  filteredBrandId = $state('');
  filteredYarnId = $state('');
  palettesContainOnlyFilteredYarn = $state(false);
  filteredPatternType = $state('');
  orderBy = $state('DESC');
  projects = $state([]);
  displayedProjects = $state([]);
  popularProjects = $state([]);
  globeData = $state([]);
  globeUpdatedAt = $state('');
  loadingGlobe = $state(true);
  loadingGlobeError = $state(false);
  gallery = $state({});
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
