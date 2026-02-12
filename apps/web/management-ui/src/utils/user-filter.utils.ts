interface UserLike {
  username: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export function filterUsers<T extends UserLike>(users: T[], searchTerm: string): T[] {
  if (!searchTerm) return users;

  const search = searchTerm.toLowerCase();

  return users.filter((user) => {
    return (
      user.username.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search)
    );
  });
}

export function formatDisplayName(user: { firstName?: string | null; lastName?: string | null }): string {
  const first = user.firstName?.trim() || '';
  const last = user.lastName?.trim() || '';

  if (first && last) {
    return `${first} ${last}`;
  }

  if (first) return first;
  if (last) return last;

  return '-';
}
