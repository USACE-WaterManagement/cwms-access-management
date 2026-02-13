interface NameFields {
  firstName?: string;
  lastName?: string;
}

export function formatFullName(user: NameFields): string {
  const first = user.firstName?.trim() || '';
  const last = user.lastName?.trim() || '';

  if (first && last) {
    return `${first} ${last}`;
  }

  if (first) return first;
  if (last) return last;

  return '-';
}
