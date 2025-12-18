export function canAccessPanel(roles: string[]) {
  return roles.some(r => ['admin','monitor','billing','reader'].includes(r));
}
