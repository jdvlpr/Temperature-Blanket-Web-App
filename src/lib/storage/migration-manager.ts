import { project } from '$lib/state';
import { ProjectStorage, type LocalStorageProject } from './projects';

const LEGACY_PROJECTS_KEY = 'projects';

export class MigrationManager {
  /**
   * Parses project ID from href search params
   */
  private static parseProjectIdFromHref(href: string | null): string | null {
    if (!href) return null;
    try {
      return new URL(href).searchParams.get('project');
    } catch {
      return null;
    }
  }

  /**
   * Migrate projects from localStorage to ProjectStorage (IndexedDB)
   */
  static async migrateFromLocalStorage(): Promise<void> {
    const legacyProjectsRaw = localStorage.getItem(LEGACY_PROJECTS_KEY);

    if (!legacyProjectsRaw) return;

    let parsed: LocalStorageProject[];
    try {
      parsed = JSON.parse(legacyProjectsRaw);
    } catch (e) {
      // console.error('Migration: Invalid JSON in legacy projects', e);
      localStorage.removeItem(LEGACY_PROJECTS_KEY);
      return;
    }

    if (!Array.isArray(parsed) || !parsed.length || !parsed[0]) {
      localStorage.removeItem(LEGACY_PROJECTS_KEY);
      return;
    }

    // Backup projects for potential error recovery
    if (!project.status.temporaryProjectsBackup.length) {
      project.status.temporaryProjectsBackup = parsed;
    }

    if (!ProjectStorage.isAvailable()) {
      throw new Error(
        'Migration: IndexedDB is not available. Cannot migrate projects.',
      );
    }

    const migratedIds: string[] = [];
    const failedProjects: { title: string; error: string }[] = [];

    for (const legacyProject of parsed) {
      try {
        const id =
          this.parseProjectIdFromHref(legacyProject.href) ||
          crypto.randomUUID();

        // Check if already exists to avoid unnecessary writes
        const existing = await ProjectStorage.getById(id);
        if (!existing) {
          await ProjectStorage.save(id, legacyProject);
        }
        migratedIds.push(id);
      } catch (err: any) {
        // console.error(
        //   `Migration: Failed for project "${legacyProject.title}"`,
        //   err,
        // );
        failedProjects.push({
          title: legacyProject.title || 'Untitled',
          error: err.message || 'Unknown error',
        });
      }
    }

    // Success condition: All projects were migrated (or already existed)
    if (migratedIds.length === parsed.length) {
      localStorage.removeItem(LEGACY_PROJECTS_KEY);
    } else {
      const errorMsg = `Migration: Only ${migratedIds.length} of ${parsed.length} projects were migrated. Errors: ${failedProjects.map((f) => f.title).join(', ')}`;
      // console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
}
