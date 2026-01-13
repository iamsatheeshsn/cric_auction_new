
import { MENU_ITEMS, ALL_ROLES } from '../config/menuItems';

export const getVisibleMenuItems = (user, permissions) => {
    // Calculate user role (fallback to SPECTATOR if none)
    const userRole = (user?.role || 'SPECTATOR').toUpperCase();

    // Safety check: if role not in known list, default to SPECTATOR
    const currentRole = ALL_ROLES.includes(userRole) ? userRole : 'SPECTATOR';

    // Get allowed items for this role
    const rolePermissions = permissions[currentRole];
    let allowedItems = [];

    if (Array.isArray(rolePermissions)) {
        // Legacy: Array of IDs
        allowedItems = rolePermissions;
    } else if (typeof rolePermissions === 'object' && rolePermissions !== null) {
        // New: Object { menuId: ['view', 'edit', ...] }
        // Item is allowed if it exists in map and has 'view' action (or 'view' is implied by presence if we simplify, but let's be strict)
        // For now, let's assume existence in key means 'view' OR explicit 'view' action.
        // Let's go with: Must have 'view' in the array.
        allowedItems = Object.keys(rolePermissions).filter(id =>
            rolePermissions[id]?.includes('view')
        );
    }

    // Filter Groups
    const visibleGroups = MENU_ITEMS.map(group => {
        // Filter sub-items
        const visibleSubItems = group.items.filter(item => allowedItems.includes(item.id));

        // Return group only if it has items OR if the group itself is allowed (if we restricted groups)
        // For this logic, we hide empty groups unless the group ID itself is explicitly allowed (rare case in current config)
        if (visibleSubItems.length === 0 && !allowedItems.includes(group.id)) return null;

        return {
            ...group,
            items: visibleSubItems
        };
    }).filter(Boolean);

    return visibleGroups;
};
