/**
 * ClipVault - Exclusions
 * Checks whether an application window is in the user's exclusion list.
 */

export class ExclusionFilter {
    constructor(excludedApps = []) {
        this._excludedApps = new Set(excludedApps.map(a => a.toLowerCase().trim()));
    }

    setExcludedApps(apps) {
        this._excludedApps = new Set((apps || []).map(a => a.toLowerCase().trim()));
    }

    /**
     * Check if a window or app ID should be excluded from clipboard capture.
     * @param {Meta.Window|string} target
     * @returns {boolean} true if excluded
     */
    isExcluded(target) {
        if (!target) return false;

        let identifiers = [];

        if (typeof target === 'string') {
            identifiers.push(target.toLowerCase());
        } else {
            // Meta.Window object
            try {
                if (typeof target.get_wm_class === 'function') {
                    const wmClass = target.get_wm_class();
                    if (wmClass) identifiers.push(wmClass.toLowerCase());
                }
                if (typeof target.get_gtk_application_id === 'function') {
                    const appId = target.get_gtk_application_id();
                    if (appId) identifiers.push(appId.toLowerCase());
                }
                if (typeof target.get_wm_class_instance === 'function') {
                    const instance = target.get_wm_class_instance();
                    if (instance) identifiers.push(instance.toLowerCase());
                }
            } catch (_) {}
        }

        for (const id of identifiers) {
            for (const excluded of this._excludedApps) {
                if (id.includes(excluded)) {
                    return true;
                }
            }
        }

        return false;
    }
}
