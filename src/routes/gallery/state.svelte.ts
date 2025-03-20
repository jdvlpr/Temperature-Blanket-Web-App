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
  gallery = $state({});
  timePeriod = $state(0.25);

  getYarnSearch = ({ brandId, yarnId }) => {
    if (brandId && yarnId) return `${brandId}-${yarnId}`;
    else if (brandId) return brandId;
    else if (yarnId) return yarnId;
    return '';
  };
}

export const galleryState = new GalleryState();
